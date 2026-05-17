import { useState } from "react";
import { AslHandSvg } from "@sensa/components";

const LETTER_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function SignKeyboard({
  appendSignUnit,
  setSignUnits,
}: {
  appendSignUnit: (unit: string) => void;
  setSignUnits: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [visualMode, setVisualMode] = useState<"normal" | "sign">("normal");

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Sign Lexicon
          </h3>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setVisualMode("normal")}
            className={`text-[9px] font-bold uppercase tracking-widest transition-all ${
              visualMode === "normal"
                ? "text-primary underline underline-offset-4"
                : "text-muted-foreground/40 hover:text-foreground"
            }`}
          >
            Alpha
          </button>
          <button
            onClick={() => setVisualMode("sign")}
            className={`text-[9px] font-bold uppercase tracking-widest transition-all ${
              visualMode === "sign"
                ? "text-primary underline underline-offset-4"
                : "text-muted-foreground/40 hover:text-foreground"
            }`}
          >
            Signs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {LETTER_KEYS.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => appendSignUnit(letter)}
            className="group relative flex aspect-square items-center justify-center rounded-lg bg-muted/20 text-xs font-bold transition-all hover:bg-muted active:scale-95 border border-transparent hover:border-border/40"
          >
            {visualMode === "normal" ? (
              letter
            ) : (
              <AslHandSvg letter={letter} size={32} className="opacity-90" />
            )}

            <div className="pointer-events-none absolute -top-12 left-1/2 z-50 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded border bg-popover px-2 py-1 shadow-sm text-[9px] font-bold uppercase tracking-widest">
                {letter}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 pt-6 border-t border-border/30">
        <button
          onClick={() => appendSignUnit("/")}
          className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors"
        >
          [ Boundary ]
        </button>
        <button
          onClick={() => setSignUnits((current) => current.slice(0, -1))}
          className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors"
        >
          [ Backspace ]
        </button>
        <button
          onClick={() => setSignUnits([])}
          className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-destructive transition-colors ml-auto"
        >
          [ Clear ]
        </button>
      </div>
    </div>
  );
}
