
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Eye, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReportViewerProps {
  reportUrl: string | null;
  brandName: string;
}

const ReportViewer = ({ reportUrl, brandName }: ReportViewerProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
