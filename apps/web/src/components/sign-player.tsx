import { useEffect, useMemo, useState } from "react";
import type { SignPlan } from "@sensa/communication";
import { AslHandSvg } from "./asl-hand-svg";
import { TtsControls } from "./tts-controls";
import { Button } from "./ui/button";

export function SignPlayer({ plan }: { plan: SignPlan | null }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const tokens = useMemo(() => {
    if (!plan) return [];
    return plan.clauses.flatMap((c) => c.tokens);
  }, [plan]);

  const queue = useMemo(() => {
    const q: { type: string; value: string; duration: number }[] = [];
    tokens.forEach((token) => {
      if (token.type === "pause") {
        q.push({ type: "pause", value: "/", duration: token.durationMs });
      } else if (token.type === "lexeme") {
        q.push({ type: "lexeme", value: token.lexemeId, duration: token.durationMs });
      } else if (token.type === "fingerspell") {
        token.text.split("").forEach((char) => {
          q.push({ type: "fs", value: char, duration: token.durationMs / token.text.length });
        });
      }
    });
    return q;
  }, [tokens]);

  useEffect(() => {
    if (!isPlaying || queue.length === 0) return;

    const currentFrame = queue[frameIndex];
    if (!currentFrame) {
      setIsPlaying(false);
      setFrameIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      if (frameIndex < queue.length - 1) {
        setFrameIndex((i) => i + 1);
      } else {
        setIsPlaying(false);
        setFrameIndex(0);
      }
    }, currentFrame.duration / speed);

    return () => clearTimeout(timer);
  }, [frameIndex, isPlaying, queue, speed]);

  if (!plan || queue.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-stone-800 bg-stone-950">
        <p className="text-sm text-stone-500">No sign plan to play.</p>
      </div>
    );
  }

  const currentFrame = queue[frameIndex]!;

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-stone-800 bg-stone-950">
        <div className="absolute inset-0 flex items-center justify-center">
          {currentFrame.type === "pause" ? (
            <div className="h-2 w-12 rounded-full bg-stone-800" />
          ) : (
            <AslHandSvg letter={currentFrame.value} size={200} />
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
            {currentFrame.type}: {currentFrame.value}
          </div>
          <div className="text-[10px] font-bold text-stone-500">
            {frameIndex + 1} / {queue.length}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900 p-2">
          <Button size="sm" onClick={() => setIsPlaying(!isPlaying)} className="h-9 min-w-[5rem]">
            {isPlaying ? "Pause" : "Play Plan"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsPlaying(false);
              setFrameIndex(0);
            }}
          >
            Reset
          </Button>
          <div className="ml-auto flex gap-1">
            {[0.5, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
                  speed === s ? "bg-white text-black" : "text-stone-500 hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <TtsControls text={plan.normalizedText} />
      </div>
    </div>
  );
}
