
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ReportHero = () => {
  return (
    <section className="relative bg-navy py-20 overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-20"></div>
      <div className="container-custom relative z-10">
        <div className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto">
          <h1 className="heading-xl text-white">
            ¿Qué incluye tu informe de visibilidad en ChatGPT?
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Analizamos si tu marca aparece cuando los usuarios hacen preguntas reales 
            en ChatGPT, y te damos un plan personalizado para mejorar tu posición.
          </p>
          <div className="pt-4">
            <Button className="btn-primary text-lg flex items-center gap-2 px-8 py-6">
              Solicitar mi informe ahora
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReportHero;
