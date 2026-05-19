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
        <span className="font-mono text-stone text-[10px] tracking-[0.3px]">Sign lexicon</span>
        <div className="border-rule-soft flex gap-1 border-b">
          {(["normal", "sign"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setVisualMode(mode)}
              className={`font-mono px-3 py-1.5 text-[11px] transition-colors mb-[-1px] border-b ${
                visualMode === mode ? "text-ink border-ink" : "text-stone border-transparent"
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
            className="group bg-paper-soft border-rule-soft text-ink relative flex aspect-square items-center justify-center rounded-[2px] border text-[13px] font-medium transition-all hover:bg-paper-card hover:border-rule active:scale-95"
          >
            {visualMode === "normal" ? (
              letter
            ) : (
              <AslHandSvg letter={letter} size={30} className="opacity-90" />
            )}

            {/* Tooltip */}
            <div className="bg-ink text-on-dark font-mono pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 rounded-[2px] px-2 py-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
              {letter}
            </div>
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="border-rule-soft flex flex-wrap gap-4 pt-5 border-t">
        <button
          onClick={() => appendSignUnit("/")}
          className="font-mono text-stone text-[11px] transition-colors hover:text-primary"
        >
          [ boundary ]
        </button>
        <button
          onClick={() => setSignUnits((c) => c.slice(0, -1))}
          className="font-mono text-stone text-[11px] transition-colors hover:text-ink"
        >
          [ backspace ]
        </button>
        <button
          onClick={() => setSignUnits([])}
          className="font-mono text-stone ml-auto text-[11px] transition-colors hover:text-primary"
        >
          [ clear ]
        </button>
      </div>
    </div>
  );
}
