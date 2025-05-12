
import ProcessSteps from "@/components/report/ProcessSteps";
import OfferBlock from "@/components/report/OfferBlock";
import Footer from "@/components/Footer";
import ReportPageHeader from "@/components/report/ReportPageHeader";
import { useEffect } from "react";

const ReportRequest = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <ReportPageHeader />
      <main className="flex-grow">
        <ProcessSteps />
        <OfferBlock />
      </main>
      <Footer />
    </div>
  );
};

export default ReportRequest;
