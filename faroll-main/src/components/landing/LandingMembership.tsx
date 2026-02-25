import { Button } from "@/components/ui/button";
import { User, Briefcase, Building2 } from "lucide-react";

interface LandingMembershipProps {
  onRegister: () => void;
}

const PLANS = [
  {
    id: "cliente",
    title: "Cliente",
    description: "Encontre profissionais, compare avaliações e agende consultas com segurança.",
    features: ["Busca por profissão e localização", "Perfis verificados", "Agendamento online"],
    Icon: User,
    highlighted: false,
  },
  {
    id: "profissional",
    title: "Profissional",
    description: "Gerencie sua agenda, receba pacientes e construa sua reputação.",
    features: ["Agenda integrada", "Avaliações e perfil", "Contato direto com clientes"],
    Icon: Briefcase,
    highlighted: true,
  },
  {
    id: "empresa",
    title: "Empresa",
    description: "Soluções para clínicas e equipes com múltiplos profissionais.",
    features: ["Gestão de equipe", "Relatórios", "Suporte dedicado"],
    Icon: Building2,
    highlighted: false,
  },
];

export function LandingMembership({ onRegister }: LandingMembershipProps) {
  return (
    <section className="py-20 md:py-28 px-4 bg-landing-cream">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-outfit font-bold text-3xl md:text-4xl text-landing-charcoal text-center tracking-tight mb-4">
          Para cada perfil
        </h2>
        <p className="text-landing-moss/90 text-center max-w-2xl mx-auto mb-14">
          Cliente, profissional ou empresa: encontre o plano que combina com você.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-stretch">
          {PLANS.map((plan) => {
            const Icon = plan.Icon;
            return (
              <div
                key={plan.id}
                className={`rounded-landing-2xl border p-8 flex flex-col transition-all duration-300 overflow-hidden ${
                  plan.highlighted
                    ? "bg-landing-moss border-landing-moss text-landing-cream shadow-xl scale-105 md:scale-105"
                    : "bg-white border-landing-moss/15 text-landing-charcoal hover:border-landing-moss/30"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                    plan.highlighted ? "bg-white/20" : "bg-landing-moss/10"
                  }`}
                >
                  <Icon
                    className={`w-7 h-7 ${plan.highlighted ? "text-landing-cream" : "text-landing-moss"}`}
                  />
                </div>
                <h3
                  className={`font-outfit font-bold text-xl mb-2 ${
                    plan.highlighted ? "text-landing-cream" : "text-landing-charcoal"
                  }`}
                >
                  {plan.title}
                </h3>
                <p
                  className={`text-sm mb-6 flex-1 ${
                    plan.highlighted ? "text-landing-cream/90" : "text-landing-moss/90"
                  }`}
                >
                  {plan.description}
                </p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className={`text-sm flex items-center gap-2 ${
                        plan.highlighted ? "text-landing-cream/95" : "text-landing-charcoal/80"
                      }`}
                    >
                      <span className="text-landing-clay">•</span> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={onRegister}
                  className={`w-full rounded-xl font-outfit font-semibold overflow-hidden transition-all hover:scale-[1.02] ${
                    plan.highlighted
                      ? "bg-landing-clay text-white hover:bg-landing-clay/90"
                      : "bg-landing-moss text-landing-cream hover:bg-landing-moss/90"
                  }`}
                >
                  Começar
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
