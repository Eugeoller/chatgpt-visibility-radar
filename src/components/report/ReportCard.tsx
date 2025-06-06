import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, ExternalLink, FileIcon, Loader2, Play, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ReportViewer from "./ReportViewer";
import { toast } from "sonner";

export type ReportStatus = "processing" | "ready" | "error" | "pending";

export interface Report {
  id: string;
  brand_name: string;
  status: ReportStatus;
  created_at: string;
  pdf_url: string | null;
  error_message: string | null;
  progress_percent?: number;
  batch_info?: {
    completed: number;
    total: number;
    next_batch_id?: string;
    next_batch_number?: number;
    all_batches_processed?: boolean;
  };
}

export const statusConfig: Record<ReportStatus, { label: string; color: string; icon: ReactNode }> = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Play className="h-4 w-4" />
  },
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

interface ReportCardProps {
  report: Report;
  onRetry: (reportId: string) => void;
  onProcessNextBatch?: (reportId: string) => void;
  onProcessAllBatches?: (reportId: string) => void;
}

const ReportCard = ({ report, onRetry, onProcessNextBatch, onProcessAllBatches }: ReportCardProps) => {
  // Function to format date in a more user-friendly way
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Ensure we have a valid status by defaulting to 'pending' if the status is invalid
  const status = Object.keys(statusConfig).includes(report.status) ? report.status : 'pending';
  const statusDetails = statusConfig[status as ReportStatus];

  // Determine if there are unprocessed batches
  const hasUnprocessedBatches = report.batch_info && 
    report.batch_info.completed < report.batch_info.total;

  // Check if we should show the process buttons
  // Show if there are unprocessed batches and not in "ready" or "error" state
  const shouldShowProcessButtons = hasUnprocessedBatches && 
    status !== "ready" && 
    status !== "error";

  // Helper to determine if actively processing (prevents showing next batch button during active processing)
  const isActivelyProcessing = status === "processing" && 
    (report.progress_percent !== undefined && report.progress_percent > 0 && report.progress_percent < 100);

  console.log(`Report ${report.id} - Status: ${status}, Batches: ${report.batch_info?.completed}/${report.batch_info?.total}, ShowButtons: ${shouldShowProcessButtons}, ActivelyProcessing: ${isActivelyProcessing}`);

  // Function to handle direct download of the report
  const handleDownload = () => {
    if (report.pdf_url) {
      const link = document.createElement('a');
      link.href = report.pdf_url;
      link.download = `informe-${report.brand_name.toLowerCase().replace(/\s+/g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Function to copy report link to clipboard
  const copyReportLink = () => {
    if (report.pdf_url) {
      navigator.clipboard.writeText(report.pdf_url);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  return (
    <Card key={report.id} className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{report.brand_name}</CardTitle>
          <Badge 
            className={`${statusDetails.color}`}
          >
            <span className="flex items-center gap-1">
              {statusDetails.icon}
              {statusDetails.label}
            </span>
          </Badge>
        </div>
        <CardDescription>
          Creado el {formatDate(report.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {status === "error" && (
          <p className="text-sm text-red-500">
            Error: {report.error_message || "Ha ocurrido un error al procesar el informe."}
          </p>
        )}
        {status === "processing" && (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Estamos generando tu informe. Este proceso puede tardar varios minutos.
            </p>
            <div className="space-y-2">
              <Progress value={report.progress_percent || 0} className="h-2" />
              <p className="text-xs text-gray-500 text-right">
                {report.progress_percent ? `${Math.round(report.progress_percent)}% completado` : 'Iniciando...'}
              </p>
              {report.batch_info && (
                <p className="text-xs text-gray-600 text-center mt-2">
                  {report.batch_info.completed} de {report.batch_info.total} grupos de preguntas completados
                </p>
              )}
            </div>
          </>
        )}
        {status === "pending" && (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Tu informe está listo para continuar con el procesamiento.
            </p>
            {report.batch_info && (
              <p className="text-xs text-gray-600 text-center mt-2">
                {report.batch_info.completed} de {report.batch_info.total} grupos de preguntas completados
              </p>
            )}
          </>
        )}
        {status === "ready" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-3">
              Tu informe está listo para ver.
            </p>
            
            {report.pdf_url && (
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md overflow-hidden">
                <input 
                  type="text" 
                  value={report.pdf_url} 
                  readOnly 
                  className="text-xs bg-transparent flex-grow truncate outline-none"
                />
                <Button 
                  onClick={copyReportLink}
                  variant="ghost"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {status === "error" && (
          <Button 
            onClick={() => onRetry(report.id)} 
            variant="outline" 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar con V2
          </Button>
        )}
        
        {isActivelyProcessing && (
          <Button variant="outline" disabled className="w-full">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Procesando...
          </Button>
        )}
        
        {shouldShowProcessButtons && !isActivelyProcessing && (
          <div className="w-full space-y-2">
            <Button 
              onClick={() => onProcessNextBatch && onProcessNextBatch(report.id)} 
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Procesar siguientes 20 preguntas
            </Button>
            <Button 
              onClick={() => onProcessAllBatches && onProcessAllBatches(report.id)} 
              variant="outline" 
              className="w-full"
            >
              Procesar todas las preguntas automáticamente
            </Button>
          </div>
        )}
        
        {status === "ready" && report.pdf_url && (
          <div className="mt-4 pt-4 border-t border-gray-100 w-full">
            <ReportViewer reportUrl={report.pdf_url} brandName={report.brand_name} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ReportCard;
