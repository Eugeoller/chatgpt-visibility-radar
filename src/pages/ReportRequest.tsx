
import ReportHero from "@/components/report/ReportHero";
import ProcessSteps from "@/components/report/ProcessSteps";
import WhyImportant from "@/components/report/WhyImportant";
import OfferBlock from "@/components/report/OfferBlock";
import Footer from "@/components/Footer";
import ReportPageHeader from "@/components/report/ReportPageHeader";

const ReportRequest = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <ReportPageHeader />
      <main className="flex-grow">
        <ReportHero />
        <ProcessSteps />
        <WhyImportant />
        <OfferBlock />
      </main>
      <Footer />
    </div>
  );
};

export default ReportRequest;
