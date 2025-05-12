
import ProcessSteps from "@/components/report/ProcessSteps";
import OfferBlock from "@/components/report/OfferBlock";
import Footer from "@/components/Footer";
import ReportPageHeader from "@/components/report/ReportPageHeader";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ReportRequest = () => {
  const { user, loading } = useAuth();
  const [checkingPayment, setCheckingPayment] = useState(false);
  const navigate = useNavigate();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check if user has already paid for a report
  useEffect(() => {
    if (user && !loading) {
      setCheckingPayment(true);
      
      const checkPaymentStatus = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('verify-session', {
            body: { sessionId: null }
          });
          
          if (error) {
            console.error('Error checking payment status:', error);
            return;
          }
          
          if (data.hasPaid) {
            // Redirect to report form if already paid
            navigate('/informe/formulario');
          }
        } catch (error) {
          console.error('Error during payment check:', error);
        } finally {
          setCheckingPayment(false);
        }
      };
      
      checkPaymentStatus();
    }
  }, [user, loading, navigate]);

  if (loading || checkingPayment) {
    return (
      <div className="min-h-screen flex flex-col">
        <ReportPageHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-bright"></div>
        </div>
        <Footer />
      </div>
    );
  }

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
