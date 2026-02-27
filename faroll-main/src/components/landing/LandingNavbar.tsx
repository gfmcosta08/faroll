import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LighthouseLogo } from "./LighthouseLogo";

interface LandingNavbarProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingNavbar({ onLogin, onRegister }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl transition-all duration-300 rounded-full ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl shadow-black/10"
          : "bg-white/10 backdrop-blur-md border border-white/20"
      }`}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <a href="#" className="flex items-center" aria-label="FarolBR início">
          <LighthouseLogo size={48} light={!scrolled} landing={scrolled} />
        </a>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogin}
            className={
              scrolled
                ? "text-landing-moss hover:bg-landing-moss/10 hover:text-landing-moss focus-visible:ring-landing-clay"
                : "text-white hover:bg-white/20 hover:text-white focus-visible:ring-white"
            }
          >
            Entrar
          </Button>
          <Button
            size="sm"
            onClick={onRegister}
            className={
              scrolled
                ? "bg-landing-clay text-white hover:bg-landing-clay/90 focus-visible:ring-landing-clay"
                : "bg-white/20 text-white border border-white/40 hover:bg-white/30 focus-visible:ring-white"
            }
          >
            Cadastre-se
          </Button>
        </div>
      </div>
    </nav>
  );
}
