import {
  buildDeterministicPlanFromUnits,
  createTranslationEnvelope,
  describePlan,
  getEvaluationReadinessSummary,
  type PlannerModel,
  type TranslationContext,
  type TranslationDomain,
  type TranslationEnvelope,
} from "@sensa/communication";
import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { PipelineView } from "@/components/pipeline-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translateSpeechRequest, translateTextRequest } from "@/lib/communication-client";
import { useHandTracking } from "@/lib/use-hand-tracking";
import { authClient } from "@/lib/auth-client";

import { SpeechComposer } from "@/components/speech-composer";
import { TextComposer } from "@/components/text-composer";
import { SignKeyboard } from "@/components/sign-keyboard";
import { CameraPanel } from "@/components/camera-panel";
import { ConversationThread, type ConversationEntry } from "@/components/conversation-thread";

type ComposerMode = "speech" | "text" | "sign";

const MODE_SUMMARIES: Record<
  ComposerMode,
  {
    label: string;
    eyebrow: string;
    hint: string;
  }
> = {
  speech: {
    label: "Speech Intake",
    eyebrow: "Semantic Track",
    hint: "Record audio and run Groq STT with word timing.",
  },
  text: {
    label: "Text Intake",
    eyebrow: "Semantic Track",
    hint: "Type naturally and produce a strict sign plan.",
  },
  sign: {
    label: "Manual Keys",
    eyebrow: "Deterministic Track",
    hint: "Use lexemes, fingerspelling, and fixed phrases.",
  },
};

const PLANNER_OPTIONS: PlannerModel[] = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];
const DOMAIN_OPTIONS: TranslationDomain[] = ["general", "support", "healthcare", "education"];
const EVALUATION_SUMMARY = getEvaluationReadinessSummary();

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function createEntry(envelope: TranslationEnvelope): ConversationEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    mode: envelope.mode,
    track: envelope.plan.track,
    raw: envelope.rawInput,
    normalized: envelope.normalizedText,
    signPlan: describePlan(envelope.plan),
    rendererQueue: envelope.rendererQueue,
    note: envelope.plan.metadata.notes[0] ?? "No planner note.",
    intakeModel: envelope.intake?.model ?? null,
    wordCount: envelope.intake?.words.length ?? null,
  };
}

function buildConversationContext(
  entries: ConversationEntry[],
  domain: TranslationDomain,
): TranslationContext {
  return {
    domain,
    locale: "en-US",
    spellingHints: ["Sensa", "ASL", "Kigali"],
    previousTurns: entries.slice(-4).map((entry) => ({
      role: entry.track === "semantic-translation" ? "hearing" : "signer",
      text: entry.normalized,
    })),
  };
}

function RouteComponent() {
  const { data: session } = authClient.useSession();
  const camera = useHandTracking();

  const [mode, setMode] = useState<ComposerMode>("text");
  const [plannerModel, setPlannerModel] = useState<PlannerModel>("openai/gpt-oss-20b");
  const [sttModel, setSttModel] = useState("whisper-large-v3");
  const [domain, setDomain] = useState<TranslationDomain>("healthcare");

  const [textDraft, setTextDraft] = useState("");
  const [speechPrompt, setSpeechPrompt] = useState("Sensa, ASL, Kigali");
  const [speechAudio, setSpeechAudio] = useState<Blob | null>(null);

  const [signUnits, setSignUnits] = useState<string[]>([]);
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [activeEnvelope, setActiveEnvelope] = useState<TranslationEnvelope | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deferredEntries = useDeferredValue(entries);

  useEffect(() => {
    return () => camera.stop();
  }, []);

  const operatorName = session?.user.name?.split(" ")[0] ?? "Operator";
  const currentContext = useMemo(
    () => buildConversationContext(entries, domain),
    [domain, entries],
  );

  const signPreviewEnvelope = useMemo(() => {
    const plan = buildDeterministicPlanFromUnits(signUnits, currentContext, "sign-keys");
    return createTranslationEnvelope("sign-keys", signUnits.join(" "), plan);
  }, [currentContext, signUnits]);

  const pipelineEnvelope =
    mode === "sign" ? signPreviewEnvelope : activeEnvelope?.mode === mode ? activeEnvelope : null;

  const commitCurrentMode = async () => {
    setIsWorking(true);
    setError(null);

    try {
      let envelope: TranslationEnvelope;

      if (mode === "speech") {
        if (!speechAudio) throw new Error("Record audio first.");
        envelope = await translateSpeechRequest({
          audio: speechAudio,
          sttModel: sttModel as any,
          plannerModel,
          prompt: speechPrompt,
          domain,
          context: currentContext,
        });
        setSpeechAudio(null);
      } else if (mode === "text") {
        envelope = await translateTextRequest({
          text: textDraft,
          plannerModel,
          context: currentContext,
        });
        setTextDraft("");
      } else {
        envelope = signPreviewEnvelope;
        setSignUnits([]);
      }

      setActiveEnvelope(envelope);
      setEntries((current) => [...current, createEntry(envelope)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline failed.");
    } finally {
      setIsWorking(false);
    }
  };

  const commitCameraSentence = () => {
    const sentence = camera.tracking.sentenceText || camera.tracking.currentWord;
    if (!sentence) return;

    const units = sentence
      .toUpperCase()
      .split(/\s+/)
      .flatMap((w) => [...w.split(""), "/"])
      .slice(0, -1);
    const plan = buildDeterministicPlanFromUnits(units, currentContext, "camera-fingerspell");
    const envelope = createTranslationEnvelope("camera-fingerspell", sentence, plan);
    setActiveEnvelope(envelope);
    setEntries((current) => [...current, createEntry(envelope)]);
  };

  return (
    <div className="min-h-full bg-black text-stone-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-stone-800 bg-stone-950 p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-amber-200/70">
                  Sensa Bridge
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Communication Interface
                </h1>
                <p className="max-w-xl text-sm leading-6 text-stone-300">
                  Welcome back, {operatorName}. Manage semantic translation and deterministic
                  fallback tracks from one surface.
                </p>
              </div>

              <div className="grid min-w-[15rem] gap-2">
                <StatusBadge label="Planner" value={plannerModel.split("/")[1]} tone="cyan" />
                <StatusBadge
                  label="Vision"
                  value={camera.isActive ? "Active" : "Ready"}
                  tone="emerald"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.entries(MODE_SUMMARIES) as any).map(([value, summary]: any) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                    mode === value
                      ? "border-white bg-stone-900"
                      : "border-stone-800 bg-stone-950 hover:bg-stone-900"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">
                    {summary.eyebrow}
                  </p>
                  <p className="mt-2 text-base font-medium text-white">{summary.label}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-300">{summary.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <Card className="rounded-2xl border border-stone-800 bg-stone-950">
            <CardHeader className="border-b border-stone-800">
              <CardTitle>System Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-5">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Suites" value={`${EVALUATION_SUMMARY.suites}`} />
                <MetricCard label="Cases" value={`${EVALUATION_SUMMARY.heldOutCases}`} />
              </div>
              <p className="text-xs text-stone-400">
                Continuous ASL and held-out phrase coverage across {DOMAIN_OPTIONS.length} domains.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <Card className="rounded-2xl border border-stone-800 bg-stone-950">
              <CardHeader className="border-b border-stone-800">
                <CardTitle>Semantic Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 py-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">
                      Domain
                    </span>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value as any)}
                      className="rounded-[1rem] border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-white"
                    >
                      {DOMAIN_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">
                      Planner
                    </span>
                    <select
                      value={plannerModel}
                      onChange={(e) => setPlannerModel(e.target.value as any)}
                      className="rounded-[1rem] border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-white"
                    >
                      {PLANNER_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {mode === "speech" && (
                  <SpeechComposer
                    sttModel={sttModel}
                    setSttModel={setSttModel}
                    speechPrompt={speechPrompt}
                    setSpeechPrompt={setSpeechPrompt}
                    onSpeechCaptured={setSpeechAudio}
                    isWorking={isWorking}
                  />
                )}
                {mode === "text" && (
                  <TextComposer
                    textDraft={textDraft}
                    setTextDraft={setTextDraft}
                    isWorking={isWorking}
                  />
                )}
                {mode === "sign" && (
                  <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-stone-400">
                      Current Sequence
                    </p>
                    <p className="mt-3 min-h-14 text-lg font-medium tracking-wide text-white">
                      {signUnits.join(" ") || "Use the keys to build a sequence."}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={commitCurrentMode}
                    disabled={
                      isWorking ||
                      (mode === "speech" && !speechAudio) ||
                      (mode === "text" && !textDraft)
                    }
                  >
                    {isWorking ? "Processing..." : "Translate & Commit"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSignUnits([]);
                      setTextDraft("");
                      setSpeechAudio(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-stone-800 bg-stone-950">
              <CardHeader className="border-b border-stone-800">
                <CardTitle>Pipeline & Playback</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                <PipelineView
                  envelope={pipelineEnvelope}
                  rawInput={mode === "sign" ? signUnits.join(" ") : textDraft}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-stone-800 bg-stone-950">
              <CardHeader className="border-b border-stone-800">
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                <ConversationThread entries={deferredEntries} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border border-stone-800 bg-stone-950">
              <CardContent className="py-6">
                <SignKeyboard
                  appendSignUnit={(u) => {
                    setMode("sign");
                    setSignUnits((c) => [...c, u]);
                  }}
                  setSignUnits={setSignUnits}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-stone-800 bg-stone-950">
              <CardHeader className="border-b border-stone-800">
                <CardTitle>Camera Tracker</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                <CameraPanel camera={camera} commitCameraSentence={commitCameraSentence} />
              </CardContent>
            </Card>
          </div>
        </section>

        {error && (
          <div className="rounded-[1.4rem] border border-rose-300/20 bg-rose-300/10 px-5 py-4 text-sm text-rose-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "cyan" | "emerald";
}) {
  const tones = {
    amber: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  };
  return (
    <div className={`rounded-full border px-3 py-2 ${tones[tone]}`}>
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.28em]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-stone-800 bg-stone-900 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
