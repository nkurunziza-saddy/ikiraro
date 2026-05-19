import { useEffect, useRef } from "react";
import type { CameraTrackingState } from "@ikiraro/engine/vision";
import { HandOverlay, WebSpeechProvider } from "@ikiraro/components";

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
        <button
          onClick={() => void camera.start()}
          disabled={camera.isActive || !camera.isReady}
          className="px-3.5 py-2 text-[12px] font-medium transition-all disabled:opacity-40"
          style={{
            background: "var(--ink)",
            color: "var(--on-dark)",
            borderRadius: "2px",
            border: "1px solid var(--ink)",
          }}
        >
          {camera.isReady ? "Start Camera" : "Booting…"}
        </button>
        <button
          onClick={camera.stop}
          disabled={!camera.isActive}
          className="px-3.5 py-2 text-[12px] transition-all disabled:opacity-40"
          style={{
            background: "transparent",
            color: "var(--ink)",
            borderRadius: "2px",
            border: "1px solid var(--rule)",
          }}
        >
          Stop
        </button>
        <button
          onClick={camera.clear}
          disabled={isWorking}
          className="px-3 py-2 text-[12px] transition-colors disabled:opacity-40"
          style={{ color: "var(--steel)" }}
        >
          Reset
        </button>

        <div
          className="ml-auto flex items-center gap-2 text-[11px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--stone)" }}
        >
          {camera.error ? (
            <span style={{ color: "var(--primary)", fontWeight: 500 }}>Error</span>
          ) : camera.isReady ? (
            <>
              <span
                className="px-2 py-0.5"
                style={{
                  background: "var(--paper-soft)",
                  color: "var(--primary)",
                  borderRadius: "2px",
                  border: "1px solid var(--rule-soft)",
                  fontWeight: 500,
                }}
              >
                {camera.delegate ?? "Ready"}
              </span>
              <span>{camera.fps} fps</span>
            </>
          ) : (
            <span>Loading worker…</span>
          )}
        </div>
      </div>

      {/* Video feed */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "16/9",
          borderRadius: "3px",
          border: "1px solid var(--rule-soft)",
          background: "var(--paper-soft)",
        }}
      >
        <video
          ref={camera.videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
        />

        <HandOverlay tracking={camera.tracking} />

        {/* Current-letter badge */}
        {camera.isActive && (
          <div className="absolute right-3 top-3 flex flex-col items-center gap-1.5">
            <div
              className="flex h-10 w-10 items-center justify-center text-[18px] font-semibold transition-all"
              style={{
                borderRadius: "2px",
                background: currentLetter ? "rgba(252,252,248,0.95)" : "rgba(252,252,248,0.15)",
                color: currentLetter ? "var(--ink)" : "transparent",
                border: `1px solid ${currentLetter ? "var(--rule)" : "transparent"}`,
                boxShadow: currentLetter ? "0 2px 8px rgba(24,22,18,.12)" : "none",
              }}
            >
              {currentLetter ?? ""}
            </div>
            {currentLetter && (
              <span
                className="text-[10px] font-medium"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--on-dark)",
                  textShadow: "0 1px 3px rgba(0,0,0,.4)",
                }}
              >
                {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
        )}

        {!camera.isReady && !camera.error && (
          <div
            className="absolute inset-x-0 bottom-0 px-4 py-3 text-[11px] backdrop-blur-sm"
            style={{
              background: "rgba(252,252,248,.85)",
              color: "var(--steel)",
              borderTop: "1px solid var(--rule-soft)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Booting engine…
          </div>
        )}

        {camera.error && (
          <div
            className="absolute inset-0 flex items-center justify-center text-center px-6 text-[12px] backdrop-blur-md"
            style={{
              background: "rgba(252,252,248,.95)",
              color: "var(--primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {camera.error}
          </div>
        )}
      </div>

      {/* Buffer display */}
      <div className="flex flex-col gap-4 pt-1">
        <div>
          <p
            className="text-[10px] mb-1.5"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--stone)",
              letterSpacing: "0.3px",
            }}
          >
            Spelling Now
          </p>
          <div
            className="min-h-6 text-[14px] font-medium"
            style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}
          >
            {currentWord || (camera.isActive ? "Waiting…" : "—")}
          </div>
        </div>

        <div>
          <p
            className="text-[10px] mb-1.5"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--stone)",
              letterSpacing: "0.3px",
            }}
          >
            History
          </p>
          <div className="min-h-6 text-[14px]" style={{ color: "var(--slate-text)" }}>
            {sentence.join(" ") || "—"}
          </div>
        </div>
      </div>

      {/* Disambiguation */}
      {camera.tracking.classification &&
        camera.tracking.classification.confidence < 0.6 &&
        camera.tracking.classification.candidates.length > 1 && (
          <div className="pt-4" style={{ borderTop: "1px solid var(--rule-soft)" }}>
            <p
              className="text-[10px] mb-3"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--stone)",
                letterSpacing: "0.3px",
              }}
            >
              Corrections
            </p>
            <div className="flex flex-wrap gap-1.5">
              {camera.tracking.classification.candidates.map((candidate: CameraCandidate) => (
                <button
                  key={candidate.name}
                  onClick={() => camera.manualCorrect(candidate.name)}
                  className="px-3 py-1.5 text-[12px] transition-colors"
                  style={{
                    borderRadius: "2px",
                    border: "1px solid var(--rule)",
                    color: "var(--ink)",
                    fontFamily: "var(--font-mono)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--paper-soft)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {candidate.name}
                </button>
              ))}
            </div>
          </div>
        )}

      <button
        onClick={commitCameraSentence}
        disabled={!committedSentence || isWorking}
        className="w-full py-3 text-[13px] font-medium transition-all disabled:opacity-40"
        style={{
          background: "var(--paper-soft)",
          color: "var(--ink)",
          borderRadius: "3px",
          border: "1px solid var(--rule)",
        }}
        onMouseEnter={(e) => {
          if (!(!committedSentence || isWorking))
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ink)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--rule)";
        }}
      >
        Commit fingerspelled message
      </button>
    </div>
  );
}
