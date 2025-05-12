
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PrivateRouteProps = {
  children?: React.ReactNode;
  requiresPayment?: boolean;
};

const PrivateRoute = ({ children, requiresPayment = false }: PrivateRouteProps) => {
  const { user, loading } = useAuth();
  const [hasVerifiedPayment, setHasVerifiedPayment] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(requiresPayment);
  const location = useLocation();

  useEffect(() => {
    if (requiresPayment && user && !loading) {
      const verifyPayment = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('verify-session', {
            body: { sessionId: null }
          });

          if (error) {
            console.error('Error verifying payment:', error);
            toast.error("Error al verificar el estado del pago");
            setHasPaid(false);
          } else {
            setHasPaid(data.hasPaid);
          }
        } catch (error) {
          console.error('Error calling verify-session function:', error);
          toast.error("Error al verificar el estado del pago");
          setHasPaid(false);
        } finally {
          setVerifyingPayment(false);
          setHasVerifiedPayment(true);
        }
      };

      verifyPayment();
    } else if (!requiresPayment) {
      setHasVerifiedPayment(true);
    }
  }, [user, loading, requiresPayment]);

  if (loading || (requiresPayment && !hasVerifiedPayment)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-bright"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page and remember the page the user was trying to access
    return <Navigate to={`/auth?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiresPayment && !hasPaid) {
    // If payment required but not paid, redirect to the report page
    return <Navigate to="/informe" replace />;
  }

  return (
    <>
      {children || <Outlet />}
    </>
  );
};

export default PrivateRoute;
