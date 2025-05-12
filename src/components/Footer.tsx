
import { Lock, ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-navy-dark py-8 text-gray-400 text-sm">
      <div className="container-custom">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-bright" />
              <span>Pago 100% seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-bright" />
              <span>Datos protegidos</span>
            </div>
          </div>
          <p className="mb-4">© 2025 SeoChatGPT. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Política de privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos y condiciones</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
