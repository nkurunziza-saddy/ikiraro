export type VoiceState = "idle" | "listening" | "captured";

interface VoiceBarProps {
  state: VoiceState;
  text?: string;
}

const defaults: Record<VoiceState, string> = {
  idle: "Tap the mic to begin.",
  listening: "Listening…",
  captured: "",
};

export function VoiceBar({ state, text }: VoiceBarProps) {
  const label = text || defaults[state];

  return (
    <div className="bg-paper-card border-rule-soft inline-flex items-center gap-3 rounded-full border px-[18px] py-2.5 font-sans text-[13px] italic text-steel shadow-[var(--sh-2)]">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          state === "idle" ? "bg-stone" : "bg-primary animate-voice-pulse"
        }`}
      />
      <span>{label}</span>
    </div>
  );
}
