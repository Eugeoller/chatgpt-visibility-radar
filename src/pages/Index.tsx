
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import UseCasesSection from "@/components/UseCasesSection";
import ReportSection from "@/components/ReportSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <HeroSection />
        <StatsSection />
        <UseCasesSection />
        <ReportSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
