import { useMemo } from "react";
import { TtsControls, Badge } from "@ikiraro/components";
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

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.05em] uppercase">
        {label}
      </p>
      <p className="text-foreground text-[14px] font-medium leading-snug">{value}</p>
      {sub && <p className="text-muted-foreground text-[11px]">{sub}</p>}
    </div>
  );
}

export function ConversationThread({ entries }: { entries: ConversationEntry[] }) {
  const reversedEntries = useMemo(() => [...entries].reverse(), [entries]);

  if (entries.length === 0) {
    return (
      <div className="border-border rounded-[3px] px-6 py-14 text-center border-dashed border">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.05em] uppercase">
          No translations yet — compose and commit to populate history.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {reversedEntries.map((entry) => (
        <div key={entry.id} className="border-border py-10 border-b">
          {/* Entry header */}
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-secondary text-muted-foreground border-border rounded-[2px] h-auto px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em]"
              >
                {entry.mode}
              </Badge>
              <Badge
                variant="outline"
                className="bg-secondary text-muted-foreground border-border rounded-[2px] h-auto px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em]"
              >
                {entry.track}
              </Badge>
              <span className="text-muted-foreground ml-1 text-[11px] font-semibold tracking-[0.05em] uppercase">
                {formatTimestamp(entry.createdAt)}
              </span>
            </div>

            {entry.intakeModel && (
              <Badge
                variant="outline"
                className="text-foreground border-border rounded-[2px] h-auto px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em]"
              >
                {entry.intakeModel}
              </Badge>
            )}
          </div>

          {/* Metrics grid */}
          <div className="mb-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Source" value={entry.raw || "—"} />
            <Metric label="Gloss" value={entry.signPlan.glossText || entry.normalized || "—"} />
            <Metric
              label="Strategy"
              value={entry.signPlan.strategy}
              sub={`${Math.round(entry.signPlan.metadata.confidence * 100)}% confidence`}
            />
            <Metric
              label="Execution"
              value={entry.rendererQueue.map((f) => f.label).join(" · ") || "—"}
              sub={`${entry.signPlan.clauses.length} clauses`}
            />
          </div>

          {/* Planner note */}
          {entry.note && (
            <div className="border-border mb-5 border-l-2 pl-5">
              <p className="text-muted-foreground text-[13px] leading-relaxed">{entry.note}</p>
            </div>
          )}

          <TtsControls text={entry.normalized} />
        </div>
      ))}
    </div>
  );
}
