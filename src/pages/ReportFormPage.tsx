
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import ReportPageHeader from "@/components/report/ReportPageHeader";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const ReportFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: "",
    aliases: [""],
    competitors: [""],
    website: "",
    sector: "",
  });

  // Function to add new alias or competitor field
  const addField = (field: "aliases" | "competitors") => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ""],
    });
  };

  // Function to remove alias or competitor field
  const removeField = (field: "aliases" | "competitors", index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  // Function to update alias or competitor field
  const updateField = (field: "aliases" | "competitors", index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray,
    });
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Debes iniciar sesión para enviar un informe.");
      return;
    }
    
    if (!formData.brand_name) {
      toast.error("El nombre de la marca es obligatorio.");
      return;
    }
    
    if (!formData.competitors[0]) {
      toast.error("Debes añadir al menos un competidor.");
      return;
    }

    // Filter out empty fields
    const filteredAliases = formData.aliases.filter(alias => alias.trim() !== "");
    const filteredCompetitors = formData.competitors.filter(comp => comp.trim() !== "");

    try {
      setIsSubmitting(true);

      // Insert questionnaire into database
      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('brand_questionnaires')
        .insert({
          user_id: user.id,
          brand_name: formData.brand_name,
          aliases: filteredAliases.length > 0 ? filteredAliases : [],
          competitors: filteredCompetitors,
          website: formData.website || null,
          sector: formData.sector || null,
          status: 'pending'
        })
        .select()
        .single();

      if (questionnaireError) {
        throw new Error(questionnaireError.message);
      }

      // Create an empty final report entry
      await supabase
        .from('final_reports')
        .insert({
          questionnaire_id: questionnaireData.id,
          status: 'processing'
        });

      // Trigger the report generation edge function
      const { error: functionError } = await supabase.functions.invoke('generar-reporte-chatgpt', {
        body: { questionnaireId: questionnaireData.id }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      toast.success("¡Reporte solicitado con éxito! Pronto estará listo.");
      
      // Redirect to a "processing" or "thank you" page
      // In a real app, you would redirect to a page where users can see the status of their report
      navigate("/");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Error al enviar el informe. Por favor inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ReportPageHeader />
      <main className="flex-grow py-10 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Informe de visibilidad en ChatGPT</CardTitle>
                <CardDescription>
                  Complete este formulario para analizar la visibilidad de su marca en ChatGPT.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {/* Brand Name */}
                  <div className="space-y-2">
                    <label htmlFor="brand_name" className="text-sm font-medium">
                      Nombre de la marca <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="brand_name"
                      value={formData.brand_name}
                      onChange={(e) =>
                        setFormData({ ...formData, brand_name: e.target.value })
                      }
                      placeholder="Nombre de su marca"
                      required
                    />
                  </div>

                  {/* Aliases */}
                  <div className="space-y-2">
                    <label htmlFor="aliases" className="text-sm font-medium">
                      Alias o nombres alternativos de la marca
                    </label>
                    <div className="space-y-2">
                      {formData.aliases.map((alias, index) => (
                        <div key={`alias-${index}`} className="flex gap-2">
                          <Input
                            value={alias}
                            onChange={(e) =>
                              updateField("aliases", index, e.target.value)
                            }
                            placeholder={`Alias ${index + 1}`}
                          />
                          {formData.aliases.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeField("aliases", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => addField("aliases")}
                      >
                        <Plus className="h-4 w-4" /> Añadir alias
                      </Button>
                    </div>
                  </div>

                  {/* Competitors */}
                  <div className="space-y-2">
                    <label htmlFor="competitors" className="text-sm font-medium">
                      Competidores <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {formData.competitors.map((competitor, index) => (
                        <div key={`competitor-${index}`} className="flex gap-2">
                          <Input
                            value={competitor}
                            onChange={(e) =>
                              updateField("competitors", index, e.target.value)
                            }
                            placeholder={`Competidor ${index + 1}`}
                            required={index === 0}
                          />
                          {formData.competitors.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeField("competitors", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => addField("competitors")}
                      >
                        <Plus className="h-4 w-4" /> Añadir competidor
                      </Button>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <label htmlFor="website" className="text-sm font-medium">
                      Sitio web
                    </label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      placeholder="https://www.ejemplo.com"
                      type="url"
                    />
                  </div>

                  {/* Sector */}
                  <div className="space-y-2">
                    <label htmlFor="sector" className="text-sm font-medium">
                      Sector o industria
                    </label>
                    <Input
                      id="sector"
                      value={formData.sector}
                      onChange={(e) =>
                        setFormData({ ...formData, sector: e.target.value })
                      }
                      placeholder="Ej: Comercio electrónico, SaaS, Educación..."
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/informe")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Solicitar informe"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportFormPage;
