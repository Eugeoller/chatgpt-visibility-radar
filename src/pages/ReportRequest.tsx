
import ReportHero from "@/components/report/ReportHero";
import ProcessSteps from "@/components/report/ProcessSteps";
import WhyImportant from "@/components/report/WhyImportant";
import OfferBlock from "@/components/report/OfferBlock";
import FinalCta from "@/components/report/FinalCta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ReportRequest = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <ReportHero />
        <ProcessSteps />
        <WhyImportant />
        <OfferBlock />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
};

export default ReportRequest;
