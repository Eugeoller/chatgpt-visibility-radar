
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Clock, AlertTriangle } from "lucide-react";

const reasons = [
  {
    icon: <Users className="h-12 w-12 text-blue-bright" />,
    title: "Confianza creciente en la IA",
    description: "Cada mes aumenta un 15% el número de usuarios que consultan ChatGPT antes de decidir qué comprar."
  },
  {
    icon: <TrendingUp className="h-12 w-12 text-blue-bright" />,
    title: "Ventaja competitiva crítica",
    description: "Si tus competidores aparecen y tú no, están ganando clientes mientras lees esto."
  },
  {
    icon: <Clock className="h-12 w-12 text-blue-bright" />,
    title: "Ventana de oportunidad limitada",
    description: "Posicionarse ahora es más fácil y económico que esperar a que todos estén compitiendo."
  },
  {
    icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
    title: "Riesgo de invisibilidad digital",
    description: "No saber si apareces en ChatGPT es como no saber si apareces en Google hace 10 años."
  }
];

const WhyImportant = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="heading-lg text-navy mb-4">¿Por qué es urgente actuar ahora?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            La batalla por la visibilidad en ChatGPT ya ha comenzado
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reasons.map((reason, index) => (
            <Card key={index} className="border-gray-100 bg-gray-50/50 transition-all hover:shadow-md">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="mb-4">{reason.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-navy">{reason.title}</h3>
                <p className="text-gray-600">{reason.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyImportant;
