import { LighthouseLogo } from "./LighthouseLogo";

const LINKS = [
  { label: "Início", href: "#" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Contato", href: "#contato" },
];

export function LandingFooter() {
  return (
    <footer className="bg-landing-charcoal rounded-t-landing-footer pt-16 pb-10 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <a href="#" className="flex items-center" aria-label="FarolBR início">
            <LighthouseLogo size={36} light />
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Links do rodapé">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-landing-cream/80 hover:text-landing-cream text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-landing-clay focus:ring-offset-2 focus:ring-offset-landing-charcoal rounded"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 pt-8 border-t border-landing-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-landing-cream/70 text-sm">
            FarolBR: Navegue com clareza. Agende com segurança.
          </p>
          <div className="flex items-center gap-2 font-mono text-landing-cream/60 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Sistema operacional
          </div>
        </div>

        <p className="mt-8 text-center text-landing-cream/50 text-xs">
          &copy; {new Date().getFullYear()} FarolBR. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
