interface CaptionBarProps {
  text: string;
  compact?: boolean;
}

export function CaptionBar({ text, compact = false }: CaptionBarProps) {
  return (
    <div
      className={`bg-ink/95 text-on-dark inline-flex items-center gap-3 rounded-[3px] font-sans shadow-[var(--sh-3)] ${
        compact ? "px-3 py-2 text-[13px] min-w-0" : "px-4 py-3 text-[14px] min-w-[320px]"
      }`}
    >
      <span className="shrink-0 px-[7px] py-0.5 bg-primary text-on-primary text-[10px] font-bold tracking-[1.2px] uppercase rounded-[3px]">
        CC
      </span>
      <span>{text}</span>
    </div>
  );
}
