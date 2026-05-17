import { AslHandSvg } from "./asl-hand-svg";
import type { FrameItem } from "@sensa/engine/planning";

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
        <div className="flex size-32 items-center justify-center rounded-xl border bg-muted">
          <span className="font-mono text-6xl font-bold text-foreground">{frame.value}</span>
        </div>
        {frame.sublabel && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {frame.sublabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="rounded-xl border bg-muted p-6 shadow-sm">
        <AslHandSvg
          letter={frame.value}
          motion={frame.motion}
          size={160}
          showLabel={false}
          animate={true}
        />
      </div>

      {/* Token info */}
      <div className="flex flex-col items-center gap-3">
        {frame.type === "lexeme" && (
          <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-sm">
            {frame.label}
          </span>
        )}
        {frame.type === "fingerspell" && (
          <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground border shadow-sm">
            FS: {frame.label}
          </span>
        )}

        {frame.sublabel && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {frame.sublabel}
          </span>
        )}
      </div>

      {/* Advanced Indicators */}
      <div className="flex gap-2">
        {frame.facialExpression && (
          <span className="rounded-md border bg-primary/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-primary">
            🎭 {frame.facialExpression}
          </span>
        )}
        {frame.coarticulation === "blend" && (
          <span className="rounded-md border bg-secondary px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-secondary-foreground">
            〰 blend
          </span>
        )}
      </div>
    </div>
  );
}
