import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { UserPlus, Search, CalendarCheck } from "lucide-react";

const PROTOCOL_STEPS = [
  {
    title: "Cadastro",
    description: "Crie sua conta como cliente ou profissional e complete seu perfil.",
    Icon: UserPlus,
    animation: "gear",
  },
  {
    title: "Busca",
    description: "Encontre por profissão, especialidade ou localização.",
    Icon: Search,
    animation: "cells",
  },
  {
    title: "Contato e agenda",
    description: "Agende consultas e gerencie sua agenda em um só lugar.",
    Icon: CalendarCheck,
    animation: "wave",
  },
];

function GearAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAPContext(ref, () => {
    gsap.to(ref.current?.querySelector(".gear-outer"), {
      rotation: 360,
      duration: 12,
      repeat: -1,
      ease: "none",
    });
    gsap.to(ref.current?.querySelector(".gear-inner"), {
      rotation: -360,
      duration: 8,
      repeat: -1,
      ease: "none",
    });
  }, []);
  return (
    <div ref={ref} className="w-24 h-24 relative flex items-center justify-center">
      <svg className="gear-outer absolute w-20 h-20 text-landing-clay/60" viewBox="0 0 40 40" fill="currentColor">
        <path d="M20 4l1.5 4.5L26 10l-4.5 1.5L20 16l-1.5-4.5L14 10l4.5-1.5L20 4zm-8 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm16 0l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM8 24l1.5 4.5 4.5 1.5-4.5 1.5L8 36l-1.5-4.5L2 30l4.5-1.5L8 24zm24 0l1.5 4.5 4.5 1.5-4.5 1.5L32 36l-1.5-4.5L26 30l4.5-1.5L32 24z" />
      </svg>
      <svg className="gear-inner absolute w-12 h-12 text-landing-moss/70" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l1.2 3.6L17 7l-3.6 1.2L12 12l-1.2-3.6L7 7l3.6-1.2L12 2z" />
      </svg>
    </div>
  );
}

function CellsAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAPContext(ref, () => {
    const cells = ref.current?.querySelectorAll(".cell");
    if (!cells?.length) return;
    gsap.to(cells, {
      scale: 1.2,
      opacity: 0.9,
      duration: 1.2,
      stagger: { each: 0.08, from: "random" },
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);
  return (
    <div ref={ref} className="grid grid-cols-4 gap-1.5 w-20 h-20">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="cell w-3 h-3 rounded-sm bg-landing-moss/40"
          style={{ opacity: 0.5 + (i % 4) * 0.1 }}
        />
      ))}
    </div>
  );
}

function WaveAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAPContext(ref, () => {
    const paths = ref.current?.querySelectorAll("path");
    if (!paths?.length) return;
    paths.forEach((path) => {
      const length = (path as SVGPathElement).getTotalLength();
      (path as SVGPathElement).style.strokeDasharray = String(length);
      gsap.fromTo(
        path,
        { strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" }
      );
    });
  }, []);
  return (
    <div ref={ref} className="w-24 h-12">
      <svg viewBox="0 0 100 40" className="w-full h-full text-landing-clay stroke-[2]">
        <path
          fill="none"
          stroke="currentColor"
          d="M0 20 Q25 5 50 20 T100 20"
          strokeLinecap="round"
        />
        <path
          fill="none"
          stroke="currentColor"
          d="M0 28 Q25 13 50 28 T100 28"
          strokeLinecap="round"
          opacity={0.6}
        />
      </svg>
    </div>
  );
}

function ProtocolCard({
  step,
  index,
  isActive,
  cardRef,
}: {
  step: (typeof PROTOCOL_STEPS)[number];
  index: number;
  isActive: boolean;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const Icon = step.Icon;
  const Anim = step.animation === "gear" ? GearAnimation : step.animation === "cells" ? CellsAnimation : WaveAnimation;

  return (
    <div
      ref={cardRef}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-20 rounded-landing-3xl bg-landing-cream border border-landing-moss/10 transition-all duration-500"
      style={{
        transform: isActive ? "scale(1)" : "scale(0.9)",
        filter: isActive ? "blur(0)" : "blur(20px)",
        opacity: isActive ? 1 : 0.5,
      }}
    >
      <div className="flex items-center justify-center w-28 h-28 mb-8">
        <Anim />
      </div>
      <span className="font-mono text-landing-moss text-sm uppercase tracking-wider mb-2">
        Passo {index + 1}
      </span>
      <h3 className="font-outfit font-bold text-2xl md:text-3xl text-landing-charcoal mb-4 flex items-center gap-2">
        <Icon className="w-8 h-8 text-landing-clay" />
        {step.title}
      </h3>
      <p className="text-landing-moss/90 text-center max-w-md">{step.description}</p>
    </div>
  );
}

export function LandingProtocol() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const [activeIndex, setActiveIndex] = useState(0);

  useGSAPContext(containerRef, () => {
    PROTOCOL_STEPS.forEach((_, i) => {
      ScrollTrigger.create({
        trigger: cardRefs[i].current,
        start: "top center",
        end: "bottom center",
        onEnter: () => setActiveIndex(i),
        onEnterBack: () => setActiveIndex(i),
        onLeaveBack: () => setActiveIndex(Math.max(0, i - 1)),
        onLeave: () => setActiveIndex(Math.min(PROTOCOL_STEPS.length - 1, i + 1)),
      });
    });
  }, []);

  return (
    <section className="py-8 bg-landing-cream">
      <div className="container mx-auto max-w-2xl px-4">
        <h2 className="font-outfit font-bold text-3xl md:text-4xl text-landing-charcoal text-center tracking-tight mb-4">
          Como funciona
        </h2>
        <p className="text-landing-moss/90 text-center mb-12">
          Cadastro, busca e agendamento em poucos passos.
        </p>
      </div>
      <div ref={containerRef} className="space-y-6 max-w-2xl mx-auto px-4">
        {PROTOCOL_STEPS.map((step, index) => (
          <ProtocolCard
            key={step.title}
            step={step}
            index={index}
            isActive={activeIndex === index}
            cardRef={cardRefs[index]}
          />
        ))}
      </div>
    </section>
  );
}
