
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="bg-navy-dark py-8 text-gray-400 text-sm">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 flex flex-col items-center md:items-start">
            <Logo variant="light" className="mb-2" />
            <p>© 2025 SeoChatGPT. Todos los derechos reservados.</p>
          </div>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-white transition-colors">Política de privacidad</Link>
            <Link to="#" className="hover:text-white transition-colors">Términos y condiciones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
