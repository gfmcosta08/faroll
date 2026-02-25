import { useRef } from "react";
import gsap from "gsap";
import { useGSAPContext } from "@/hooks/useGSAPContext";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80";

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const italicRef = useRef<HTMLSpanElement>(null);

  useGSAPContext(sectionRef, () => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      headlineRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
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
      className="relative min-h-[100dvh] flex items-end justify-start overflow-hidden"
      aria-label="Hero: encontre o profissional ideal"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[var(--landing-moss)] via-[var(--landing-moss)]/80 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-[20dvh] text-left">
        <h1 className="font-outfit font-bold text-4xl md:text-5xl lg:text-6xl text-white tracking-tight max-w-2xl" id="hero-heading">
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
          className="mt-6 text-lg md:text-xl text-white/90 max-w-xl font-sans"
        >
          Como um farol que guia, nós conectamos você a profissionais de confiança para o cuidado que você precisa.
        </p>
      </div>
    </section>
  );
}
