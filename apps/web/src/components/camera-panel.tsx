import { useEffect, useRef } from "react";
import type { CameraTrackingState } from "@ikiraro/engine/vision";
import { HandOverlay, WebSpeechProvider, Button, Badge } from "@ikiraro/components";

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

export function CameraPanel({
  camera,
  commitCameraSentence,
  isWorking = false,
}: {
  camera: CameraController;
  commitCameraSentence: () => void;
  isWorking?: boolean;
}) {
  const prevCommittedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const token = camera.tracking.committedToken;
    if (!token) return;
    const text =
      token.type === "fingerspell"
        ? token.text
        : token.type === "lexeme"
          ? token.lexemeId
          : token.type === "number"
            ? token.value
            : token.type === "pointing"
              ? token.target
              : null;
    if (text && text !== prevCommittedTokenRef.current) {
      prevCommittedTokenRef.current = text;
      WebSpeechProvider.getInstance()
        .speak(text)
        .catch(() => {});
    }
  }, [camera.tracking.committedToken]);

  const committedSentence = camera.tracking.sentenceText || camera.tracking.currentWord;
  const currentLetter = camera.tracking.classification?.sign ?? null;
  const confidence = camera.tracking.classification?.confidence ?? 0;
  const currentWord = camera.tracking.currentWord;
  const sentence = camera.tracking.sentence;

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => void camera.start()}
          disabled={camera.isActive || !camera.isReady}
          className="bg-ink text-on-dark border-ink rounded-[2px] h-auto px-3.5 py-2 text-[12px]"
        >
          {camera.isReady ? "Start Camera" : "Booting…"}
        </Button>
        <Button
          onClick={camera.stop}
          disabled={!camera.isActive}
          variant="outline"
          className="border-rule text-ink rounded-[2px] h-auto bg-transparent px-3.5 py-2 text-[12px]"
        >
          Stop
        </Button>
        <Button
          onClick={camera.clear}
          disabled={isWorking}
          variant="ghost"
          className="text-steel h-auto px-3 py-2 text-[12px] hover:bg-transparent hover:text-ink"
        >
          Reset
        </Button>

        <div className="font-mono text-stone ml-auto flex items-center gap-2 text-[11px]">
          {camera.error ? (
            <span className="text-primary font-medium">Error</span>
          ) : camera.isReady ? (
            <>
              <Badge
                variant="outline"
                className="bg-paper-soft text-primary border-rule-soft rounded-[2px] h-auto px-2 py-0.5 font-medium"
              >
                {camera.delegate ?? "Ready"}
              </Badge>
              <span>{camera.fps} fps</span>
            </>
          ) : (
            <span>Loading worker…</span>
          )}
        </div>
      </div>

      {/* Video feed */}
      <div className="bg-paper-soft border-rule-soft relative aspect-video overflow-hidden rounded-[3px] border">
        <video
          ref={camera.videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
        />

        <HandOverlay tracking={camera.tracking} />

        {/* Current-letter badge */}
        {camera.isActive && (
          <div className="absolute right-3 top-3 flex flex-col items-center gap-1.5">
            <div
              className={`flex size-10 items-center justify-center text-[18px] font-semibold transition-all rounded-[2px] ${
                currentLetter
                  ? "bg-paper/95 text-ink border-rule shadow-[0_2px_8px_rgba(24,22,18,.12)] border"
                  : "bg-paper/15 text-transparent border-transparent border"
              }`}
            >
              {currentLetter ?? ""}
            </div>
            {currentLetter && (
              <span className="text-on-dark font-mono text-[10px] font-medium [text-shadow:0_1px_3px_rgba(0,0,0,.4)]">
                {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
        )}

        {!camera.isReady && !camera.error && (
          <div className="bg-paper/85 border-rule-soft text-steel font-mono absolute inset-x-0 bottom-0 px-4 py-3 text-[11px] backdrop-blur-sm border-t">
            Booting engine…
          </div>
        )}

        {camera.error && (
          <div className="bg-paper/95 text-primary font-mono absolute inset-0 flex items-center justify-center px-6 text-center text-[12px] backdrop-blur-md">
            {camera.error}
          </div>
        )}
      </div>

      {/* Buffer display */}
      <div className="flex flex-col gap-4 pt-1">
        <div>
          <p className="font-mono text-stone mb-1.5 text-[10px] tracking-[0.3px]">Spelling Now</p>
          <div className="text-primary font-mono min-h-6 text-[14px] font-medium">
            {currentWord || (camera.isActive ? "Waiting…" : "—")}
          </div>
        </div>

        <div>
          <p className="font-mono text-stone mb-1.5 text-[10px] tracking-[0.3px]">History</p>
          <div className="text-slate-text min-h-6 text-[14px]">{sentence.join(" ") || "—"}</div>
        </div>
      </div>

      {/* Disambiguation */}
      {camera.tracking.classification &&
        camera.tracking.classification.confidence < 0.6 &&
        camera.tracking.classification.candidates.length > 1 && (
          <div className="border-rule-soft pt-4 border-t">
            <p className="font-mono text-stone mb-3 text-[10px] tracking-[0.3px]">Corrections</p>
            <div className="flex flex-wrap gap-1.5">
              {camera.tracking.classification.candidates.map((candidate: CameraCandidate) => (
                <Button
                  key={candidate.name}
                  onClick={() => camera.manualCorrect(candidate.name)}
                  variant="outline"
                  className="border-rule text-ink font-mono hover:bg-paper-soft rounded-[2px] h-auto px-3 py-1.5 text-[12px]"
                >
                  {candidate.name}
                </Button>
              ))}
            </div>
          </div>
        )}

      <Button
        onClick={commitCameraSentence}
        disabled={!committedSentence || isWorking}
        className="bg-paper-soft text-ink border-rule hover:border-ink rounded-[3px] w-full py-3 text-[13px] font-medium transition-all"
      >
        Commit fingerspelled message
      </Button>
    </div>
  );
}
