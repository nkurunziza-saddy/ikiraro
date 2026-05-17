import { AslHandSvg } from "./asl-hand-svg";
import type { FrameItem } from "./frame-queue";

export function SignDisplay({ frame }: { frame: FrameItem }) {
  if (frame.type === "pause") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2 animate-pulse rounded-full bg-primary"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Pause
        </span>
      </div>
    );
  }

  if (frame.type === "number") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-32 items-center justify-center rounded-2xl border border-border bg-muted">
          <span className="font-mono text-6xl font-bold text-foreground">{frame.value}</span>
        </div>
        {frame.sublabel && (
          <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            {frame.sublabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl border border-border bg-muted p-4">
        <AslHandSvg
          letter={frame.value}
          motion={frame.motion}
          size={160}
          showLabel={false}
          animate={true}
        />
      </div>

      {/* Token info */}
      <div className="flex flex-col items-center gap-2">
        {frame.type === "lexeme" && (
          <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-primary-foreground">
            {frame.label}
          </span>
        )}
        {frame.type === "fingerspell" && (
          <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-accent-foreground">
            FS: {frame.label}
          </span>
        )}

        {frame.sublabel && (
          <span className="text-[10px] text-muted-foreground">{frame.sublabel}</span>
        )}
      </div>

      {/* Advanced Indicators */}
      <div className="flex gap-2 mt-2">
        {frame.facialExpression && (
          <span className="rounded border border-primary/30 px-1.5 py-0.5 text-[8px] font-bold uppercase text-primary">
            🎭 {frame.facialExpression}
          </span>
        )}
        {frame.coarticulation === "blend" && (
          <span className="rounded border border-accent/30 px-1.5 py-0.5 text-[8px] font-bold uppercase text-accent">
            〰 blend
          </span>
        )}
      </div>
    </div>
  );
}
