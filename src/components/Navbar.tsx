
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-navy/90 backdrop-blur-sm z-50 py-4 border-b border-white/10">
      <div className="container-custom">
        <div className="flex items-center justify-between">
          <Logo variant="light" />
          <Button className="bg-transparent hover:bg-white/10 text-white border border-white/20">
            Iniciar sesión
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
