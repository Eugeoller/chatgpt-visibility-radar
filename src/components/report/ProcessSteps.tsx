
import { Card, CardContent } from "@/components/ui/card";
import { 
  Check, 
  FileQuestion, 
  MessageSquareText, 
  Search, 
  Award, 
  BarChart4, 
  ArrowRight 
} from "lucide-react";

const steps = [
  {
    icon: <FileQuestion className="h-10 w-10 text-blue-bright" />,
    title: "Cuestionario inicial",
    description: "Comenzamos con un cuestionario donde nos cuentas sobre tu marca, tu sector y tus competidores."
  },
  {
    icon: <MessageSquareText className="h-10 w-10 text-blue-bright" />,
    title: "Generación de preguntas",
    description: "A partir de eso, generamos más de 100 preguntas reales que simulan lo que los usuarios preguntan en ChatGPT sobre tu categoría."
  },
  {
    icon: <Search className="h-10 w-10 text-blue-bright" />,
    title: "Análisis de visibilidad",
    description: "Enviamos esas preguntas a la IA y analizamos si tu marca aparece, cómo lo hace, y frente a quién compite."
  },
  {
    icon: <Award className="h-10 w-10 text-blue-bright" />,
    title: "Identificación de competencia",
    description: "Identificamos qué marcas están siendo recomendadas y en qué tipo de consultas."
  },
  {
    icon: <BarChart4 className="h-10 w-10 text-blue-bright" />,
    title: "Informe y plan de acción",
    description: "Generamos un informe completo visual + plan de acción estratégico."
  },
  {
    icon: <Check className="h-10 w-10 text-blue-bright" />,
    title: "Acceso permanente",
    description: "Todo queda guardado en tu dashboard para acceder y comparar siempre que quieras."
  }
];

const ProcessSteps = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="heading-lg text-navy mb-4">Esto es lo que haremos por ti</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Un proceso completo y detallado para analizar tu visibilidad en ChatGPT
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="border-gray-200 transition-all hover:shadow-md">
              <CardContent className="p-6 flex flex-col items-start">
                <div className="mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-navy">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="flex justify-end w-full mt-4">
                    <ArrowRight className="text-blue-bright h-5 w-5" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;
