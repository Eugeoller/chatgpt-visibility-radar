
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Eye, Download, ExternalLink, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReportViewerProps {
  reportUrl: string | null;
  brandName: string;
}

const ReportViewer = ({ reportUrl, brandName }: ReportViewerProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
    }
  }, [open]);

  if (!reportUrl) {
    return null;
  }

  const openExternalLink = () => {
    window.open(reportUrl, "_blank");
    toast.success("Informe abierto en una nueva pestaña");
  };

  const handleDownloadPDF = () => {
    // Convert HTML to PDF using browser's print functionality
    const printWindow = window.open(reportUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
          toast.success("Descarga de PDF iniciada");
        }, 1000);
      });
    } else {
      toast.error("No se pudo abrir la ventana de impresión. Por favor, comprueba el bloqueador de ventanas emergentes.");
    }
  };

  const copyReportLink = () => {
    navigator.clipboard.writeText(reportUrl);
    setCopySuccess(true);
    toast.success("Enlace copiado al portapapeles");
    
    // Reset the success message after 2 seconds
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-3 w-full">
      <Button 
        onClick={() => setOpen(true)} 
        className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
      >
        <Eye className="h-5 w-5 mr-2" />
        Ver informe completo
      </Button>
      
      <div className="grid grid-cols-2 gap-2">
        <Button 
          onClick={handleDownloadPDF} 
          variant="outline" 
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar PDF
        </Button>
        
        <Button onClick={openExternalLink} variant="outline" className="border-green-200">
          <ExternalLink className="h-4 w-4 mr-2" />
          Nueva pestaña
        </Button>
      </div>

      {/* Link to access report results directly */}
      <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-gray-700 mb-1">Enlace directo:</p>
            <div className="flex items-center">
              <Link className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
              <a 
                href={reportUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm truncate"
              >
                {reportUrl}
              </a>
            </div>
          </div>
          <Button 
            onClick={copyReportLink} 
            variant="ghost" 
            size="sm" 
            className="ml-2 flex-shrink-0"
          >
            {copySuccess ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] max-h-[800px]">
          <DialogHeader>
            <DialogTitle>Informe de {brandName}</DialogTitle>
          </DialogHeader>
          
          <div className="relative h-full overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
            
            <div className="h-full overflow-auto">
              <iframe 
                src={reportUrl}
                className="w-full h-full border-0"
                onLoad={() => setIsLoading(false)}
                title={`Informe de ${brandName}`}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportViewer;
