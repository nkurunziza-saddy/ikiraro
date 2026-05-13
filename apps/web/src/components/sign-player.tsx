import type { SignPlan } from "@sensa/communication";
import { SIGN_LEXICON } from "@sensa/communication";
import { PauseIcon, PlayIcon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { PlaybackFrame } from "@/lib/use-sign-playback";
import { useSignPlayback } from "@/lib/use-sign-playback";

import { AslHandSvg } from "./asl-hand-svg";
import { Button } from "./ui/button";

const LEXEME_VISUALS: Record<string, { primary: string; secondary?: string; motion: string }> = {
  AGAIN: { primary: "G", motion: "repeat forward" },
  ALLERGY: { primary: "A", motion: "scratch outward" },
  BATHROOM: { primary: "T", motion: "shake wrist" },
  DOCTOR: { primary: "D", motion: "pulse tap" },
  DRINK: { primary: "D", motion: "tip toward mouth" },
  EMERGENCY: { primary: "E", motion: "urgent burst" },
  FAMILY: { primary: "F", secondary: "F", motion: "circle together" },
  FIND: { primary: "F", motion: "search and locate" },
  FOOD: { primary: "O", motion: "tap to mouth" },
  GO: { primary: "G", motion: "move outward" },
  HELLO: { primary: "B", motion: "wave outward" },
  HELP: { primary: "A", secondary: "B", motion: "lift to palm" },
  INTERPRETER: { primary: "I", motion: "message between two" },
  LEARN: { primary: "L", motion: "pull to forehead" },
  MEDICINE: { primary: "M", secondary: "B", motion: "rub into palm" },
  NAME: { primary: "H", secondary: "H", motion: "cross twice" },
  NEED: { primary: "X", motion: "pull inward" },
  NO: { primary: "U", motion: "tap thumb" },
  NURSE: { primary: "N", motion: "pulse at wrist" },
  PAIN: { primary: "G", secondary: "G", motion: "twist together" },
  PLEASE: { primary: "P", motion: "circle on chest" },
  SCHOOL: { primary: "B", secondary: "B", motion: "clap flat" },
  STOP: { primary: "S", secondary: "B", motion: "cut across palm" },
  THANK_YOU: { primary: "B", motion: "chin outward" },
  UNDERSTAND: { primary: "U", motion: "snap to clarity" },
  WAIT: { primary: "Y", motion: "hold and pulse" },
  WATER: { primary: "W", motion: "tap at chin" },
  WHAT: { primary: "X", motion: "wiggle index" },
  WHEN: { primary: "W", motion: "index circle" },
  WHERE: { primary: "Q", motion: "side sweep" },
  WHO: { primary: "L", motion: "chin arc" },
  YES: { primary: "S", motion: "nod forward" },
};

function formatLexemeLabel(lexemeId: string): string {
  return SIGN_LEXICON[lexemeId as keyof typeof SIGN_LEXICON]?.label ?? lexemeId.replace(/_/g, " ");
}

function getLexemeVisual(lexemeId: string) {
  return (
    LEXEME_VISUALS[lexemeId] ?? {
      primary: lexemeId.replace(/[^A-Z]/g, "").charAt(0) || "A",
      motion: "hold sign posture",
    }
  );
}

function LexemeDisplay({ frame }: { frame: Extract<PlaybackFrame, { type: "lexeme" }> }) {
  const visual = getLexemeVisual(frame.lexemeId);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-stone-800 bg-stone-900 px-6 py-5">
        <AslHandSvg letter={visual.primary} className="h-28 w-28" />
        {visual.secondary ? (
          <AslHandSvg letter={visual.secondary} className="h-20 w-20 opacity-70" />
        ) : null}
      </div>

      <span className="rounded-full border border-stone-800 bg-stone-900 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
        {visual.motion}
      </span>
      <span className="text-[11px] uppercase tracking-[0.36em] text-stone-400">
        {formatLexemeLabel(frame.lexemeId)}
      </span>
    </div>
  );
}

function FingerspellDisplay({ frame }: { frame: Extract<PlaybackFrame, { type: "fingerspell" }> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <AslHandSvg letter={frame.letter} className="h-32 w-32" />
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="rounded-full border border-stone-800 bg-stone-900 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
          Letter {frame.position} of {frame.total}
        </span>
        <span className="text-[11px] uppercase tracking-[0.32em] text-stone-400">{frame.text}</span>
      </div>
    </div>
  );
}

function NumberDisplay({ frame }: { frame: Extract<PlaybackFrame, { type: "number" }> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="rounded-2xl border border-stone-800 bg-stone-900 px-10 py-8">
        <span className="text-6xl font-mono font-bold text-white">{frame.digit}</span>
      </div>
      <span className="rounded-full border border-stone-800 bg-stone-900 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
        Digit {frame.position} of {frame.total}
      </span>
    </div>
  );
}

function PointingDisplay({ frame }: { frame: Extract<PlaybackFrame, { type: "pointing" }> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-4 rounded-2xl border border-stone-800 bg-stone-900 px-7 py-5">
        <AslHandSvg letter="D" className="h-24 w-24" />
        <div className="flex flex-col items-start gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-stone-400">
            Directional sign
          </span>
          <span className="text-2xl font-semibold tracking-[0.24em] text-white">
            {frame.target.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

function PauseDisplay() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-stone-800">
        <div className="h-full w-full bg-stone-500" />
      </div>
      <span className="mt-4 text-[10px] uppercase tracking-[0.28em] text-stone-500">Pause</span>
    </div>
  );
}

function renderFrameDisplay(frame: PlaybackFrame | null) {
  if (!frame) {
    return <div className="text-stone-500">Ready to play</div>;
  }

  switch (frame.type) {
    case "lexeme":
      return <LexemeDisplay frame={frame} />;
    case "fingerspell":
      return <FingerspellDisplay frame={frame} />;
    case "number":
      return <NumberDisplay frame={frame} />;
    case "pointing":
      return <PointingDisplay frame={frame} />;
    case "pause":
      return <PauseDisplay />;
    default:
      return null;
  }
}

export function SignPlayer({ plan }: { plan: SignPlan | null }) {
  const {
    isPlaying,
    progress,
    currentFrame,
    currentIndex,
    speed,
    steps,
    play,
    pause,
    restart,
    setSpeed,
  } = useSignPlayback(plan);
  const currentStep = currentFrame ? Math.min(currentIndex + 1, steps.length) : 0;

  return (
    <div className="flex h-64 flex-col overflow-hidden rounded-2xl border border-stone-800 bg-black">
      <div className="flex flex-1 items-center justify-center p-6">
        {renderFrameDisplay(currentFrame)}
      </div>

      <div className="border-t border-stone-800 bg-stone-950">
        <div className="h-1 w-full bg-stone-900">
          <div
            className="h-full bg-white transition-[width] duration-75 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-stone-800 hover:bg-stone-900"
              onClick={isPlaying ? pause : play}
              disabled={steps.length === 0}
            >
              {isPlaying ? (
                <HugeiconsIcon icon={PauseIcon} size={16} />
              ) : (
                <HugeiconsIcon icon={PlayIcon} size={16} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-stone-800 hover:bg-stone-900"
              onClick={restart}
              disabled={steps.length === 0}
            >
              <HugeiconsIcon icon={RotateLeft01Icon} size={16} />
            </Button>
          </div>

          <div className="text-xs font-medium text-stone-400">
            {steps.length > 0 ? (
              <span>
                {currentStep} / {steps.length} sign steps
              </span>
            ) : (
              <span>No plan loaded</span>
            )}
          </div>

          <div className="flex gap-1">
            {[0.5, 1, 1.5, 2].map((value) => (
              <button
                key={value}
                onClick={() => setSpeed(value)}
                className={`rounded border px-2 py-1 text-[10px] font-semibold transition-colors ${
                  speed === value
                    ? "border-white bg-white text-black"
                    : "border-stone-800 bg-transparent text-stone-400 hover:bg-stone-900 hover:text-white"
                }`}
              >
                {value}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
