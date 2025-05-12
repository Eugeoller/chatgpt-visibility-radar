
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Footer from "@/components/Footer";
import ReportPageHeader from "@/components/report/ReportPageHeader";

// Create report form schema
const formSchema = z.object({
  companyName: z.string().min(1, "Por favor introduce el nombre de tu empresa"),
  sector: z.string().min(1, "Por favor introduce el sector de tu empresa"),
  website: z.string().url("Por favor introduce una URL válida"),
  competitors: z.string().optional(),
});

const ReportFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      sector: "",
      website: "",
      competitors: "",
    },
  });

  // Verify payment status if a session_id is in the URL
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      checkExistingPayment();
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-session", {
        body: { sessionId },
      });

      if (error || !data.hasPaid) {
        toast.error("No se ha podido verificar el pago. Por favor contacta con soporte.");
        navigate("/informe");
        return;
      }

      if (data.orderId) {
        setOrderId(data.orderId);
        toast.success("Pago confirmado. Por favor rellena el formulario.");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Error al verificar el pago");
    }
  };

  const checkExistingPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-session", {
        body: { sessionId: null },
      });

      if (error) {
        console.error("Error checking payment:", error);
        return;
      }

      if (data.hasPaid && data.orderId) {
        setOrderId(data.orderId);
        
        // Check if user already has a report
        const { data: reportData } = await supabase
          .from('reports')
          .select('*')
          .eq('order_id', data.orderId)
          .single();
          
        if (reportData) {
          // Pre-fill form with existing data
          form.setValue("companyName", reportData.company_name || "");
          form.setValue("sector", reportData.sector || "");
          form.setValue("website", reportData.website || "");
          form.setValue("competitors", reportData.competitors ? reportData.competitors.join(", ") : "");
          
          if (reportData.status !== 'pending') {
            toast.info("Ya has enviado este formulario. Estamos preparando tu informe.");
          }
        }
      }
    } catch (error) {
      console.error("Error checking existing payment:", error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !orderId) {
      toast.error("Hay un problema con tu sesión. Por favor inténtalo de nuevo.");
      return;
    }

    setSubmitting(true);

    try {
      // Format competitors as array
      const competitors = values.competitors
        ? values.competitors.split(",").map((item) => item.trim())
        : [];

      const { error } = await supabase.from("reports").upsert({
        user_id: user.id,
        order_id: orderId,
        company_name: values.companyName,
        sector: values.sector,
        website: values.website,
        competitors,
        status: "submitted",
      });

      if (error) {
        throw error;
      }

      toast.success("Formulario enviado con éxito. Recibirás tu informe en breve.");
      
      // Redirect to a thank you page or dashboard
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error submitting report form:", error);
      toast.error("Error al enviar el formulario. Por favor inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ReportPageHeader />
      
      <main className="flex-grow py-12">
        <div className="container-custom max-w-3xl">
          <Card className="shadow-lg">
            <CardHeader className="bg-navy text-white">
              <CardTitle className="text-2xl">Cuestionario para tu informe de visibilidad</CardTitle>
              <CardDescription className="text-gray-300">
                Por favor, proporciona la información necesaria para crear tu informe personalizado
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 pb-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu empresa S.L." {...field} />
                        </FormControl>
                        <FormDescription>
                          Indica el nombre de tu empresa o marca
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector</FormLabel>
                        <FormControl>
                          <Input placeholder="Marketing, Tecnología, Salud..." {...field} />
                        </FormControl>
                        <FormDescription>
                          El sector principal de tu negocio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio web</FormLabel>
                        <FormControl>
                          <Input placeholder="https://tuempresa.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          La URL completa de tu sitio web
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="competitors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competidores principales</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Competidor 1, Competidor 2, Competidor 3..." 
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Lista tus competidores principales, separados por comas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-bright hover:bg-blue-bright/90"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      "Enviar información"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ReportFormPage;
