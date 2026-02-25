import { useState, useEffect } from "react";

const MESSAGES = [
  "Sincronizando sua agenda...",
  "Encontrando profissionais próximos...",
  "Verificando disponibilidade...",
];

const CYCLE_MS = 2800;
const CHAR_MS = 60;

export function TelemetryTypewriter() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const text = MESSAGES[messageIndex];

  useEffect(() => {
    if (!isDeleting) {
      if (visibleLength < text.length) {
        const t = setTimeout(() => setVisibleLength((n) => n + 1), CHAR_MS);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setIsDeleting(true), 1200);
      return () => clearTimeout(t);
    } else {
      if (visibleLength > 0) {
        const t = setTimeout(() => setVisibleLength((n) => n - 1), CHAR_MS / 2);
        return () => clearTimeout(t);
      }
      setIsDeleting(false);
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
      return undefined;
    }
  }, [text, visibleLength, isDeleting]);

  return (
    <div className="w-full max-w-md mx-auto rounded-landing-lg bg-white/95 border border-landing-moss/10 shadow-lg px-6 py-5 font-mono text-landing-charcoal">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm md:text-base min-h-[1.5em]">
          {text.slice(0, visibleLength)}
          <span
            className="inline-block w-2 h-4 ml-0.5 align-middle bg-landing-clay animate-pulse"
            aria-hidden
          />
        </span>
        <span className="inline-flex items-center gap-1.5 text-landing-clay text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-landing-clay opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-landing-clay" />
          </span>
          Ao vivo
        </span>
      </div>
    </div>
  );
}
