import { useState, useEffect, useCallback, useRef } from "react";
import type { TranslationEnvelope, SttModel, SensaToken } from "@sensa/engine/types";
import {
  createSensa,
  type SensaRuntime,
  SensaDirector,
  type CaptureStatus,
} from "@sensa/communication";

export type ComposerMode = "speech" | "text" | "sign";

/**
 * useCommunicationSession consolidates the logical flow of the dashboard.
 * It manages the runtime lifecycle, composition state, and translation sessions.
 */
export function useCommunicationSession(onCommit: (env: TranslationEnvelope) => void) {
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const [runtime, setRuntime] = useState<SensaRuntime | null>(null);
  const [mode, setMode] = useState<ComposerMode>("text");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEnvelope, setActiveEnvelope] = useState<TranslationEnvelope | null>(null);

  // Composition state from runtime
  const [compositionTokens, setCompositionTokens] = useState<SensaToken[]>([]);
  const [compositionText, setCompositionText] = useState("");

  // Draft states
  const [textDraft, setTextDraft] = useState("");
  const [signUnits, setSignUnits] = useState<string[]>([]);
  const [sttModel, setSttModel] = useState<SttModel>("whisper-large-v3");
  const [speechPrompt, setSpeechPrompt] = useState("");

  // Speech state from runtime
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("idle");
  const [captureLevel, setCaptureLevel] = useState(0);

  // Playback Director
  const [director] = useState(() => new SensaDirector());

  useEffect(() => {
    let active = true;
    let rInstance: SensaRuntime | null = null;

    const init = async () => {
      try {
        const r = await createSensa({
          sdk: {
            groqApiKey: import.meta.env.VITE_GROQ_API_KEY || "YOUR_GROQ_API_KEY",
          },
        });
        if (!active) {
          r.stop();
          return;
        }
        rInstance = r;
        setRuntime(r);

        // Listen for composition updates
        r.subscribe("composition:update", () => {
          setCompositionTokens(r.getState().plugins.composition?.tokens || []);
          setCompositionText(r.getState().plugins.composition?.text || "");
        });

        // Listen for speech updates
        r.subscribe("speech:status-change", (event) => {
          setCaptureStatus(event.payload);
        });

        r.subscribe("speech:level-update", (event) => {
          setCaptureLevel(event.payload);
        });

        // Listen for translation results
        r.subscribe("translation:finished", (event) => {
          const envelope = event.payload;
          setActiveEnvelope(envelope);
          onCommitRef.current(envelope);
          setIsWorking(false);
        });

        r.subscribe("translation:started", () => setIsWorking(true));
        r.subscribe("translation:error", (event) => {
          setError(event.payload);
          setIsWorking(false);
        });
      } catch {
        if (!active) return;
        setError("Failed to initialize communication runtime.");
      }
    };

    init();
    return () => {
      active = false;
      rInstance?.stop();
    };
  }, []);

  const commit = useCallback(async () => {
    if (!runtime) return;
    setError(null);

    try {
      if (mode === "text") {
        runtime.dispatch({
          type: "translation:cmd:request",
          payload: { mode: "text", text: textDraft },
          timestamp: Date.now(),
          source: "ui",
        });
        setTextDraft("");
      } else if (mode === "sign") {
        runtime.dispatch({
          type: "translation:cmd:request",
          payload: { mode: "sign-keys", units: signUnits },
          timestamp: Date.now(),
          source: "ui",
        });
        setSignUnits([]);
      } else if (mode === "speech") {
        runtime.dispatch({
          type: "speech:cmd:stop",
          payload: { sttModel, context: { locale: "en-US", previousTurns: [] } },
          timestamp: Date.now(),
          source: "ui",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    }
  }, [runtime, mode, textDraft, signUnits, sttModel]);

  return {
    mode,
    setMode,
    previewEnvelope: activeEnvelope,
    isWorking,
    error,
    textDraft,
    setTextDraft,
    signUnits,
    setSignUnits,
    sttModel,
    setSttModel,
    speechPrompt,
    setSpeechPrompt,
    commit,
    startSpeechCapture: () => {
      runtime?.dispatch({
        type: "speech:cmd:start",
        payload: undefined,
        timestamp: Date.now(),
        source: "ui",
      });
    },
    cancelSpeechCapture: () => {
      runtime?.dispatch({
        type: "speech:cmd:cancel",
        payload: undefined,
        timestamp: Date.now(),
        source: "ui",
      });
    },
    captureStatus,
    captureLevel,
    compositionTokens,
    compositionText,
    runtime,
    director,
  };
}
