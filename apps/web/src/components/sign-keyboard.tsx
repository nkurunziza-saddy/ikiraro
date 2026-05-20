import { useState } from "react";
import { AslHandSvg } from "@ikiraro/components";

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
    <div className="flex flex-col gap-7">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.05em] uppercase">
          Sign lexicon
        </span>
        <div className="border-border flex gap-1 border-b">
          {(["normal", "sign"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setVisualMode(mode)}
              className={`px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.05em] transition-colors mb-[-1px] border-b ${
                visualMode === mode
                  ? "text-foreground border-foreground"
                  : "text-muted-foreground border-transparent"
              }`}
            >
              {mode === "normal" ? "Alpha" : "Signs"}
            </button>
          ))}
        </div>
      </div>

      {/* Key grid */}
      <div className="grid grid-cols-6 gap-2">
        {LETTER_KEYS.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => appendSignUnit(letter)}
            className="group bg-secondary border-border text-foreground relative flex aspect-square items-center justify-center rounded-[2px] border text-[13px] font-medium transition-all hover:bg-card hover:border-foreground/20 active:scale-95"
          >
            {visualMode === "normal" ? (
              letter
            ) : (
              <AslHandSvg letter={letter} size={30} className="opacity-90" />
            )}

            {/* Tooltip */}
            <div className="bg-foreground text-background pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 rounded-[2px] px-2 py-1 text-[11px] font-medium uppercase tracking-[0.05em] opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
              {letter}
            </div>
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="border-border flex flex-wrap gap-4 pt-5 border-t">
        <button
          onClick={() => appendSignUnit("/")}
          className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.05em] transition-colors hover:text-foreground"
        >
          [ boundary ]
        </button>
        <button
          onClick={() => setSignUnits((c) => c.slice(0, -1))}
          className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.05em] transition-colors hover:text-foreground"
        >
          [ backspace ]
        </button>
        <button
          onClick={() => setSignUnits([])}
          className="text-muted-foreground ml-auto text-[11px] font-medium uppercase tracking-[0.05em] transition-colors hover:text-foreground"
        >
          [ clear ]
        </button>
      </div>
    </div>
  );
}
