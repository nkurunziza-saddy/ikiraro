import { TtsControls } from "@sensa/components";
import type { SignPlan } from "@sensa/engine/types";

export type ConversationEntry = {
  id: string;
  createdAt: string;
  mode: string;
  track: string;
  raw: string;
  normalized: string;
  signPlan: SignPlan;
  rendererQueue: string[];
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
    <div className="rounded-[1.25rem] border border-border/70 bg-muted/35 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 break-words text-sm leading-6 font-medium whitespace-pre-wrap">{value}</p>
      {helper ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function ConversationThread({ entries }: { entries: ConversationEntry[] }) {
  return (
    <div className="space-y-6">
      {entries.length === 0 ? (
        <div className="rounded-[1.6rem] border border-dashed border-border/70 bg-muted/30 px-4 py-12 text-center text-sm text-muted-foreground">
          No activity yet. Commit a message to start the conversation.
        </div>
      ) : (
        [...entries].reverse().map((entry) => (
          <div
            key={entry.id}
            className="rounded-[1.6rem] border border-border/70 bg-card/90 p-6 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.7)]"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-border/70 bg-muted/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  {entry.mode}
                </span>
                <span className="rounded-full border border-border/70 bg-muted/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  {entry.track}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatTimestamp(entry.createdAt)}
                </span>
              </div>
              {entry.intakeModel ? (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                  {entry.intakeModel}
                </span>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ThreadMetric label="Input" value={entry.raw || "No raw input"} />
              <ThreadMetric
                label="Gloss"
                value={entry.signPlan.glossText || entry.normalized || "No gloss"}
              />
              <ThreadMetric
                label="Plan"
                value={`${entry.signPlan.strategy} · ${Math.round(entry.signPlan.metadata.confidence * 100)}% confidence`}
                helper={`${entry.signPlan.clauses.length} clause(s) in the current sign plan.`}
              />
              <ThreadMetric
                label="Renderer Queue"
                value={entry.rendererQueue.join(" · ") || "No queue"}
                helper={`Normalized text: ${entry.normalized || "No normalized output"}`}
              />
            </div>

            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              {entry.note}
              {entry.wordCount ? ` Word timestamps captured: ${entry.wordCount}.` : ""}
            </p>

            <div className="mt-6 border-t border-border/60 pt-4">
              <TtsControls text={entry.normalized} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
