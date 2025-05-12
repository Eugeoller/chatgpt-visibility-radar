
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhatIsChatGptSeoSection from "@/components/WhatIsChatGptSeoSection";
import StatsSection from "@/components/StatsSection";
import UseCasesSection from "@/components/UseCasesSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <HeroSection />
        <WhatIsChatGptSeoSection />
        <StatsSection />
        <UseCasesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
