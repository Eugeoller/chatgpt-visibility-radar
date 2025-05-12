
import { Search, List, Check } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: <Search className="h-10 w-10 text-blue-bright" />,
    title: "Analizamos 50 preguntas",
    description:
      "Analizamos 50 preguntas reales sobre tu sector.",
  },
  {
    id: 2,
    icon: <List className="h-10 w-10 text-blue-bright" />,
    title: "Medimos tu presencia",
    description:
      "Medimos si tu marca aparece, en qué contexto y contra quién.",
  },
  {
    id: 3,
    icon: <Check className="h-10 w-10 text-blue-bright" />,
    title: "Plan accionable",
    description:
      "Te damos un plan accionable para mejorar visibilidad con contenido.",
  },
];

const ReportSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <h2 className="heading-lg text-center mb-16">¿Qué hacemos con tu informe?</h2>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2 hidden md:block"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step) => (
              <div key={step.id} className="relative flex flex-col items-center text-center z-10">
                <div className="bg-white p-4 rounded-full border-2 border-blue-bright mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReportSection;
