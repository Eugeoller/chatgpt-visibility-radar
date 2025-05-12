
import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import AuthLoading from "@/components/auth/AuthLoading";
import { LoginFormValues, SignupFormValues } from "@/schemas/authSchemas";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";
  const isFromReport = returnUrl.includes("/informe");
  
  // Initialize mode based on where the user is coming from
  const [mode, setMode] = useState<"login" | "signup">(isFromReport ? "signup" : "login");
  
  const { signIn, signUp, user, loading } = useAuth();
  
  const onLoginSubmit = async (values: LoginFormValues) => {
    await signIn(values.email, values.password);
  };

  const onSignupSubmit = async (values: SignupFormValues) => {
    await signUp(values.email, values.password, values.fullName);
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
  };

  if (loading) {
    return <AuthLoading />;
  }
  
  if (user) {
    // Redirect to the return URL or home page if authenticated
    return <Navigate to={returnUrl} replace />;
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <div className="container-custom flex justify-center pt-12 pb-8">
        <Logo variant="light" />
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </h1>
            <p className="text-gray-600 mt-2">
              {mode === "login" 
                ? "Inicia sesión para acceder a tus informes" 
                : "Crea una cuenta para comenzar"}
            </p>
          </div>

          {mode === "login" ? (
            <LoginForm onSubmit={onLoginSubmit} onSwitchMode={toggleMode} />
          ) : (
            <SignupForm onSubmit={onSignupSubmit} onSwitchMode={toggleMode} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
