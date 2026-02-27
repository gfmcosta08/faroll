import { useRef } from "react";
import gsap from "gsap";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { LighthouseLogo } from "./LighthouseLogo";

// Imagem de ambiente tech/profissional (workspace, conexão)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80";

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const italicRef = useRef<HTMLSpanElement>(null);

  useGSAPContext(sectionRef, () => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(logoRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
      .fromTo(
        headlineRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.3"
      )
      .fromTo(
        italicRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        "-=0.4"
      )
      .fromTo(
        sublineRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.3"
      );
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
      aria-label="Hero: encontre o profissional ideal"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />
      {/* Overlay tech: escuro + leve vitrificado */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-[var(--landing-charcoal)]/80 to-black/90"
        aria-hidden
      />
      <div className="absolute inset-0 bg-white/[0.03]" aria-hidden />

      {/* Logo em destaque no hero */}
      <div ref={logoRef} className="relative z-10 mb-8">
        <LighthouseLogo size={72} light />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">
        <h1 className="font-outfit font-bold text-4xl md:text-5xl lg:text-6xl text-white tracking-tight" id="hero-heading">
          <span ref={headlineRef}>Encontre o profissional</span>
          <br />
          <span
            ref={italicRef}
            className="font-cormorant italic text-5xl md:text-6xl lg:text-7xl text-white/95 block mt-1"
          >
            ideal.
          </span>
        </h1>
        <p
          ref={sublineRef}
          className="mt-6 text-lg md:text-xl text-white/85 max-w-xl mx-auto font-sans"
        >
          Conectamos você a profissionais de confiança com tecnologia e cuidado.
        </p>
      </div>
    </section>
  );
}
