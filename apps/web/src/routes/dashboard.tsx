import type { TranslationEnvelope } from "@sensa/engine/types";
import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useState } from "react";

import { PipelineView } from "@sensa/components";
import { Button } from "@sensa/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sensa/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@sensa/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sensa/components/ui/tabs";
import { useHandTracking } from "@/lib/use-hand-tracking";
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
    <div className="rounded-[1.35rem] border border-border/70 bg-background/70 p-4 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}

function RouteComponent() {
  const camera = useHandTracking();
  const [entries, setEntries] = useState<ConversationEntry[]>([]);

  const session = useCommunicationSession(entries, (envelope) => {
    setEntries((prev) => [...prev, createEntry(envelope)]);
  });

  const deferredEntries = useDeferredValue(entries);

  useEffect(() => {
    return () => camera.stop();
  }, []);

  const commitCameraSentence = async () => {
    const sentence = camera.tracking.sentenceText || camera.tracking.currentWord;
    if (!sentence) return;

    try {
      const context = session.bridge.buildContext(entries);
      const rawEnvelope = await session.bridge.translate({
        mode: "text",
        text: sentence,
        context,
      });
      const envelope = { ...rawEnvelope, mode: "camera-fingerspell" as const };
      setEntries((prev) => [...prev, createEntry(envelope)]);
      camera.clear();
    } catch {
      // Handled by bridge/session eventually if integrated
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-[0_32px_120px_-56px_rgba(0,0,0,0.65)] lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,159,72,0.20),transparent_34%),radial-gradient(circle_at_80%_18%,rgba(118,92,51,0.22),transparent_28%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
                Sensa Bridge
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  Translation control room for speech, text, and live fingerspelling.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Keep capture, planning, playback, and conversation history in one working surface.
                  The current pass favors deterministic plans and clear operator feedback.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-medium text-muted-foreground">
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                  {MODE_LABELS[session.mode]} mode
                </span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                  {entries.length} committed turn{entries.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                  {camera.isReady ? `${camera.delegate ?? "Ready"} vision` : "Vision booting"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <OverviewStat
                label="Current Mode"
                value={MODE_LABELS[session.mode]}
                hint={MODE_COPY[session.mode]}
              />
              <OverviewStat
                label="Vision Status"
                value={camera.isActive ? `${camera.fps} FPS` : camera.isReady ? "Ready" : "Booting"}
                hint={
                  camera.error
                    ? camera.error
                    : camera.isActive
                      ? "Live hand tracking is actively sampling frames."
                      : "Camera capture is idle until you start it."
                }
              />
              <OverviewStat
                label="Recent Context"
                value={`${Math.min(entries.length, 4)} turns`}
                hint="The planner carries the last few conversation turns into each new request."
              />
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-8">
            <Card className="rounded-[1.75rem] border border-border/70 bg-card/95">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>
                  Choose an intake path, capture the message, and commit it into the shared
                  conversation.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs
                  value={session.mode}
                  onValueChange={(value) => session.setMode(value as ComposerMode)}
                >
                  <div className="border-b border-border/60 px-4 py-4">
                    <TabsList className="h-auto flex-wrap gap-2 rounded-[1rem] border border-border/70 bg-background/80 p-1">
                      {(Object.keys(MODE_LABELS) as ComposerMode[]).map((nextMode) => (
                        <TabsTrigger
                          key={nextMode}
                          value={nextMode}
                          className="rounded-[0.85rem] px-4 py-2 text-sm"
                        >
                          {MODE_LABELS[nextMode]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <div className="space-y-6 p-6">
                    <div className="max-w-2xl">
                      <p className="text-sm leading-7 text-muted-foreground">
                        {MODE_COPY[session.mode]}
                      </p>
                    </div>

                    <TabsContent value="speech" className="mt-0">
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
                    </TabsContent>

                    <TabsContent value="text" className="mt-0">
                      <TextComposer
                        textDraft={session.textDraft}
                        setTextDraft={session.setTextDraft}
                        isWorking={session.isWorking}
                      />
                    </TabsContent>

                    <TabsContent value="sign" className="mt-0">
                      <div className="rounded-[1.6rem] border border-border/70 bg-muted/50 p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                          Current Sequence
                        </p>
                        <p className="mt-4 min-h-12 font-mono text-xl font-medium tracking-tight sm:text-2xl">
                          {session.signUnits.join(" ") ||
                            "Select keys below to build a sign sequence."}
                        </p>
                        <p className="mt-3 text-xs leading-6 text-muted-foreground">
                          Manual sequences stay local and deterministic, which makes them useful for
                          demos, QA, and exact fingerspelling.
                        </p>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
              {session.mode !== "speech" && (
                <div className="flex flex-col gap-4 border-t border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={session.commit}
                      disabled={
                        session.isWorking ||
                        (session.mode === "text" && !session.textDraft.trim()) ||
                        (session.mode === "sign" && session.signUnits.length === 0)
                      }
                      size="lg"
                      className="min-w-36"
                    >
                      {session.isWorking ? "Processing..." : "Commit Message"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        session.setSignUnits([]);
                        session.setTextDraft("");
                      }}
                    >
                      Clear Draft
                    </Button>
                  </div>
                  <p className="max-w-sm text-xs leading-6 text-muted-foreground">
                    Text and manual entries stay fully local to the current translation flow.
                  </p>
                </div>
              )}
            </Card>

            <Card className="rounded-[1.75rem] border border-border/70 bg-card/95">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Active Translation</CardTitle>
                <CardDescription>
                  Review the latest committed output or the in-progress manual preview.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <PipelineView envelope={session.previewEnvelope} />
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border border-border/70 bg-card/95">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Every committed turn stays visible with history controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ConversationThread entries={deferredEntries} />
              </CardContent>
            </Card>
          </div>

          <aside className="flex min-w-0 flex-col gap-8">
            <Card className="rounded-[1.75rem] border border-border/70 bg-card/95">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Vision Tracker</CardTitle>
                <CardDescription>Live hand-tracking and correction flows.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <CameraPanel
                  camera={camera}
                  commitCameraSentence={commitCameraSentence}
                  isWorking={session.isWorking}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border border-border/70 bg-card/95">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Lexicon Keys</CardTitle>
                <CardDescription>Compose exact sequences manually.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <SignKeyboard
                  appendSignUnit={(unit) => {
                    session.setMode("sign");
                    session.setSignUnits((current) => [...current, unit]);
                  }}
                  setSignUnits={session.setSignUnits}
                />
              </CardContent>
            </Card>
          </aside>
        </section>

        {session.error && (
          <Alert variant="destructive" className="rounded-[1.5rem]">
            <AlertTitle>Pipeline Error</AlertTitle>
            <AlertDescription>{session.error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
