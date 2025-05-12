
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCta = () => {
  return (
    <section className="py-20 bg-navy text-white relative overflow-hidden">
      <div className="bg-dots absolute inset-0 opacity-20"></div>
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      ></div>
      
      <div className="container-custom relative z-10 text-center max-w-3xl">
        <h2 className="heading-lg mb-4">
          Solicita hoy tu informe y empieza a aparecer donde importa.
        </h2>
        <p className="text-lg text-gray-300 mb-8">
          Tu reputación en ChatGPT ya está en juego. Descubre cómo estás posicionado antes que lo hagan tus competidores.
        </p>
        <Button className="btn-primary text-lg px-10 py-6 flex items-center gap-2 mx-auto">
          Empezar ahora
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
};

export default FinalCta;
