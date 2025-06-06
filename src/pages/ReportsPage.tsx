
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportPageHeader from "@/components/report/ReportPageHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ReportsHeader from "@/components/report/ReportsHeader";
import LoadingState from "@/components/report/LoadingState";
import EmptyReportState from "@/components/report/EmptyReportState";
import ReportCardGrid from "@/components/report/ReportCardGrid";
import { Report } from "@/components/report/ReportCard";

const ReportsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingReports, setProcessingReports] = useState<string[]>([]);

  // Force an initial refresh when the page loads
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Initial fetch
    fetchReports();
    
    // Immediate refresh to ensure we get the latest data
    const initialRefreshTimeout = setTimeout(() => {
      fetchReports(false);
    }, 1000);

    // Subscribe to real-time updates for progress
    const channel = supabase
      .channel('public:brand_questionnaires')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'brand_questionnaires',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log("Received update for questionnaire:", payload.new);
          
          // Update the report in the list when progress changes
          setReports(prevReports => prevReports.map(report => {
            if (report.id === payload.new.id) {
              // If processing completes, remove from processing list
              if (payload.new.status !== 'processing' && processingReports.includes(report.id)) {
                setProcessingReports(prev => prev.filter(id => id !== report.id));
              }
              
              // Keep the existing batch info to avoid UI flicker
              return {
                ...report,
                ...payload.new,
                batch_info: report.batch_info // preserve existing batch info
              };
            }
            return report;
          }));
          
          // Force refresh reports if status changed to ensure we get latest batch info
          if (payload.new.status !== payload.old.status) {
            console.log("Status changed, refreshing reports");
            fetchReports(false); 
          }
        }
      )
      .subscribe();

    // Setup a refresh interval to keep data fresh
    const intervalId = setInterval(() => {
      fetchReports(false); // Silent refresh (don't show loading state)
    }, 5000); // Refresh every 5 seconds (faster refresh rate)

    return () => {
      clearTimeout(initialRefreshTimeout);
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [user, navigate, processingReports]);

  const fetchReports = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      console.log("Fetching reports...");

      // Get reports data
      const { data, error } = await supabase
        .from('brand_questionnaires')
        .select(`
          id,
          brand_name,
          created_at,
          status,
          error_message,
          progress_percent,
          final_reports(pdf_url, status),
          prompt_batches(id, batch_number, status)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        setReports([]);
        return;
      }

      console.log("Raw reports data:", data);

      // Format reports data - use type assertion since we know the structure
      const formattedReports = data.map((report: any) => {
        // Calculate batch info
        const batches = report.prompt_batches || [];
        const completedBatches = batches.filter((b: any) => b.status === 'complete').length;
        const totalBatches = batches.length;
        const nextBatch = batches.find((b: any) => b.status === 'pending' || b.status === 'error');
        const allBatchesProcessed = completedBatches === totalBatches && totalBatches > 0;

        // Set status to pending if we have completed batches but not all of them
        // and there's currently no active processing happening
        let status = report.status;
        
        // If all batches are complete, ensure status is ready or go with what's in final_reports
        if (allBatchesProcessed) {
          status = report.final_reports?.[0]?.status || 'ready';
        }
        // If we have a mix of complete and non-complete batches and no active processing,
        // set to pending to allow continuing
        else if (completedBatches > 0 && !allBatchesProcessed && status === 'processing') {
          // Check if there's any batch currently processing
          const isAnyBatchProcessing = batches.some((b: any) => b.status === 'processing');
          
          // If no batch is processing, set to pending to allow continuing
          if (!isAnyBatchProcessing && report.progress_percent === 0) {
            status = 'pending';
          }
        }
        
        // Extract PDF URL from final_reports and log it for debugging
        const pdfUrl = report.final_reports?.[0]?.pdf_url || null;
        if (pdfUrl) {
          console.log(`Report ${report.id} has PDF URL: ${pdfUrl}`);
        } else {
          console.log(`Report ${report.id} has no PDF URL`);
        }
        
        const formatted = {
          id: report.id,
          brand_name: report.brand_name,
          status: status as Report["status"],
          created_at: report.created_at,
          pdf_url: pdfUrl,
          error_message: report.error_message,
          progress_percent: report.progress_percent,
          batch_info: {
            completed: completedBatches,
            total: totalBatches || 0,
            next_batch_id: nextBatch?.id,
            next_batch_number: nextBatch?.batch_number,
            all_batches_processed: allBatchesProcessed
          }
        };

        console.log(`Formatted report ${formatted.id}:`, {
          status: formatted.status,
          batches: `${completedBatches}/${totalBatches}`,
          allBatchesProcessed,
          progress: formatted.progress_percent,
          pdfUrl: formatted.pdf_url // Log PDF URL for debugging
        });
        
        return formatted;
      });

      setReports(formattedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      if (showLoading) {
        toast.error("Error al cargar los informes. Por favor inténtalo de nuevo.");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleRetry = async (reportId: string) => {
    try {
      // Update status to pending
      await supabase
        .from('brand_questionnaires')
        .update({ status: 'pending', error_message: null, progress_percent: 0 })
        .eq('id', reportId);

      // Trigger the NEW report generation edge function - Always use V2
      const { error: functionError } = await supabase.functions.invoke('generar-reporte-chatgpt-v2', {
        body: { questionnaireId: reportId }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      toast.success("Procesamiento reiniciado. El informe estará listo pronto.");
      
      // Refresh reports list
      fetchReports();
    } catch (error) {
      console.error("Error retrying report:", error);
      toast.error("Error al reintentar el informe. Por favor inténtalo de nuevo.");
    }
  };

  // Function to regenerate reports that might have expired URLs
  const handleRegenerateReports = async () => {
    try {
      // Find all reports with status "ready"
      const readyReports = reports.filter(r => r.status === "ready");
      
      if (readyReports.length === 0) {
        toast.info("No hay informes para regenerar.");
        return;
      }
      
      toast.info(`Regenerando ${readyReports.length} informes...`);
      
      for (const report of readyReports) {
        // Update to pending to trigger regeneration
        await supabase
          .from('brand_questionnaires')
          .update({ status: 'pending', error_message: null, progress_percent: 0 })
          .eq('id', report.id);
          
        // Trigger regeneration using V2
        await supabase.functions.invoke('generar-reporte-chatgpt-v2', {
          body: { questionnaireId: report.id }
        });
      }
      
      toast.success(`${readyReports.length} informes en proceso de regeneración.`);
      
      // Refresh reports
      fetchReports();
    } catch (error) {
      console.error("Error regenerating reports:", error);
      toast.error("Error al regenerar informes. Por favor inténtalo de nuevo.");
    }
  };

  const handleProcessNextBatch = async (reportId: string) => {
    try {
      // Prevent double-processing
      if (processingReports.includes(reportId)) {
        toast.info("Ya se está procesando este grupo de preguntas. Por favor espera.");
        return;
      }
      
      // Add to processing list
      setProcessingReports(prev => [...prev, reportId]);
      
      const report = reports.find(r => r.id === reportId);
      if (!report || !report.batch_info) {
        throw new Error("No se encontró información de grupos de preguntas para este informe");
      }

      toast.info(`Procesando el grupo ${report.batch_info.completed + 1} de ${report.batch_info.total}...`);

      console.log(`Processing next batch for report ${reportId}`);

      // Explicitly ensure we're in processing state in the UI
      setReports(prevReports => prevReports.map(r => 
        r.id === reportId ? { ...r, status: 'processing' as const } : r
      ));

      // Update status to processing to show progress indicator
      await supabase
        .from('brand_questionnaires')
        .update({ status: 'processing' })
        .eq('id', reportId);

      // Invoke edge function to process next batch
      const { data, error: functionError } = await supabase.functions.invoke('process-next-batch', {
        body: { questionnaireId: reportId }
      });

      console.log("Process next batch response:", data);

      if (functionError) {
        throw new Error(functionError.message);
      }

      // Refresh reports list
      fetchReports();
    } catch (error) {
      console.error("Error processing next batch:", error);
      toast.error("Error al procesar el siguiente grupo de preguntas. Por favor inténtalo de nuevo.");
      
      // Remove from processing list
      setProcessingReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleProcessAllBatches = async (reportId: string) => {
    try {
      toast.info("Procesando todos los grupos de preguntas automáticamente...");

      // Add to processing list
      setProcessingReports(prev => [...prev, reportId]);

      // Update status to processing
      await supabase
        .from('brand_questionnaires')
        .update({ status: 'processing' })
        .eq('id', reportId);

      // Invoke edge function to process all batches
      const { error: functionError } = await supabase.functions.invoke('process-all-batches', {
        body: { questionnaireId: reportId }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      toast.success("Procesamiento automático iniciado. El informe estará listo pronto.");
      
      // Refresh reports list
      fetchReports();
    } catch (error) {
      console.error("Error processing all batches:", error);
      toast.error("Error al procesar todos los grupos de preguntas. Por favor inténtalo de nuevo.");
      
      // Remove from processing list
      setProcessingReports(prev => prev.filter(id => id !== reportId));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ReportPageHeader />
      <main className="flex-grow py-10 bg-gray-50">
        <div className="container-custom">
          <ReportsHeader onRefresh={fetchReports} />

          {loading ? (
            <LoadingState />
          ) : reports.length === 0 ? (
            <EmptyReportState />
          ) : (
            <>
              {/* Add a button to regenerate reports if needed */}
              <div className="mb-4 flex justify-end">
                <Button 
                  onClick={handleRegenerateReports}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar enlaces de informes
                </Button>
              </div>
              
              <ReportCardGrid 
                reports={reports} 
                onRetry={handleRetry} 
                onProcessNextBatch={handleProcessNextBatch} 
                onProcessAllBatches={handleProcessAllBatches} 
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportsPage;
