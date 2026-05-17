import { useEffect, useRef } from "react";
import type { CameraTrackingState } from "@sensa/engine/vision";
import { WebSpeechProvider } from "@sensa/communication";
import { Button, HandOverlay } from "@sensa/components";

type CameraCandidate = NonNullable<CameraTrackingState["classification"]>["candidates"][number];

type CameraController = {
  videoRef: (el: HTMLVideoElement | null) => void;
  tracking: CameraTrackingState;
  isReady: boolean;
  delegate: "GPU" | "CPU" | null;
  fps: number;
  isActive: boolean;
  error: string | null;
  clear: () => void;
  manualCorrect: (sign: string) => void;
  start: () => Promise<void>;
  stop: () => void;
};

/**
 * CameraPanel manages the visual feedback and controls for the vision track.
 */
export function CameraPanel({
  camera,
  commitCameraSentence,
  isWorking = false,
}: {
  camera: CameraController;
  commitCameraSentence: () => void;
  isWorking?: boolean;
}) {
  const prevCommittedWordRef = useRef<string | null>(null);

  useEffect(() => {
    const word = camera.tracking.committedWord;
    if (word && word !== prevCommittedWordRef.current) {
      prevCommittedWordRef.current = word;
      WebSpeechProvider.getInstance()
        .speak(word)
        .catch(() => {});
    }
  }, [camera.tracking.committedWord]);

  const committedSentence = camera.tracking.sentenceText || camera.tracking.currentWord;
  const currentLetter = camera.tracking.classification?.sign ?? null;
  const confidence = camera.tracking.classification?.confidence ?? 0;
  const currentWord = camera.tracking.currentWord;
  const sentence = camera.tracking.sentence;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => void camera.start()}
          disabled={camera.isActive || !camera.isReady}
          size="sm"
        >
          {camera.isReady ? "Start Camera" : "Booting…"}
        </Button>
        <Button variant="outline" onClick={camera.stop} disabled={!camera.isActive} size="sm">
          Stop
        </Button>
        <Button variant="ghost" onClick={camera.clear} disabled={isWorking} size="sm">
          Reset
        </Button>

        <div className="ml-auto flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
          {camera.error ? (
            <span className="text-destructive">Vision unavailable</span>
          ) : camera.isReady ? (
            <>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                {camera.delegate ?? "Ready"}
              </span>
              <span>{camera.fps} FPS</span>
            </>
          ) : (
            <span>Loading worker…</span>
          )}
        </div>
      </div>

      {/* Video feed */}
      <div className="relative aspect-video overflow-hidden rounded-[1.6rem] border border-border/70 bg-black">
        {/* Source video */}
        <video
          ref={camera.videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
        />

        {/* Landmark Overlay */}
        <HandOverlay tracking={camera.tracking} />

        {/* Current-letter badge */}
        {camera.isActive && (
          <div className="absolute right-3 top-3 flex flex-col items-center gap-1">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-4xl font-bold transition-colors duration-150 ${
                currentLetter
                  ? "border-primary/60 bg-background/95 text-foreground shadow-xl"
                  : "border-border/40 bg-background/50 text-muted-foreground/30"
              }`}
            >
              {currentLetter ?? "–"}
            </div>
            {currentLetter && (
              <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
        )}

        {/* Error/Notice overlays */}
        {!camera.isReady && !camera.error && (
          <div className="absolute inset-x-0 bottom-0 border-t border-border/60 bg-background/85 px-4 py-3 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
            Initializing hand-tracking worker...
          </div>
        )}

        {camera.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 px-6 text-center text-sm font-medium text-destructive">
            {camera.error}
          </div>
        )}
      </div>

      {/* Input Buffers */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.4rem] border border-border/70 bg-muted/35 p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Spelling Now
          </p>
          <div className="mt-2.5 flex min-h-10 flex-wrap items-center gap-1.5 text-sm font-mono font-semibold text-primary">
            {currentWord || (camera.isActive ? "Waiting..." : "—")}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-border/70 bg-muted/35 p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            History
          </p>
          <div className="mt-2.5 flex min-h-10 flex-wrap items-center gap-1.5 text-sm font-medium">
            {sentence.join(" ") || "—"}
          </div>
        </div>
      </div>

      {/* Disambiguation */}
      {camera.tracking.classification &&
        camera.tracking.classification.confidence < 0.6 &&
        camera.tracking.classification.candidates.length > 1 && (
          <div className="rounded-[1.4rem] border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-amber-600">
              Low Confidence Correction
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {camera.tracking.classification.candidates.map((candidate: CameraCandidate) => (
                <Button
                  key={candidate.name}
                  variant="secondary"
                  size="sm"
                  onClick={() => camera.manualCorrect(candidate.name)}
                  className="h-7 rounded-full text-[10px]"
                >
                  {candidate.name} ({Math.round(candidate.score * 100)}%)
                </Button>
              ))}
            </div>
          </div>
        )}

      <Button
        onClick={commitCameraSentence}
        disabled={!committedSentence || isWorking}
        className="w-full"
        size="lg"
      >
        Commit Fingerspelled Message
      </Button>
    </div>
  );
}
