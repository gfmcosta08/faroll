import { useState, useEffect } from "react";

const DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
const GRID_ROWS = 3;
const GRID_COLS = 7;

export function CursorScheduler() {
  const [step, setStep] = useState<"idle" | "moving" | "click" | "save" | "done">("idle");
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });

  useEffect(() => {
    if (step !== "idle") return;
    const t = setTimeout(() => setStep("moving"), 800);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== "moving") return;
    const targetRow = 1;
    const targetCol = 3;
    const delay = 400;
    let timeout: ReturnType<typeof setTimeout>;

    const move = (r: number, c: number) => {
      setCursor({ row: r, col: c });
      if (r === targetRow && c === targetCol) {
        timeout = setTimeout(() => {
          setStep("click");
          setActiveCell({ row: targetRow, col: targetCol });
        }, delay);
      } else {
        const nextC = c + 1;
        const nextR = nextC >= GRID_COLS ? r + 1 : r;
        const nextCol = nextC >= GRID_COLS ? 0 : nextC;
        if (nextR >= GRID_ROWS) {
          timeout = setTimeout(() => setStep("save"), delay);
        } else {
          timeout = setTimeout(() => move(nextR, nextCol), delay);
        }
      }
    };
    move(0, 0);

    return () => clearTimeout(timeout);
  }, [step]);

  useEffect(() => {
    if (step !== "click") return;
    const t = setTimeout(() => setStep("save"), 500);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== "save") return;
    const t = setTimeout(() => setStep("done"), 600);
    return () => clearTimeout(t);
  }, [step]);

  const cellSize = 36;
  const cursorX = 14 + cursor.col * (cellSize + 8);
  const cursorY = 14 + 50 + cursor.row * (cellSize + 8);

  return (
    <div className="w-full max-w-[320px] mx-auto rounded-landing-lg bg-white border border-landing-moss/10 shadow-lg p-5">
      <div className="font-mono text-xs text-landing-moss mb-3 uppercase tracking-wider">
        Semana
      </div>
      <div className="relative">
        <div className="grid grid-cols-7 gap-2 mb-2" style={{ width: GRID_COLS * cellSize + (GRID_COLS - 1) * 8 }}>
          {DAYS.map((d, i) => (
            <div
              key={i}
              className="w-9 h-8 flex items-center justify-center font-mono text-landing-moss/80 text-xs"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="relative" style={{ width: GRID_COLS * cellSize + (GRID_COLS - 1) * 8, height: GRID_ROWS * cellSize + (GRID_ROWS - 1) * 8 + 50 }}>
          {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
            const row = Math.floor(i / GRID_COLS);
            const col = i % GRID_COLS;
            const isActive = activeCell?.row === row && activeCell?.col === col;
            return (
              <div
                key={i}
                className="absolute rounded-lg border flex items-center justify-center font-mono text-sm transition-transform duration-200"
                style={{
                  left: col * (cellSize + 8),
                  top: 50 + row * (cellSize + 8),
                  width: cellSize,
                  height: cellSize,
                  borderColor: isActive ? "var(--landing-clay)" : "rgba(46, 64, 54, 0.2)",
                  backgroundColor: isActive ? "var(--landing-cream)" : "transparent",
                  transform: step === "click" && isActive ? "scale(0.92)" : "scale(1)",
                }}
              >
                {row * 7 + col + 1}
              </div>
            );
          })}
          {step !== "done" && (
            <svg
              className="absolute pointer-events-none transition-opacity duration-300"
              style={{
                left: cursorX - 4,
                top: cursorY - 4,
                width: 24,
                height: 24,
                opacity: step === "save" ? 0 : 1,
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--landing-clay)"
              strokeWidth="2"
            >
              <path d="M5 3l7 7 7-7" />
              <path d="M12 6v12" />
            </svg>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-label="Salvar agendamento (demonstração)"
        className="mt-4 w-full py-2 rounded-lg font-outfit font-semibold text-sm transition-all duration-300 overflow-hidden relative"
        style={{
          backgroundColor: step === "save" || step === "done" ? "var(--landing-clay)" : "rgba(46, 64, 54, 0.15)",
          color: step === "save" || step === "done" ? "white" : "var(--landing-moss)",
        }}
      >
        Salvar
      </button>
    </div>
  );
}
