import { useEffect, useRef } from "react";
import type { CameraTrackingState } from "@ikiraro/engine/vision";
import { Button, HandOverlay, WebSpeechProvider } from "@ikiraro/components";

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
            <span className="text-destructive font-bold uppercase tracking-widest">
              Vision Error
            </span>
          ) : camera.isReady ? (
            <>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold uppercase tracking-widest text-primary">
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
      <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted/5 shadow-sm">
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
          <div className="absolute right-4 top-4 flex flex-col items-center gap-2">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg border text-2xl font-bold transition-all duration-200 ${
                currentLetter
                  ? "bg-background/95 text-foreground shadow-sm"
                  : "bg-background/20 text-muted-foreground/10 border-transparent"
              }`}
            >
              {currentLetter ?? ""}
            </div>
            {currentLetter && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
        )}

        {/* Error/Notice overlays */}
        {!camera.isReady && !camera.error && (
          <div className="absolute inset-x-0 bottom-0 border-t bg-background/80 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 backdrop-blur-sm">
            Booting Engine
          </div>
        )}

        {camera.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 px-6 text-center text-[10px] font-bold uppercase tracking-widest text-destructive backdrop-blur-md">
            {camera.error}
          </div>
        )}
      </div>

      {/* Input Buffers */}
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex flex-col gap-1 px-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Spelling Now
          </p>
          <div className="flex min-h-6 items-center text-sm font-mono font-bold tracking-tight text-primary/80">
            {currentWord || (camera.isActive ? "Waiting..." : "—")}
          </div>
        </div>

        <div className="flex flex-col gap-1 px-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Fingerspelling History
          </p>
          <div className="flex min-h-6 items-center text-sm font-semibold tracking-tight text-foreground/80">
            {sentence.join(" ") || "—"}
          </div>
        </div>
      </div>

      {/* Disambiguation */}
      {camera.tracking.classification &&
        camera.tracking.classification.confidence < 0.6 &&
        camera.tracking.classification.candidates.length > 1 && (
          <div className="pt-4 border-t border-border/30">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3">
              Corrections
            </p>
            <div className="flex flex-wrap gap-2">
              {camera.tracking.classification.candidates.map((candidate: CameraCandidate) => (
                <button
                  key={candidate.name}
                  onClick={() => camera.manualCorrect(candidate.name)}
                  className="h-7 rounded px-3 text-[10px] font-bold uppercase tracking-widest border border-border/60 hover:bg-muted transition-colors"
                >
                  {candidate.name}
                </button>
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
