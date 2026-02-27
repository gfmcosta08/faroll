import { UserPlus, Search, CalendarCheck } from "lucide-react";

const STEPS = [
  {
    title: "Cadastro",
    description: "Crie sua conta e complete seu perfil.",
    Icon: UserPlus,
  },
  {
    title: "Busca",
    description: "Por profissão, especialidade ou localização.",
    Icon: Search,
  },
  {
    title: "Contato e agenda",
    description: "Agende e gerencie em um só lugar.",
    Icon: CalendarCheck,
  },
];

export function LandingProtocol() {
  return (
    <section className="py-12 md:py-16 px-4 bg-landing-cream" id="como-funciona">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-outfit font-bold text-2xl md:text-3xl text-landing-charcoal text-center tracking-tight mb-2">
          Como funciona
        </h2>
        <p className="text-landing-moss/80 text-center text-sm mb-8">
          Cadastro, busca e agendamento em poucos passos.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step, index) => {
            const Icon = step.Icon;
            return (
              <div
                key={step.title}
                className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg shadow-black/5 p-6 text-center hover:bg-white/90 transition-colors"
              >
                <span className="font-mono text-landing-moss/70 text-xs uppercase tracking-wider">
                  Passo {index + 1}
                </span>
                <div className="mt-2 w-12 h-12 rounded-xl bg-landing-moss/10 flex items-center justify-center mx-auto">
                  <Icon className="w-6 h-6 text-landing-clay" />
                </div>
                <h3 className="font-outfit font-semibold text-landing-charcoal mt-3">
                  {step.title}
                </h3>
                <p className="text-sm text-landing-moss/80 mt-1">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
