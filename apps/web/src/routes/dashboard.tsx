import type { TranslationEnvelope } from "@sensa/engine/types";
import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useState } from "react";

import { PipelineView } from "@sensa/components";
import { Button } from "@sensa/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@sensa/components/ui/alert";
import { useHandTracking } from "@sensa/communication";
import { useCommunicationSession, type ComposerMode } from "@/hooks/use-communication-session";

import { CameraPanel } from "@/components/camera-panel";
import { ConversationThread, type ConversationEntry } from "@/components/conversation-thread";
import { SignKeyboard } from "@/components/sign-keyboard";
import { SpeechComposer } from "@/components/speech-composer";
import { TextComposer } from "@/components/text-composer";

const MODE_LABELS: Record<ComposerMode, string> = {
  speech: "Speech",
  text: "Text",
  sign: "Manual",
};

const MODE_COPY: Record<ComposerMode, string> = {
  speech: "Capture spoken language, transcribe it, and shape it into a signer-facing plan.",
  text: "Refine typed language into a cleaner sign sequence without leaving the console.",
  sign: "Compose lexemes and fingerspelling directly when you need exact manual control.",
};

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
    signPlan: envelope.plan,
    rendererQueue: envelope.rendererQueue,
    note: envelope.plan.metadata.notes[0] ?? "No planner note.",
    intakeModel: envelope.intake?.model ?? null,
    wordCount: envelope.intake?.words.length ?? null,
  };
}

function OverviewStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground/50">{hint}</p>
    </div>
  );
}

function RouteComponent() {
  const camera = useHandTracking();
  const [entries, setEntries] = useState<ConversationEntry[]>([]);

  const session = useCommunicationSession((envelope) => {
    setEntries((prev) => [...prev, createEntry(envelope)]);
  });

  const deferredEntries = useDeferredValue(entries);

  useEffect(() => {
    return () => camera.stop();
  }, []);

  const commitCameraSentence = async () => {
    const sentence = camera.tracking.sentenceText || camera.tracking.currentWord;
    if (!sentence || !session.runtime) return;

    try {
      session.runtime.dispatch({
        type: "translation:cmd:request",
        payload: {
          mode: "text",
          text: sentence,
        },
        timestamp: Date.now(),
        source: "vision-commit",
      });
      camera.clear();
    } catch {
      // Handled by bridge/session eventually if integrated
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground selection:bg-primary/10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-12 lg:py-16">
        {/* Minimal Hero */}
        <section className="space-y-10">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sensa Console
            </div>
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-balance sm:text-6xl">
              Clean intelligence for sign translation.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground/80">
              A professional environment for coordinating speech, text, and vision-based tracking.
            </p>
          </div>

          <div className="grid gap-8 border-y py-10 sm:grid-cols-3 border-border/40">
            <OverviewStat
              label="Mode"
              value={MODE_LABELS[session.mode]}
              hint={MODE_COPY[session.mode]}
            />
            <OverviewStat
              label="Vision"
              value={camera.isActive ? `${camera.fps} FPS` : camera.isReady ? "Ready" : "Offline"}
              hint={camera.error || "Live hand tracking status."}
            />
            <OverviewStat
              label="Context"
              value={`${Math.min(entries.length, 4)} turns`}
              hint="Active conversation window size."
            />
          </div>
        </section>

        <section className="grid gap-16 xl:grid-cols-[1fr_24rem]">
          <div className="flex min-w-0 flex-col gap-16">
            {/* Input Section */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b pb-4 border-border/40">
                <h2 className="text-xl font-bold tracking-tight">Compose</h2>
                <div className="flex gap-2">
                  {(Object.keys(MODE_LABELS) as ComposerMode[]).map((nextMode) => (
                    <button
                      key={nextMode}
                      onClick={() => session.setMode(nextMode)}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all ${
                        session.mode === nextMode
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {MODE_LABELS[nextMode]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-60">
                {session.mode === "speech" && (
                  <SpeechComposer
                    sttModel={session.sttModel}
                    setSttModel={session.setSttModel}
                    speechPrompt={session.speechPrompt}
                    setSpeechPrompt={session.setSpeechPrompt}
                    isWorking={session.isWorking}
                    captureStatus={session.captureStatus}
                    captureLevel={session.captureLevel}
                    onStart={session.startSpeechCapture}
                    onStop={session.commit}
                    onCancel={session.cancelSpeechCapture}
                  />
                )}
                {session.mode === "text" && (
                  <TextComposer
                    textDraft={session.textDraft}
                    setTextDraft={session.setTextDraft}
                    isWorking={session.isWorking}
                  />
                )}
                {session.mode === "sign" && (
                  <div className="rounded-xl border bg-muted/10 p-8 text-center border-border/40">
                    <p className="font-mono text-3xl font-bold tracking-tighter sm:text-4xl">
                      {session.signUnits.join(" ") || "—"}
                    </p>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                      Manual Sequence Preview
                    </p>
                  </div>
                )}
              </div>

              {session.mode !== "speech" && (
                <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                  <Button
                    onClick={session.commit}
                    disabled={
                      session.isWorking ||
                      (session.mode === "text" && !session.textDraft.trim()) ||
                      (session.mode === "sign" && session.signUnits.length === 0)
                    }
                    size="lg"
                    className="min-w-40 font-bold uppercase tracking-widest"
                  >
                    {session.isWorking ? "Processing..." : "Commit"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      session.setSignUnits([]);
                      session.setTextDraft("");
                    }}
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Clear Draft
                  </Button>
                </div>
              )}
            </div>

            {/* Translation Result */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold tracking-tight border-b pb-4 border-border/40">
                Translation
              </h2>
              <div className="rounded-2xl border bg-card/30 p-8 shadow-sm border-border/40">
                <PipelineView envelope={session.previewEnvelope} modelUrl="/models/avatar.glb" />
              </div>
            </div>

            {/* History */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold tracking-tight border-b pb-4 border-border/40">
                Activity
              </h2>
              <ConversationThread entries={deferredEntries} />
            </div>
          </div>

          <aside className="flex flex-col gap-16">
            {/* Vision */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold tracking-tight border-b pb-4 border-border/40">
                Vision
              </h2>
              <div className="rounded-2xl border bg-card/30 p-6 shadow-sm border-border/40">
                <CameraPanel
                  camera={camera}
                  commitCameraSentence={commitCameraSentence}
                  isWorking={session.isWorking}
                />
              </div>
            </div>

            {/* Lexicon */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold tracking-tight border-b pb-4 border-border/40">
                Lexicon
              </h2>
              <div className="rounded-2xl border bg-card/30 p-6 shadow-sm border-border/40">
                <SignKeyboard
                  appendSignUnit={(unit) => {
                    session.setMode("sign");
                    session.setSignUnits((current) => [...current, unit]);
                  }}
                  setSignUnits={session.setSignUnits}
                />
              </div>
            </div>
          </aside>
        </section>

        {session.error && (
          <Alert variant="destructive" className="mt-8">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{session.error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
