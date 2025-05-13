
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, FileIcon, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ReportPageHeader from "@/components/report/ReportPageHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type ReportStatus = "processing" | "ready" | "error";

interface Report {
  id: string;
  brand_name: string;
  status: ReportStatus;
  created_at: string;
  pdf_url: string | null;
  error_message: string | null;
}

const statusConfig = {
  processing: {
    label: "Procesando",
    color: "bg-blue-100 text-blue-800",
    icon: <Loader2 className="h-4 w-4 animate-spin" />
  },
  ready: {
    label: "Listo",
    color: "bg-green-100 text-green-800",
    icon: <FileIcon className="h-4 w-4" />
  },
  error: {
    label: "Error",
    color: "bg-red-100 text-red-800",
    icon: <RefreshCw className="h-4 w-4" />
  }
};

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
  }, [user, navigate]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Get reports data
      const { data: reportsData, error: reportsError } = await supabase
        .from('brand_questionnaires')
        .select(`
          id,
          brand_name,
          created_at,
          status,
          error_message,
          final_reports(pdf_url, status)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (reportsError) {
        throw new Error(reportsError.message);
      }

      // Format reports data
      const formattedReports = reportsData.map((report) => ({
        id: report.id,
        brand_name: report.brand_name,
        status: (report.final_reports?.[0]?.status || report.status) as ReportStatus,
        created_at: report.created_at,
        pdf_url: report.final_reports?.[0]?.pdf_url || null,
        error_message: report.error_message
      }));

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
        .update({ status: 'pending', error_message: null })
        .eq('id', reportId);

      // Trigger the report generation edge function
      const { error: functionError } = await supabase.functions.invoke('generar-reporte-chatgpt', {
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

  return (
    <div className="min-h-screen flex flex-col">
      <ReportPageHeader />
      <main className="flex-grow py-10 bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Mis informes de visibilidad</h1>
            <div className="flex gap-2">
              <Button onClick={fetchReports} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button onClick={() => navigate("/informe/formulario")} size="sm">
                Nuevo informe
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-bright" />
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-10">
                <FileIcon className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tienes informes aún</h3>
                <p className="text-gray-500 mb-4 text-center">
                  Solicita tu primer informe de visibilidad en ChatGPT para ver cómo aparece tu marca.
                </p>
                <Button onClick={() => navigate("/informe/formulario")}>
                  Crear informe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Card key={report.id} className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{report.brand_name}</CardTitle>
                      <Badge 
                        className={`${statusConfig[report.status].color}`}
                      >
                        <span className="flex items-center gap-1">
                          {statusConfig[report.status].icon}
                          {statusConfig[report.status].label}
                        </span>
                      </Badge>
                    </div>
                    <CardDescription>
                      Creado el {new Date(report.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {report.status === "error" && (
                      <p className="text-sm text-red-500">
                        Error: {report.error_message || "Ha ocurrido un error al procesar el informe."}
                      </p>
                    )}
                    {report.status === "processing" && (
                      <p className="text-sm text-gray-600">
                        Estamos generando tu informe. Este proceso puede tardar varios minutos.
                      </p>
                    )}
                    {report.status === "ready" && (
                      <p className="text-sm text-gray-600">
                        Tu informe está listo para descargar.
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    {report.status === "error" && (
                      <Button 
                        onClick={() => handleRetry(report.id)} 
                        variant="outline" 
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                      </Button>
                    )}
                    {report.status === "processing" && (
                      <Button variant="outline" disabled className="w-full">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </Button>
                    )}
                    {report.status === "ready" && report.pdf_url && (
                      <Button 
                        onClick={() => window.open(report.pdf_url!, "_blank")}
                        className="w-full"
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Ver informe
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportsPage;
