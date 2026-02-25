import { DiagnosticShuffler } from "./DiagnosticShuffler";
import { TelemetryTypewriter } from "./TelemetryTypewriter";
import { CursorScheduler } from "./CursorScheduler";

export function LandingFeatures() {
  return (
    <section className="py-20 md:py-28 px-4 bg-landing-cream">
      <div className="container mx-auto max-w-6xl">
        <h2 className="font-outfit font-bold text-3xl md:text-4xl text-landing-charcoal text-center tracking-tight mb-4" id="features-heading">
          Ferramentas que trabalham por você
        </h2>
        <p className="text-landing-moss/90 text-center max-w-2xl mx-auto mb-16">
          Busca inteligente, agenda ao vivo e agendamento visual para conectar você ao profissional ideal.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-start">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <DiagnosticShuffler />
            </div>
            <h3 className="font-outfit font-semibold text-lg text-landing-moss">Busca inteligente</h3>
            <p className="text-sm text-landing-charcoal/80 mt-1">
              Por profissão, especialidade ou localização.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 w-full flex justify-center">
              <TelemetryTypewriter />
            </div>
            <h3 className="font-outfit font-semibold text-lg text-landing-moss">Agenda ao vivo</h3>
            <p className="text-sm text-landing-charcoal/80 mt-1">
              Sincronização em tempo real com profissionais.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <CursorScheduler />
            </div>
            <h3 className="font-outfit font-semibold text-lg text-landing-moss">Agendamento</h3>
            <p className="text-sm text-landing-charcoal/80 mt-1">
              Escolha o dia e salve com um clique.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
