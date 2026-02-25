import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAPContext } from "@/hooks/useGSAPContext";

const PHILOSOPHY_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80";

export function LandingPhilosophy() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLParagraphElement>(null);
  const line2Ref = useRef<HTMLParagraphElement>(null);

  useGSAPContext(sectionRef, () => {
    gsap.fromTo(
      bgRef.current,
      { y: 0 },
      {
        y: "-20%",
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      }
    );
    gsap.fromTo(
      line1Ref.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        scrollTrigger: {
          trigger: line1Ref.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
    gsap.fromTo(
      line2Ref.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: 0.2,
        scrollTrigger: {
          trigger: line2Ref.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 px-4 bg-landing-charcoal overflow-hidden"
      aria-label="Nossa filosofia: quem é o ideal"
    >
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${PHILOSOPHY_IMAGE})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-landing-charcoal/85" aria-hidden />

      <div className="relative z-10 container mx-auto max-w-4xl text-center" role="region" aria-label="Filosofia">
        <p
          ref={line1Ref}
          className="font-outfit font-semibold text-landing-cream/80 text-xl md:text-2xl mb-6"
        >
          Outros perguntam: Onde procurar?
        </p>
        <p
          ref={line2Ref}
          className="font-cormorant italic text-landing-cream text-3xl md:text-4xl lg:text-5xl"
        >
          Nós perguntamos: Quem é o ideal?
        </p>
      </div>
    </section>
  );
}
