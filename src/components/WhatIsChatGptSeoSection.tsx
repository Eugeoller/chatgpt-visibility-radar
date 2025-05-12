
import { Card, CardContent } from "@/components/ui/card";

const WhatIsChatGptSeoSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="max-w-[700px] mx-auto">
          <Card className="bg-gray-50 border-gray-100 shadow-sm">
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <h2 className="heading-md text-navy">¿Qué es el SEO en ChatGPT?</h2>
                <p className="text-gray-700 leading-relaxed">
                  Hasta ahora, posicionarte bien en Google significaba optimizar tu web para que apareciera en los resultados de búsqueda. Pero eso está cambiando. Cada vez más personas le preguntan directamente a ChatGPT qué comprar, a quién seguir, o qué herramientas usar.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Los grandes modelos de lenguaje están recomendando marcas. Y lo hacen en función de la información que han aprendido, no de tu página web. A esto lo llamamos <strong className="font-semibold">SEO para IA</strong>: el nuevo juego para aparecer en las respuestas de la inteligencia artificial.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Si no sabes si tu marca aparece… estás cediendo ese espacio a tus competidores.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="heading-md text-navy">Nuestra solución: un informe de visibilidad personalizado en IA</h2>
                <p className="text-gray-700 leading-relaxed">
                  En SeoChatGPT hemos desarrollado un sistema que simula cómo los usuarios reales le preguntan a ChatGPT sobre tu sector.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Hacemos <strong className="font-semibold">decenas de prompts específicos</strong> relacionados con tu categoría, tus productos, y tus competidores.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Por cada búsqueda, analizamos si tu marca aparece, cómo lo hace, y qué otras marcas están siendo recomendadas.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Con esa información, te entregamos un <strong className="font-semibold">informe personalizado</strong> que te dice:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Dónde estás posicionado hoy.</li>
                  <li>Dónde están ganando visibilidad otros.</li>
                  <li>Y qué tipo de contenido puedes crear para empezar a aparecer en esas respuestas.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default WhatIsChatGptSeoSection;
