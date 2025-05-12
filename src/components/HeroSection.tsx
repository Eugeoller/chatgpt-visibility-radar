
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative bg-navy py-20 overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-20"></div>
      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 justify-between">
          <div className="flex-1 space-y-6">
            <h1 className="heading-xl text-white">
              Tu marca está siendo ignorada por ChatGPT.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Descúbrelo antes que tu competencia y empieza a ganar visibilidad en la IA que todos consultan.
            </p>
            <div className="space-y-3 pt-4">
              <Button className="btn-primary text-lg flex items-center gap-2 px-8 py-6">
                🔍 Quiero saber si aparezco
                <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="text-sm text-gray-400">
                Recibe tu informe completo por solo 29 €
              </p>
            </div>
          </div>
          <div className="flex-1 max-w-lg">
            <div className="relative animate-float">
              <img
                src="/seo-chatgpt-hero.png"
                alt="Radar con marcas en ChatGPT"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
