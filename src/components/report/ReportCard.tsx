
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, FileIcon, Loader2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export type ReportStatus = "processing" | "ready" | "error";

export interface Report {
  id: string;
  brand_name: string;
  status: ReportStatus;
  created_at: string;
  pdf_url: string | null;
  error_message: string | null;
  progress_percent?: number;
}

export const statusConfig = {
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
}

const ReportCard = ({ report, onRetry }: ReportCardProps) => {
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

  return (
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
          Creado el {formatDate(report.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {report.status === "error" && (
          <p className="text-sm text-red-500">
            Error: {report.error_message || "Ha ocurrido un error al procesar el informe."}
          </p>
        )}
        {report.status === "processing" && (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Estamos generando tu informe. Este proceso puede tardar varios minutos.
            </p>
            <div className="space-y-2">
              <Progress value={report.progress_percent || 0} className="h-2" />
              <p className="text-xs text-gray-500 text-right">
                {report.progress_percent ? `${Math.round(report.progress_percent)}% completado` : 'Iniciando...'}
              </p>
            </div>
          </>
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
            onClick={() => onRetry(report.id)} 
            variant="outline" 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar con V2
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
  );
};

export default ReportCard;
