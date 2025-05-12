
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CtaSection = () => {
  return (
    <section className="relative py-20 bg-navy overflow-hidden">
      <div className="bg-dots absolute inset-0 opacity-20"></div>
      {/* Background grid lines for AI texture */}
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
      
      <div className="container-custom relative z-10 text-center max-w-4xl mx-auto">
        <h2 className="heading-lg text-white mb-4">
          Tu reputación en la IA ya está en juego.
        </h2>
        <p className="text-lg text-gray-300 mb-8">
          Solicita tu informe hoy y descubre cómo te ven los modelos de lenguaje 
          que millones consultan cada día.
        </p>
        <div className="space-y-6">
          <Button className="btn-primary text-lg w-full sm:w-auto px-8 py-6 flex items-center justify-center gap-2 mx-auto" asChild>
            <Link to="/informe">
              Solicitar Informe Ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="text-gray-400 text-sm">
            Ya hemos analizado más de 1.200 prompts reales en ChatGPT.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
