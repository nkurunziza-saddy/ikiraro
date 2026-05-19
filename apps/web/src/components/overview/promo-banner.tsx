import { Link } from "@tanstack/react-router";

export function PromoBanner() {
  return (
    <div className="flex items-center justify-center gap-3.5 px-6 py-2.5 text-[13px] bg-[var(--ink)] text-[var(--on-dark)] border-b border-[var(--ink-soft)]">
      <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[var(--primary)] text-[var(--on-primary)] rounded-[2px] tracking-[0.5px]">
        v0.3
      </span>
      <span className="text-white/80">
        LinguisticBuffer, SignDetectionPipeline, and typed EventBus are now live.
      </span>
      <Link
        to="/demo"
        className="text-[13px] text-[var(--sunshine-300)] underline underline-offset-[3px] transition-colors hover:text-[var(--sunshine-500)]"
      >
        Try the demo →
      </Link>
    </div>
  );
}
