
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        <Eye className="h-4 w-4 mr-2" />
        Ver informe
      </Button>

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
    </>
  );
};

export default ReportViewer;
