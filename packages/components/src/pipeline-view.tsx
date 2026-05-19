import type { TranslationEnvelope } from "@ikiraro/engine/types";

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        {label}
      </p>
      <p className="break-words text-sm leading-relaxed font-semibold text-foreground/90 whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        {label}
      </p>
      <p className="text-sm font-bold text-primary/80">{value}</p>
    </div>
  );
}

export function PipelineView({ envelope }: { envelope: TranslationEnvelope | null }) {
  if (!envelope) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/5 px-6 py-16 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
          Waiting for Input
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-8 sm:grid-cols-2">
        <DetailCard label="Source" value={envelope.rawInput || "—"} />
        <DetailCard
          label="Gloss"
          value={envelope.plan.glossText || envelope.normalizedText || "—"}
        />
      </div>

      <div className="grid gap-8 sm:grid-cols-3 border-y border-border/30 py-8">
        <SummaryStat label="Track" value={envelope.plan.track} />
        <SummaryStat label="Strategy" value={envelope.plan.strategy} />
        <SummaryStat
          label="Confidence"
          value={`${Math.round(envelope.plan.metadata.confidence * 100)}%`}
        />
      </div>

      <div className="space-y-4 pt-8 border-t border-border/30">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
          Renderer Steps
        </p>
        <div className="flex flex-wrap gap-2">
          {envelope.rendererQueue.length > 0 ? (
            envelope.rendererQueue.map((frame, index) => (
              <span
                key={`${frame.label}-${index}`}
                className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80 bg-muted px-2 py-1 rounded"
              >
                {frame.label}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground/30 italic uppercase tracking-widest">
              Queue is empty
            </span>
          )}
        </div>
      </div>

      {envelope.plan.metadata.notes.length > 0 ? (
        <p className="text-xs leading-6 text-muted-foreground">
          {envelope.plan.metadata.notes.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
