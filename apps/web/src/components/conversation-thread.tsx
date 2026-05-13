import { TtsControls } from "./tts-controls";

export type ConversationEntry = {
  id: string;
  createdAt: string;
  mode: string;
  track: string;
  raw: string;
  normalized: string;
  signPlan: string[];
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

function ThreadMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-2 text-sm text-stone-100">{value}</p>
    </div>
  );
}

export function ConversationThread({ entries }: { entries: ConversationEntry[] }) {
  return (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-stone-800 bg-stone-950 px-4 py-8 text-center text-sm text-stone-400">
          Commit a speech, text, sign-key, or camera fingerspelling input to build shared state.
        </div>
      ) : (
        [...entries].reverse().map((entry) => (
          <div key={entry.id} className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-stone-800 bg-stone-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-stone-300">
                  {entry.mode}
                </span>
                <span className="rounded-full border border-stone-800 bg-stone-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-stone-300">
                  {entry.track}
                </span>
                <span className="text-xs text-stone-400">{formatTimestamp(entry.createdAt)}</span>
              </div>
              {entry.intakeModel && (
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-200/70">
                  {entry.intakeModel}
                </span>
              )}
            </div>

            <div className="grid gap-3 text-sm leading-6 text-stone-200 lg:grid-cols-4">
              <ThreadMetric label="Raw" value={entry.raw} />
              <ThreadMetric label="Normalized" value={entry.normalized} />
              <ThreadMetric label="Sign Plan" value={entry.signPlan.join(" ") || "No plan"} />
              <ThreadMetric
                label="Renderer Queue"
                value={entry.rendererQueue.join(" -> ") || "No queue"}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-stone-400">
              {entry.note}
              {entry.wordCount ? ` Word timestamps captured: ${entry.wordCount}.` : ""}
            </p>

            <div className="mt-4">
              <TtsControls text={entry.normalized} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
