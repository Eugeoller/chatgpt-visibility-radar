
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, GraduationCap, Lightbulb, ShoppingCart, MapPin, Coffee } from "lucide-react";

const useCases = [
  {
    id: 1,
    title: "Emprendedores",
    icon: <Lightbulb className="h-8 w-8 text-blue-bright" />,
    description: "Validan si su contenido sigue impactando.",
  },
  {
    id: 2,
    title: "SaaS y productos digitales",
    icon: <Code className="h-8 w-8 text-blue-bright" />,
    description: "Quieren aparecer en comparativas y listados.",
  },
  {
    id: 3,
    title: "Educadores y creadores",
    icon: <GraduationCap className="h-8 w-8 text-blue-bright" />,
    description: "Venden conocimiento y no saben si están siendo recomendados.",
  },
  {
    id: 4,
    title: "Ecommerce",
    icon: <ShoppingCart className="h-8 w-8 text-blue-bright" />,
    description: "Necesitan visibilidad frente a nuevos competidores digitales.",
  },
  {
    id: 5,
    title: "Negocios Locales",
    icon: <MapPin className="h-8 w-8 text-blue-bright" />,
    description: "Buscan ser recomendados en búsquedas de su zona.",
  },
  {
    id: 6,
    title: "Marcas de Consumo",
    icon: <Coffee className="h-8 w-8 text-blue-bright" />,
    description: "Quieren mantener su posición en recomendaciones de productos.",
  },
];

const UseCasesSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <h2 className="heading-lg text-center mb-12">¿Quién debería preocuparse?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase) => (
            <Card key={useCase.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {useCase.icon}
                <CardTitle>{useCase.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{useCase.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
