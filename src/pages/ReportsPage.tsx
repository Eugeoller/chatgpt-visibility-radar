
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchReports();

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
          // Update the report in the list when progress changes
          setReports(prevReports => prevReports.map(report => {
            if (report.id === payload.new.id) {
              return {
                ...report,
                status: payload.new.status,
                progress_percent: payload.new.progress_percent,
                error_message: payload.new.error_message
              };
            }
            return report;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchReports = async () => {
    try {
      setLoading(true);

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

      // Format reports data - use type assertion since we know the structure
      const formattedReports = data.map((report: any) => {
        // Calculate batch info
        const batches = report.prompt_batches || [];
        const completedBatches = batches.filter((b: any) => b.status === 'complete').length;
        const totalBatches = batches.length;
        const nextBatch = batches.find((b: any) => b.status === 'pending' || b.status === 'error');
        const allBatchesProcessed = completedBatches === totalBatches && totalBatches > 0;

        // Set status to pending if we have completed batches but not all of them
        let status = report.status;
        if (completedBatches > 0 && !allBatchesProcessed && status !== 'processing') {
          status = 'pending';
        }
        
        return {
          id: report.id,
          brand_name: report.brand_name,
          status: (report.final_reports?.[0]?.status || status) as Report["status"],
          created_at: report.created_at,
          pdf_url: report.final_reports?.[0]?.pdf_url || null,
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
      });

      setReports(formattedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Error al cargar los informes. Por favor inténtalo de nuevo.");
    } finally {
      setLoading(false);
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

  const handleProcessNextBatch = async (reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report || !report.batch_info) {
        throw new Error("No se encontró información de lotes para este informe");
      }

      toast.info(`Procesando lote ${report.batch_info.completed + 1} de ${report.batch_info.total}...`);

      // Invoke edge function to process next batch
      const { error: functionError } = await supabase.functions.invoke('process-next-batch', {
        body: { questionnaireId: reportId }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      // Refresh reports list
      fetchReports();
    } catch (error) {
      console.error("Error processing next batch:", error);
      toast.error("Error al procesar el siguiente lote. Por favor inténtalo de nuevo.");
    }
  };

  const handleProcessAllBatches = async (reportId: string) => {
    try {
      toast.info("Procesando todos los lotes automáticamente...");

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
      toast.error("Error al procesar todos los lotes. Por favor inténtalo de nuevo.");
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
            <ReportCardGrid 
              reports={reports} 
              onRetry={handleRetry} 
              onProcessNextBatch={handleProcessNextBatch} 
              onProcessAllBatches={handleProcessAllBatches} 
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportsPage;
