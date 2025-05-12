
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-navy-dark py-6 text-gray-400 text-sm">
      <div className="container-custom">
        <div className="flex flex-col items-center justify-center">
          <p className="mb-4">© 2025 SeoChatGPT. Todos los derechos reservados.</p>
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
