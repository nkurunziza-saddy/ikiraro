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

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p
        className="text-[10px]"
        style={{ fontFamily: "var(--font-mono)", color: "var(--stone)", letterSpacing: "0.3px" }}
      >
        {label}
      </p>
      <p className="text-[14px] leading-snug font-medium" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px]" style={{ color: "var(--steel)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function ConversationThread({ entries }: { entries: ConversationEntry[] }) {
  if (entries.length === 0) {
    return (
      <div
        className="px-6 py-14 text-center"
        style={{
          border: "1px dashed var(--rule)",
          borderRadius: "3px",
        }}
      >
        <p
          className="text-[11px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--stone)", letterSpacing: "0.3px" }}
        >
          No translations yet — compose and commit to populate history.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {[...entries].reverse().map((entry) => (
        <div
          key={entry.id}
          className="py-10"
          style={{ borderBottom: "1px solid var(--rule-soft)" }}
        >
          {/* Entry header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 text-[10px] font-medium"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "var(--paper-soft)",
                  color: "var(--stone)",
                  borderRadius: "2px",
                  border: "1px solid var(--rule-soft)",
                }}
              >
                {entry.mode}
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-medium"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "var(--paper-soft)",
                  color: "var(--stone)",
                  borderRadius: "2px",
                  border: "1px solid var(--rule-soft)",
                }}
              >
                {entry.track}
              </span>
              <span
                className="text-[11px] ml-1"
                style={{ fontFamily: "var(--font-mono)", color: "var(--stone)" }}
              >
                {formatTimestamp(entry.createdAt)}
              </span>
            </div>

            {entry.intakeModel && (
              <span
                className="px-2 py-0.5 text-[10px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--primary)",
                  border: "1px solid var(--rule-soft)",
                  borderRadius: "2px",
                }}
              >
                {entry.intakeModel}
              </span>
            )}
          </div>

          {/* Metrics grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-7">
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
            <div className="mb-5 pl-5" style={{ borderLeft: "2px solid var(--rule)" }}>
              <p className="text-[13px] leading-relaxed italic" style={{ color: "var(--steel)" }}>
                {entry.note}
              </p>
            </div>
          )}

          <TtsControls text={entry.normalized} />
        </div>
      ))}
    </div>
  );
}
