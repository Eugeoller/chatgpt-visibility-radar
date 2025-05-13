
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-navy/90 backdrop-blur-sm z-50 py-4 border-b border-white/10">
      <div className="container-custom">
        <div className="flex items-center justify-between">
          <Logo variant="light" />

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/informes">
                <Button variant="outline" className="bg-transparent hover:bg-white/10 text-white border border-white/20">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Panel de informes
                </Button>
              </Link>
              
              <Link to="/informe">
                <Button variant="outline" className="bg-transparent hover:bg-white/10 text-white border border-white/20">
                  Solicitar informe
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarFallback className="bg-blue-bright text-white">
                      {user.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => signOut()}
                  >
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link to="/auth">
              <Button className="bg-transparent hover:bg-white/10 text-white border border-white/20">
                Iniciar sesión
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
