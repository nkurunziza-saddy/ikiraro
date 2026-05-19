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
    <div className="inline-flex items-center gap-3 bg-paper-card border border-rule-soft rounded-full px-[18px] py-2.5 font-sans text-[13px] text-steel italic shadow-[var(--sh-2)]">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          background: state === "idle" ? "var(--stone)" : "var(--primary)",
          animation: state === "idle" ? "none" : "voice-pulse 1s ease-in-out infinite",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
