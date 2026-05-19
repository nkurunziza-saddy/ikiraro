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
        <span
          className="text-[10px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--stone)", letterSpacing: "0.3px" }}
        >
          Sign lexicon
        </span>
        <div className="flex gap-1" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
          {(["normal", "sign"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setVisualMode(mode)}
              className="px-3 py-1.5 text-[11px] transition-colors"
              style={{
                fontFamily: "var(--font-mono)",
                color: visualMode === mode ? "var(--ink)" : "var(--stone)",
                borderBottom:
                  visualMode === mode ? "1px solid var(--ink)" : "1px solid transparent",
                marginBottom: "-1px",
              }}
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
            className="group relative flex aspect-square items-center justify-center text-[13px] font-medium transition-all active:scale-95"
            style={{
              borderRadius: "2px",
              border: "1px solid var(--rule-soft)",
              background: "var(--paper-soft)",
              color: "var(--ink)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--rule)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--paper-card)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--rule-soft)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--paper-soft)";
            }}
          >
            {visualMode === "normal" ? (
              letter
            ) : (
              <AslHandSvg letter={letter} size={30} className="opacity-90" />
            )}

            {/* Tooltip */}
            <div
              className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ zIndex: 50 }}
            >
              <div
                className="px-2 py-1 text-[10px] whitespace-nowrap"
                style={{
                  background: "var(--ink)",
                  color: "var(--on-dark)",
                  borderRadius: "2px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {letter}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div
        className="flex flex-wrap gap-4 pt-5"
        style={{ borderTop: "1px solid var(--rule-soft)" }}
      >
        <button
          onClick={() => appendSignUnit("/")}
          className="text-[11px] transition-colors"
          style={{ fontFamily: "var(--font-mono)", color: "var(--stone)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--stone)";
          }}
        >
          [ boundary ]
        </button>
        <button
          onClick={() => setSignUnits((c) => c.slice(0, -1))}
          className="text-[11px] transition-colors"
          style={{ fontFamily: "var(--font-mono)", color: "var(--stone)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--stone)";
          }}
        >
          [ backspace ]
        </button>
        <button
          onClick={() => setSignUnits([])}
          className="ml-auto text-[11px] transition-colors"
          style={{ fontFamily: "var(--font-mono)", color: "var(--stone)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--stone)";
          }}
        >
          [ clear ]
        </button>
      </div>
    </div>
  );
}
