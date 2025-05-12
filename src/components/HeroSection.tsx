
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative bg-navy py-20 overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-20"></div>
      <div className="container-custom relative z-10">
        <div className="flex flex-col items-center text-center gap-12">
          <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="heading-xl text-white">
              Tu marca está siendo ignorada por ChatGPT.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Descúbrelo antes que tu competencia y empieza a ganar visibilidad en la IA que todos consultan.
            </p>
            <div className="pt-4 flex justify-center">
              <Button className="btn-primary text-lg flex items-center gap-2 px-8 py-6" asChild>
                <Link to="/informe">
                  🔍 Quiero saber si aparezco
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="max-w-lg">
            <div className="relative animate-float">
              <img
                src="/seo-chatgpt-hero.png"
                alt=""
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
