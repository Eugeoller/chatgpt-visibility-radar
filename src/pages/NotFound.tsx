
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-5xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-gray-300 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <Button asChild className="btn-primary">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
