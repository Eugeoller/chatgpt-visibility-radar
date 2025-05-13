
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EmptyReportState = () => {
  const navigate = useNavigate();
  
  return (
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
  );
};

export default EmptyReportState;
