
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const benefits = [
  "+100 preguntas personalizadas",
  "Análisis de visibilidad real",
  "Competidores que sí están apareciendo",
  "Recomendaciones de contenido para mejorar",
  "Informe visual (PDF descargable)",
  "Acceso a dashboard privado"
];

const OfferBlock = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="heading-lg text-navy mb-4">Tu informe de visibilidad en ChatGPT</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Un análisis completo y personalizado para tu marca
          </p>
        </div>
        
        <Card className="border-blue-bright/20 overflow-hidden shadow-lg">
          <div className="bg-navy text-white p-8 text-center">
            <h2 className="heading-md mb-2">Un informe completo, personalizado y listo para accionar</h2>
            <p className="text-gray-300">
              Recibirás el informe completo en menos de 72 horas, junto con un plan de acción basado en IA.
            </p>
          </div>
          
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="text-blue-bright h-5 w-5 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-8 mt-4">
              <div className="flex flex-col items-center">
                <p className="text-lg font-medium mb-2">Precio:</p>
                <p className="text-4xl font-bold text-navy mb-4">49 €</p>
                <p className="text-sm text-gray-500 mb-6">(pago único)</p>
                <Button className="btn-primary text-lg w-full md:w-auto md:px-12 py-6 mb-4">
                  Solicitar ahora por 49 €
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-4">
                  <ShieldCheck className="h-4 w-4 text-blue-bright" />
                  <span>Pago 100% seguro</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default OfferBlock;
