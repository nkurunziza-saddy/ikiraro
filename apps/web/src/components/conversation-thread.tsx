import { TtsControls } from "@ikiraro/components";
import type { SignPlan, FrameItem } from "@ikiraro/engine/types";

export type ConversationEntry = {
  id: string;
  createdAt: string;
  mode: string;
  track: string;
  raw: string;
  normalized: string;
  signPlan: SignPlan;
  rendererQueue: FrameItem[];
  note: string;
  intakeModel: string | null;
  wordCount: number | null;
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ThreadMetric({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        {label}
      </p>
      <p className="text-sm leading-relaxed font-semibold text-foreground/90 whitespace-pre-wrap">
        {value}
      </p>
      {helper ? (
        <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wide">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export function ConversationThread({ entries }: { entries: ConversationEntry[] }) {
  return (
    <div className="flex flex-col gap-12">
      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/10 px-4 py-16 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          History is empty
        </div>
      ) : (
        [...entries].reverse().map((entry, index) => (
          <div
            key={entry.id}
            className={`space-y-8 ${index !== 0 ? "pt-12 border-t border-border/30" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-muted px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {entry.mode}
                </span>
                <span className="rounded-md bg-muted px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {entry.track}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest ml-1">
                  {formatTimestamp(entry.createdAt)}
                </span>
              </div>
              {entry.intakeModel && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60 border border-primary/20 rounded-md px-2 py-1">
                  {entry.intakeModel}
                </span>
              )}
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <ThreadMetric label="Source" value={entry.raw || "—"} />
              <ThreadMetric
                label="Gloss"
                value={entry.signPlan.glossText || entry.normalized || "—"}
              />
              <ThreadMetric
                label="Plan"
                value={entry.signPlan.strategy}
                helper={`${Math.round(entry.signPlan.metadata.confidence * 100)}% confidence`}
              />
              <ThreadMetric
                label="Execution"
                value={entry.rendererQueue.map((f) => f.label).join(" · ") || "—"}
                helper={`${entry.signPlan.clauses.length} clauses`}
              />
            </div>

            {entry.note && (
              <div className="max-w-2xl border-l-2 pl-6">
                <p className="text-xs leading-relaxed text-muted-foreground/70 italic">
                  {entry.note}
                </p>
              </div>
            )}

            <div className="pt-2">
              <TtsControls text={entry.normalized} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
