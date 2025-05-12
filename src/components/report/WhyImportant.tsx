
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Clock } from "lucide-react";

const reasons = [
  {
    icon: <Users className="h-12 w-12 text-blue-bright" />,
    title: "Confianza creciente en la IA",
    description: "Porque cada vez más usuarios confían en la IA para decidir qué comprar."
  },
  {
    icon: <TrendingUp className="h-12 w-12 text-blue-bright" />,
    title: "Ventaja competitiva",
    description: "Porque si tus competidores aparecen y tú no, estás perdiendo posicionamiento."
  },
  {
    icon: <Clock className="h-12 w-12 text-blue-bright" />,
    title: "Oportunidad temprana",
    description: "Porque saberlo te permite actuar ahora, no después."
  }
];

const WhyImportant = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="heading-lg text-navy mb-4">¿Por qué es importante esto?</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <Card key={index} className="border-gray-100 bg-gray-50/50 transition-all hover:shadow-md">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="mb-4">{reason.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-navy">{reason.title}</h3>
                <p className="text-gray-600">{reason.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyImportant;
