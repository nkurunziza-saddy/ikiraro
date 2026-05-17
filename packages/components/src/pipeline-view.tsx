import type { TranslationEnvelope } from "@sensa/engine/types";
import { SignPlayer } from "./sign-player";

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-border/70 bg-muted/35 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 break-words text-base leading-7 font-medium whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

export function PipelineView({ envelope }: { envelope: TranslationEnvelope | null }) {
  if (!envelope) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-border/70 bg-muted/25 px-6 py-14 text-center">
        <p className="text-sm font-medium text-foreground">No active translation yet.</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Commit speech, text, manual keys, or a camera sentence to populate the pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard label="Source Input" value={envelope.rawInput || "No source input"} />
        <DetailCard
          label="Planned Gloss"
          value={envelope.plan.glossText || envelope.normalizedText || "No gloss available"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat label="Track" value={envelope.plan.track} />
        <SummaryStat label="Strategy" value={envelope.plan.strategy} />
        <SummaryStat
          label="Confidence"
          value={`${Math.round(envelope.plan.metadata.confidence * 100)}%`}
        />
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          Visual Execution
        </p>
        <SignPlayer plan={envelope.plan} />
      </div>

      <div className="space-y-3 border-t border-border/60 pt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          Renderer Queue
        </p>
        <div className="flex flex-wrap gap-2">
          {envelope.rendererQueue.length > 0 ? (
            envelope.rendererQueue.map((step, index) => (
              <span
                key={`${step}-${index}`}
                className="rounded-full border border-border/70 bg-background/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground"
              >
                {step}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No renderer steps available.</span>
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
