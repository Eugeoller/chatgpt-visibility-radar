
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoginFormValues, loginSchema } from "@/schemas/authSchemas";

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  onSwitchMode: () => void;
}

const LoginForm = ({ onSubmit, onSwitchMode }: LoginFormProps) => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="tu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-blue-bright hover:bg-blue-700">
            Iniciar sesión
          </Button>
        </form>
      </Form>
      <p className="text-center mt-4 text-sm text-gray-600">
        ¿No tienes una cuenta?{" "}
        <button
          onClick={onSwitchMode}
          className="text-blue-bright hover:underline font-medium"
        >
          Crear cuenta
        </button>
      </p>
    </>
  );
};

export default LoginForm;
