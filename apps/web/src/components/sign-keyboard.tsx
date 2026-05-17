import { useState } from "react";
import { AslHandSvg, Button } from "@sensa/components";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Sign Keyboard
          </h3>
          <p className="text-xs text-muted-foreground">Alphabet interaction.</p>
        </div>
        <div className="flex rounded-full border bg-muted p-1">
          <button
            onClick={() => setVisualMode("normal")}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${
              visualMode === "normal"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Alpha
          </button>
          <button
            onClick={() => setVisualMode("sign")}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${
              visualMode === "sign"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {LETTER_KEYS.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => appendSignUnit(letter)}
            className="group relative flex aspect-square items-center justify-center rounded-xl border bg-muted text-sm font-bold transition-all hover:border-primary/50 hover:bg-muted active:scale-95"
          >
            {visualMode === "normal" ? (
              letter
            ) : (
              <AslHandSvg letter={letter} size={40} className="scale-75 opacity-90" />
            )}

            <div className="pointer-events-none absolute -top-16 left-1/2 z-50 -translate-x-1/2 opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-1">
              <div className="rounded-xl border bg-card p-3 shadow-xl">
                {visualMode === "normal" ? (
                  <AslHandSvg letter={letter} size={64} />
                ) : (
                  <span className="text-xl font-bold">{letter}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={() => appendSignUnit("/")}>
          Boundary
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSignUnits((current) => current.slice(0, -1))}
        >
          Backspace
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setSignUnits([])}>
          Clear
        </Button>
      </div>
    </div>
  );
}
