
import { ChartBar, Flag, Users } from "lucide-react";

const statsData = [
  {
    id: 1,
    icon: <Users className="h-12 w-12 text-blue-bright" />,
    text: "Más del 70% de los usuarios ya consultan ChatGPT antes de Google.",
  },
  {
    id: 2,
    icon: <Flag className="h-12 w-12 text-blue-bright" />,
    text: "Los modelos de IA están recomendando marcas sin transparencia.",
  },
  {
    id: 3,
    icon: <ChartBar className="h-12 w-12 text-blue-bright" />,
    text: "Si no estás en sus respuestas, estás fuera del radar.",
  },
];

const StatsSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <h2 className="heading-lg text-center mb-12">Esto ya está ocurriendo:</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {statsData.map((stat) => (
            <div
              key={stat.id}
              className="flex flex-col items-center text-center p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-5">{stat.icon}</div>
              <p className="text-lg">{stat.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
