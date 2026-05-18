import { useState, useEffect, useCallback, useRef } from "react";
import type { TranslationEnvelope, SttModel, SensaToken } from "@sensa/engine/types";
import { createSensa, type SensaRuntime, type CaptureStatus } from "@sensa/communication";

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

  // Sync state from runtime plugins
  const [sessionStatus, setSessionStatus] = useState<string>("idle");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [activeEnvelope, setActiveEnvelope] = useState<TranslationEnvelope | null>(null);
  const [compositionTokens, setCompositionTokens] = useState<SensaToken[]>([]);
  const [compositionText, setCompositionText] = useState("");
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("idle");
  const [captureLevel, setCaptureLevel] = useState(0);

  // Draft states
  const [textDraft, setTextDraft] = useState("");
  const [signUnits, setSignUnits] = useState<string[]>([]);
  const [sttModel, setSttModel] = useState<SttModel>("whisper-large-v3");
  const [speechPrompt, setSpeechPrompt] = useState("");

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

        // Unified subscription for all state updates
        const updateSync = () => {
          const state = r.getState().plugins;
          setSessionStatus(state.session?.status || "idle");
          setSessionError(state.session?.error || null);
          setActiveEnvelope(state.session?.lastEnvelope || null);
          setCompositionTokens(state.composition?.tokens || []);
          setCompositionText(state.composition?.text || "");
          setCaptureStatus(state.speech?.status || "idle");
        };

        r.subscribeAll(() => {
          updateSync();
        });

        r.subscribe("speech:level-update", (event) => {
          setCaptureLevel(event.payload);
        });

        r.subscribe("translation:finished", (event) => {
          onCommitRef.current(event.payload);
        });
      } catch {
        if (!active) return;
        setSessionError("Failed to initialize communication runtime.");
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

    if (mode === "text") {
      runtime.dispatch({
        type: "session:cmd:start",
        payload: { mode: "text", text: textDraft },
        timestamp: Date.now(),
        source: "ui",
      });
      setTextDraft("");
    } else if (mode === "sign") {
      runtime.dispatch({
        type: "session:cmd:start",
        payload: { mode: "sign-keys", units: signUnits },
        timestamp: Date.now(),
        source: "ui",
      });
      setSignUnits([]);
    } else if (mode === "speech") {
      runtime.dispatch({
        type: "session:cmd:stop",
        payload: undefined,
        timestamp: Date.now(),
        source: "ui",
      });
    }
  }, [runtime, mode, textDraft, signUnits]);

  return {
    mode,
    setMode,
    previewEnvelope: activeEnvelope,
    isWorking: sessionStatus === "translating" || sessionStatus === "recording",
    error: sessionError,
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
        type: "session:cmd:start",
        payload: { mode: "speech", sttModel },
        timestamp: Date.now(),
        source: "ui",
      });
    },
    cancelSpeechCapture: () => {
      runtime?.dispatch({
        type: "session:cmd:cancel",
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
  };
}
