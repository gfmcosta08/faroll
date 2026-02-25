import { useState, useEffect } from "react";

const CARDS = [
  { label: "Por profissão", id: "profession" },
  { label: "Por especialidade", id: "specialty" },
  { label: "Por localização", id: "location" },
];

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const INTERVAL_MS = 3000;

export function DiagnosticShuffler() {
  const [order, setOrder] = useState([0, 1, 2]);

  useEffect(() => {
    const t = setInterval(() => {
      setOrder((prev) => {
        const next = [...prev];
        const top = next.shift()!;
        next.push(top);
        return next;
      });
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full max-w-[280px] h-[120px] mx-auto">
      {order.map((cardIndex, position) => {
        const card = CARDS[cardIndex];
        const isFront = position === 2;
        const isMiddle = position === 1;
        const isBack = position === 0;
        return (
          <div
            key={card.id}
            className="absolute left-1/2 -translate-x-1/2 w-full rounded-landing-lg bg-white border border-landing-moss/10 shadow-lg px-5 py-4 flex items-center justify-center transition-all duration-500"
            style={{
              zIndex: position,
              transform: `translateX(-50%) translateY(${position * 12}px) scale(${isFront ? 1 : isMiddle ? 0.96 : 0.92})`,
              opacity: isFront ? 1 : isMiddle ? 0.85 : 0.7,
              transitionTimingFunction: SPRING,
            }}
          >
            <span className="font-outfit font-semibold text-landing-moss text-lg tracking-tight">
              {card.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
