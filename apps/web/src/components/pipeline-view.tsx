import type { TranslationEnvelope } from "@sensa/communication";
import { describePlan } from "@sensa/communication";
import { SignPlayer } from "./sign-player";

export function PipelineColumn({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950 p-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">{eyebrow}</p>
      <p className="mt-2 text-sm font-medium text-white">{title}</p>
      <p className="mt-3 min-h-[3rem] text-sm leading-6 text-stone-300">{body}</p>
    </div>
  );
}

export function PipelineView({
  envelope,
  rawInput,
}: {
  envelope: TranslationEnvelope | null;
  rawInput: string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PipelineColumn
          eyebrow="Stage 1"
          title="Raw Input"
          body={rawInput || "Waiting for input."}
        />
        <PipelineColumn
          eyebrow="Stage 2"
          title="Normalized"
          body={envelope?.normalizedText || "No normalized text yet."}
        />
        <PipelineColumn
          eyebrow="Stage 3"
          title="Sign Plan"
          body={envelope ? describePlan(envelope.plan).join(" ") : "No plan yet."}
        />
        <PipelineColumn
          eyebrow="Stage 4"
          title="Renderer Queue"
          body={envelope?.rendererQueue.join(" -> ") || "No renderer queue yet."}
        />
      </div>

      {/* The new Sign Player */}
      <SignPlayer plan={envelope?.plan ?? null} />

      <div className="rounded-2xl border border-stone-800 bg-stone-950 px-6 py-4 text-xs leading-6 text-stone-300">
        <span className="mr-2 font-semibold text-white">Pipeline Notes:</span>
        {envelope?.plan.metadata.notes.join(" ") ||
          "Semantic translation waits for Groq; deterministic sign input previews locally."}
      </div>
    </div>
  );
}
