import { useState } from "react";
import { FIXED_PHRASE_LIBRARY, SIGN_LEXICON, buildPhraseUnits } from "@sensa/communication";
import { AslHandSvg } from "./asl-hand-svg";
import { Button } from "./ui/button";

const LETTER_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const QUICK_LEXEMES = [
  "HELLO",
  "HELP",
  "PLEASE",
  "THANK_YOU",
  "WATER",
  "MEDICINE",
  "WHERE",
  "BATHROOM",
  "INTERPRETER",
  "YES",
  "NO",
] as const;

export function SignKeyboard({
  appendSignUnit,
  setSignUnits,
}: {
  appendSignUnit: (unit: string) => void;
  setSignUnits: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [visualMode, setVisualMode] = useState<"normal" | "sign">("normal");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Sign Keyboard</h3>
          <p className="text-xs text-stone-400">Alphabet interaction.</p>
        </div>
        <div className="flex rounded-full border border-stone-800 bg-stone-900 p-1">
          <button
            onClick={() => setVisualMode("normal")}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              visualMode === "normal" ? "bg-white text-black" : "text-stone-400"
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setVisualMode("sign")}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              visualMode === "sign" ? "bg-white text-black" : "text-stone-400"
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
            className="group relative flex aspect-square items-center justify-center rounded-2xl border border-stone-800 bg-stone-900 text-sm font-medium text-white transition hover:border-stone-700 hover:bg-stone-800"
          >
            {visualMode === "normal" ? (
              letter
            ) : (
              <AslHandSvg letter={letter} size={40} className="scale-75" />
            )}

            <div className="pointer-events-none absolute -top-16 left-1/2 z-50 -translate-x-1/2 opacity-0 transition group-hover:opacity-100">
              <div className="rounded-xl border border-stone-700 bg-stone-900 p-2 shadow-2xl">
                {visualMode === "normal" ? (
                  <AslHandSvg letter={letter} size={60} />
                ) : (
                  <span className="text-lg font-bold">{letter}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {QUICK_LEXEMES.map((lexemeId) => (
          <button
            key={lexemeId}
            type="button"
            onClick={() => appendSignUnit(lexemeId)}
            className="rounded-2xl border border-stone-800 bg-stone-900 px-3 py-3 text-left text-xs font-medium tracking-wide text-white transition hover:border-stone-700 hover:bg-stone-800"
          >
            {SIGN_LEXICON[lexemeId].gloss}
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        {FIXED_PHRASE_LIBRARY.slice(0, 4).map((phrase) => (
          <button
            key={phrase.id}
            type="button"
            onClick={() => setSignUnits(buildPhraseUnits(phrase.tokens))}
            className="rounded-[1.15rem] border border-stone-800 bg-stone-950 px-4 py-3 text-left text-sm text-stone-200 transition hover:border-stone-700 hover:bg-stone-900"
          >
            {phrase.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => appendSignUnit("/")} className="text-xs">
          Boundary
        </Button>
        <Button
          variant="outline"
          onClick={() => setSignUnits((current) => current.slice(0, -1))}
          className="text-xs"
        >
          Backspace
        </Button>
        <Button variant="ghost" onClick={() => setSignUnits([])} className="text-xs">
          Clear
        </Button>
      </div>
    </div>
  );
}
