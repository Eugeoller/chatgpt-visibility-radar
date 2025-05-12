
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Star, Lock, AlertCircle } from "lucide-react";

const benefits = [
  "+100 preguntas personalizadas",
  "Análisis de visibilidad real",
  "Competidores que sí están apareciendo",
  "Recomendaciones de contenido para mejorar",
  "Informe visual (PDF descargable)",
  "Acceso a dashboard privado"
];

const testimonials = [
  {
    quote: "Gracias al informe descubrimos que nuestra marca no aparecía en preguntas clave que nuestros clientes hacen en ChatGPT. Lo solucionamos y ahora tenemos más visibilidad.",
    author: "Laura M., Directora de Marketing"
  }
];

const OfferBlock = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="heading-lg text-navy mb-4">Obtén tu informe de visibilidad en ChatGPT</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Un análisis completo y personalizado para tu marca
          </p>
        </div>
        
        <div className="mb-12">
          <Card className="border-none bg-blue-50 p-6 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-blue-bright h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-navy mb-2">¿Por qué debería actuar ahora?</h3>
                  <p className="text-gray-700">
                    La visibilidad en ChatGPT es una ventana de oportunidad que se está cerrando. Cada día más marcas empiezan a optimizar su contenido para IA. Quienes actúen primero tendrán ventaja.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {testimonials.map((testimonial, index) => (
          <div key={index} className="mb-12">
            <Card className="border-blue-bright/20 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex gap-2 mb-2">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="italic text-gray-700 mb-4">"{testimonial.quote}"</p>
                <p className="font-medium text-navy">{testimonial.author}</p>
              </CardContent>
            </Card>
          </div>
        ))}
        
        <Card className="border-blue-bright/20 overflow-hidden shadow-xl">
          <div className="bg-navy text-white p-8 text-center">
            <h2 className="heading-md mb-2">Tu informe de visibilidad en ChatGPT</h2>
            <p className="text-gray-300">
              Recibirás el informe completo en menos de 72 horas, junto con un plan de acción basado en IA.
            </p>
          </div>
          
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="text-blue-bright h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-8 mt-4">
              <div className="flex flex-col items-center">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 mb-4">
                  <p className="text-lg font-medium">Precio normal: <span className="line-through">89€</span></p>
                  <div className="hidden sm:block">•</div>
                  <p className="text-lg font-medium">Oferta de lanzamiento:</p>
                </div>
                <p className="text-5xl font-bold text-navy mb-1">49 €</p>
                <p className="text-sm text-gray-500 mb-6">(pago único)</p>
                <Button className="btn-primary text-lg w-full md:w-auto md:px-12 py-6 mb-4">
                  Obtener mi informe ahora por 49€
                </Button>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <ShieldCheck className="h-5 w-5 text-blue-bright" />
                    <span>Pago 100% seguro</span>
                  </div>
                  <div className="hidden sm:block text-gray-400">|</div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Lock className="h-5 w-5 text-blue-bright" />
                    <span>Garantía de satisfacción</span>
                  </div>
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
