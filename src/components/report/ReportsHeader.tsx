
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReportsHeaderProps {
  onRefresh: () => void;
}

const ReportsHeader = ({ onRefresh }: ReportsHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold">Mis informes de visibilidad</h1>
      <div className="flex gap-2">
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
        <Button onClick={() => navigate("/informe/formulario")} size="sm">
          Nuevo informe
        </Button>
      </div>
    </div>
  );
};

export default ReportsHeader;
