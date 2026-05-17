import { useState, useMemo, useEffect, useCallback } from "react";
import type { TranslationEnvelope, SttModel } from "@sensa/engine/types";
import {
  CommunicationBridge,
  SpeechCaptureAdapter,
  type CaptureSession,
  type CaptureStatus,
} from "@sensa/communication";
import { env } from "@sensa/env/web";

export type ComposerMode = "speech" | "text" | "sign";

/**
 * useCommunicationSession consolidates the logical flow of the dashboard.
 * It manages the draft state, translation sessions, and history context.
 * This keeps the Dashboard UI distilled and focused on layout.
 */
export function useCommunicationSession(
  initialEntries: any[],
  onCommit: (env: TranslationEnvelope) => void,
) {
  const bridge = useMemo(() => new CommunicationBridge(env.VITE_SERVER_URL), []);

  const [mode, setMode] = useState<ComposerMode>("text");
  const [activeEnvelope, setActiveEnvelope] = useState<TranslationEnvelope | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draft states
  const [textDraft, setTextDraft] = useState("");
  const [signUnits, setSignUnits] = useState<string[]>([]);
  const [sttModel, setSttModel] = useState<SttModel>("whisper-large-v3");
  const [speechPrompt, setSpeechPrompt] = useState("");

  // Capture session state
  const [captureSession, setCaptureSession] = useState<CaptureSession | null>(null);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("idle");
  const [captureLevel, setCaptureLevel] = useState(0);

  const context = useMemo(() => bridge.buildContext(initialEntries), [bridge, initialEntries]);

  const previewEnvelope = useMemo(() => {
    if (mode === "sign" && signUnits.length > 0) {
      return bridge.previewSignPlan(signUnits);
    }
    return activeEnvelope;
  }, [bridge, mode, signUnits, activeEnvelope]);

  useEffect(() => {
    if (!captureSession) return;
    return captureSession.subscribe((state) => {
      setCaptureStatus(state.status);
      setCaptureLevel(state.level);
    });
  }, [captureSession]);

  const commit = useCallback(async () => {
    setIsWorking(true);
    setError(null);

    try {
      let envelope: TranslationEnvelope;

      if (mode === "text") {
        envelope = await bridge.translate({ mode: "text", text: textDraft, context });
        setTextDraft("");
      } else if (mode === "sign") {
        envelope = await bridge.translate({ mode: "sign-keys", units: signUnits, context });
        setSignUnits([]);
      } else if (mode === "speech") {
        if (!captureSession) throw new Error("No active speech session.");
        envelope = await captureSession.stop();
        setCaptureSession(null);
      } else {
        throw new Error("Unsupported mode.");
      }

      setActiveEnvelope(envelope);
      onCommit(envelope);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed.");
    } finally {
      setIsWorking(false);
    }
  }, [bridge, mode, textDraft, signUnits, captureSession, context, onCommit]);

  const startSpeechCapture = useCallback(async () => {
    setError(null);
    const adapter = new SpeechCaptureAdapter();
    try {
      const session = await bridge.startCapture(adapter, context);
      setCaptureSession(session);
    } catch {
      setError("Failed to start speech capture.");
    }
  }, [bridge, context]);

  const cancelSpeechCapture = useCallback(() => {
    captureSession?.cancel();
    setCaptureSession(null);
  }, [captureSession]);

  return {
    mode,
    setMode,
    previewEnvelope,
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
    startSpeechCapture,
    cancelSpeechCapture,
    captureStatus,
    captureLevel,
    bridge,
  };
}
