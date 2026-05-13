import {
  FIXED_PHRASE_LIBRARY,
  SIGN_LEXICON,
  buildDeterministicPlanFromUnits,
  buildPhraseUnits,
  buildSttPrompt,
  createTranslationEnvelope,
  describePlan,
  getEvaluationReadinessSummary,
  type PlannerModel,
  type SttModel,
  type TranslationContext,
  type TranslationDomain,
  type TranslationEnvelope,
} from "@sensa/communication";
import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { PipelineView } from "@/components/pipeline-view";
import HandOverlay from "@/components/hand-overlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupportedAudioRecordingMimeType } from "@/lib/audio";
import { translateSpeechRequest, translateTextRequest } from "@/lib/communication-client";
import { useHandTracking } from "@/lib/use-hand-tracking";
import { authClient } from "@/lib/auth-client";

type ComposerMode = "speech" | "text" | "sign";

type ConversationEntry = {
  id: string;
  createdAt: string;
  mode: TranslationEnvelope["mode"];
  track: TranslationEnvelope["plan"]["track"];
  raw: string;
  normalized: string;
  signPlan: string[];
  rendererQueue: string[];
  note: string;
  intakeModel: string | null;
  wordCount: number | null;
};

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
    hint: "Record audio, run Groq STT with word timing, then let the structured planner normalize meaning.",
  },
  text: {
    label: "Text Intake",
    eyebrow: "Semantic Track",
    hint: "Type naturally, keep context, and produce a strict sign plan instead of gloss improvisation.",
  },
  sign: {
    label: "Manual Sign Keys",
    eyebrow: "Deterministic Track",
    hint: "Use lexemes, fingerspelling, and fixed phrases without waiting on the semantic stack.",
  },
};

const QUICK_LEXEMES = [
  "HELLO",
  "HELP",
  "PLEASE",
  "THANK_YOU",
  "WATER",
  "MEDICINE",
  "WHERE",
  "BATHROOM",
  "INTERPRETER",
  "YES",
  "NO",
] as const;

const LETTER_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PLANNER_OPTIONS: PlannerModel[] = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];
const STT_OPTIONS: SttModel[] = ["whisper-large-v3", "whisper-large-v3-turbo"];
const DOMAIN_OPTIONS: TranslationDomain[] = ["general", "support", "healthcare", "education"];
const EVALUATION_SUMMARY = getEvaluationReadinessSummary();
const MIN_SPEECH_RECORDING_MS = 250;
const MIN_SPEECH_AUDIO_BYTES = 512;

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUnits(units: string[]): string {
  return units.join(" ");
}

function formatDurationLabel(durationMs: number | null): string {
  if (!durationMs || durationMs <= 0) {
    return "0.0s";
  }

  const seconds = durationMs / 1000;
  return seconds >= 10 ? `${seconds.toFixed(0)}s` : `${seconds.toFixed(1)}s`;
}

function formatBytesLabel(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    const kilobytes = bytes / 1024;
    return `${kilobytes >= 100 ? kilobytes.toFixed(0) : kilobytes.toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
    spellingHints: ["Sensa", "ASL", "Kigali", "bathroom", "interpreter", "amoxicillin"],
    previousTurns: entries.slice(-4).map((entry) => ({
      role: entry.track === "semantic-translation" ? "hearing" : "signer",
      text: entry.normalized,
    })),
  };
}

function RouteComponent() {
  const { data: session } = authClient.useSession();
  const camera = useHandTracking();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const pendingRecordingStopRef = useRef<{
    resolve: (audio: Blob | null) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const [mode, setMode] = useState<ComposerMode>("text");
  const [plannerModel, setPlannerModel] = useState<PlannerModel>("openai/gpt-oss-20b");
  const [sttModel, setSttModel] = useState<SttModel>("whisper-large-v3");
  const [domain, setDomain] = useState<TranslationDomain>("healthcare");
  const [textDraft, setTextDraft] = useState("");
  const [speechPrompt, setSpeechPrompt] = useState(
    buildSttPrompt(["amoxicillin", "interpreter", "bathroom"]),
  );
  const [speechAudio, setSpeechAudio] = useState<Blob | null>(null);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [speechRecordingMs, setSpeechRecordingMs] = useState<number | null>(null);
  const [speechAudioUrl, setSpeechAudioUrl] = useState<string | null>(null);
  const [signUnits, setSignUnits] = useState<string[]>([]);
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [activeEnvelope, setActiveEnvelope] = useState<TranslationEnvelope | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredEntries = useDeferredValue(entries);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      camera.stop();
    };
  }, []);

  useEffect(() => {
    if (!speechAudio) {
      setSpeechAudioUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(speechAudio);
    setSpeechAudioUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [speechAudio]);

  useEffect(() => {
    if (mode !== "sign") {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setSignUnits((current) => current.slice(0, -1));
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        setSignUnits((current) => [...current, "/"]);
        return;
      }

      if (/^[a-z]$/i.test(event.key)) {
        event.preventDefault();
        setSignUnits((current) => [...current, event.key.toUpperCase()]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode]);

  const operatorName = session?.user.name?.split(" ")[0] ?? "Operator";
  const currentContext = useMemo(
    () => buildConversationContext(entries, domain),
    [domain, entries],
  );
  const signPreviewEnvelope = useMemo(() => {
    const plan = buildDeterministicPlanFromUnits(signUnits, currentContext, "sign-keys");
    return createTranslationEnvelope("sign-keys", formatUnits(signUnits), plan);
  }, [currentContext, signUnits]);

  const speechEnvelope = activeEnvelope?.mode === "speech" ? activeEnvelope : null;
  const pipelineEnvelope =
    mode === "sign" ? signPreviewEnvelope : activeEnvelope?.mode === mode ? activeEnvelope : null;
  const visibleSpeechTranscript = speechEnvelope?.rawInput || speechTranscript;
  const rawInput =
    mode === "speech"
      ? visibleSpeechTranscript
      : mode === "text"
        ? textDraft
        : formatUnits(signUnits);

  function stopAudioStream() {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  }

  function settlePendingRecording(audio: Blob | null, error?: Error) {
    const pending = pendingRecordingStopRef.current;
    pendingRecordingStopRef.current = null;

    if (!pending) {
      return;
    }

    if (error) {
      pending.reject(error);
      return;
    }

    pending.resolve(audio);
  }

  async function stopRecording(): Promise<Blob | null> {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return speechAudio;
    }

    return await new Promise<Blob | null>((resolve, reject) => {
      pendingRecordingStopRef.current = { resolve, reject };

      try {
        recorder.requestData();
      } catch {
        // Some MediaRecorder implementations throw here; stop still finalizes the blob.
      }

      recorder.stop();
    });
  }

  async function startRecording() {
    if (isRecording) {
      try {
        await stopRecording();
      } catch {
        // The UI already receives the recorder error state.
      }
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not expose microphone capture.");
      }

      if (typeof MediaRecorder === "undefined") {
        throw new Error("This browser does not support in-browser audio recording.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const mimeType = getSupportedAudioRecordingMimeType();

      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const elapsedMs =
          recordingStartedAtRef.current === null
            ? null
            : Math.max(0, Math.round(performance.now() - recordingStartedAtRef.current));
        const recordedMimeType =
          recorder.mimeType || mimeType || audioChunksRef.current[0]?.type || "audio/webm";
        const nextAudio = new Blob(audioChunksRef.current, {
          type: recordedMimeType,
        });
        const isUsableAudio =
          nextAudio.size >= MIN_SPEECH_AUDIO_BYTES &&
          (elapsedMs === null || elapsedMs >= MIN_SPEECH_RECORDING_MS);

        mediaRecorderRef.current = null;
        recordingStartedAtRef.current = null;
        setSpeechRecordingMs(elapsedMs);
        setIsRecording(false);
        stopAudioStream();

        if (!isUsableAudio) {
          setSpeechAudio(null);
          const nextError =
            nextAudio.size < MIN_SPEECH_AUDIO_BYTES
              ? new Error("No usable audio was captured. Record again and speak clearly.")
              : new Error("The recording was too short. Hold for a moment longer before stopping.");
          setError(nextError.message);
          settlePendingRecording(null, nextError);
          return;
        }

        setSpeechAudio(nextAudio);
        settlePendingRecording(nextAudio);
      };

      recorder.onerror = () => {
        const nextError = new Error("Audio capture failed before the Groq intake step.");
        setError(nextError.message);
        setIsRecording(false);
        mediaRecorderRef.current = null;
        recordingStartedAtRef.current = null;
        stopAudioStream();
        settlePendingRecording(null, nextError);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = performance.now();
      setActiveEnvelope((current) => (current?.mode === "speech" ? null : current));
      setSpeechAudio(null);
      setSpeechTranscript("");
      setSpeechRecordingMs(null);
      setError(null);
      setIsRecording(true);
    } catch (nextError) {
      stopAudioStream();
      setError(nextError instanceof Error ? nextError.message : "Unable to access the microphone.");
    }
  }

  async function clearCurrentMode() {
    setError(null);

    if (mode === "speech") {
      if (isRecording) {
        try {
          await stopRecording();
        } catch {
          // The recorder already reports the failure state to the UI.
        }
      }

      setActiveEnvelope((current) => (current?.mode === "speech" ? null : current));
      setSpeechAudio(null);
      setSpeechTranscript("");
      setSpeechRecordingMs(null);
      return;
    }

    if (mode === "sign") {
      setSignUnits([]);
      return;
    }

    setActiveEnvelope((current) => (current?.mode === "text" ? null : current));
    setTextDraft("");
  }

  function loadExample() {
    if (mode === "speech") {
      setSpeechPrompt(buildSttPrompt(["amoxicillin", "bathroom", "interpreter", "Kigali"]));
      setError(null);
      return;
    }

    if (mode === "sign") {
      setSignUnits(["WHERE", "/", "BATHROOM", "/", "HELP"]);
      return;
    }

    setTextDraft("Please help me find water and medicine.");
  }

  async function commitCurrentMode() {
    setIsWorking(true);
    setError(null);

    try {
      let envelope: TranslationEnvelope;

      if (mode === "speech") {
        const capturedAudio = isRecording ? await stopRecording() : speechAudio;
        if (!capturedAudio) {
          throw new Error("Record audio first so Groq STT can act as the intake layer.");
        }

        envelope = await translateSpeechRequest({
          audio: capturedAudio,
          sttModel,
          plannerModel,
          prompt: speechPrompt,
          domain,
          context: currentContext,
        });
        const transcript = envelope.rawInput.trim() || envelope.intake?.text?.trim() || "";
        if (!transcript) {
          throw new Error("Groq returned an empty transcript. Try recording again more clearly.");
        }

        setSpeechTranscript(transcript);
        setSpeechAudio(null);
        setSpeechRecordingMs(null);
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
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to run the communication pipeline.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  function commitCameraSentence() {
    const sentence = camera.tracking.sentenceText || camera.tracking.currentWord;
    if (!sentence) {
      setError("There is no fingerspelled sentence from the camera yet.");
      return;
    }

    const units = sentence
      .trim()
      .split(/\s+/)
      .flatMap((word) => [...word.toUpperCase().split(""), "/"])
      .slice(0, -1);

    const plan = buildDeterministicPlanFromUnits(units, currentContext, "camera-fingerspell");
    const envelope = createTranslationEnvelope("camera-fingerspell", sentence, plan);
    setActiveEnvelope(envelope);
    setEntries((current) => [...current, createEntry(envelope)]);
  }

  function appendSignUnit(unit: string) {
    setMode("sign");
    setSignUnits((current) => [...current, unit]);
  }

  return (
    <div className="min-h-full bg-black text-stone-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-stone-800 bg-stone-950 p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-amber-200/70">
                  Sensa Bridge
                </p>
                <div>
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    One operator surface, two translation tracks, and no invented sign strings.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
                    {operatorName}, the page now runs the actual split you asked for: semantic
                    translation through Groq STT plus strict planning, and deterministic fallback
                    through fingerspelling, sign keys, and fixed phrases.
                  </p>
                </div>
              </div>

              <div className="grid min-w-[17rem] gap-2">
                <StatusBadge label="STT" value={sttModel} tone="amber" />
                <StatusBadge label="Planner" value={plannerModel.split("/")[1]} tone="cyan" />
                <StatusBadge
                  label="Vision"
                  value={camera.isReady ? (camera.delegate?.toLowerCase() ?? "ready") : "booting"}
                  tone="emerald"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(
                Object.entries(MODE_SUMMARIES) as Array<
                  [ComposerMode, (typeof MODE_SUMMARIES)[ComposerMode]]
                >
              ).map(([value, summary]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                    mode === value
                      ? "border-white bg-stone-900"
                      : "border-stone-800 bg-stone-950 hover:border-stone-700 hover:bg-stone-900"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">
                    {summary.eyebrow}
                  </p>
                  <p className="mt-2 text-base font-medium text-white">{summary.label}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-300">{summary.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <Card className="rounded-2xl border border-stone-800 bg-stone-950 py-0 text-stone-100">
            <CardHeader className="border-b border-stone-800 px-6 py-5">
              <CardTitle className="text-white">Guardrails</CardTitle>
              <CardDescription className="text-stone-300">
                The pipeline is useful only if each layer keeps its job.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-5">
              <Guardrail
                title="Groq handles intake and schema, not sign truth."
                detail="Speech goes through Groq STT, then the planner can only emit a strict SignPlan with known lexeme ids or explicit fallback tokens."
              />
              <Guardrail
                title="Camera capture now uses the stable direct loop from comm-interface."
                detail="MediaPipe stays in VIDEO mode, reads the live video element directly, and falls back from GPU to CPU if needed."
              />
              <Guardrail
                title="Unknown names, numbers, and meds stay visible."
                detail="Anything outside the lexicon becomes fingerspelling or a number token instead of made-up glosses."
              />
              <Guardrail
                title="Benchmarks are broader than demo copy."
                detail="The evaluation track now targets continuous ASL direction and held-out phrase sets across all configured domains."
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <Card className="rounded-2xl border border-stone-800 bg-stone-950 py-0 text-stone-100">
              <CardHeader className="border-b border-stone-800 px-6 py-5">
                <CardTitle className="text-white">Semantic Translation</CardTitle>
                <CardDescription className="text-stone-300">
                  Speech and text both move through the same semantic contract: intake, normalized
                  meaning, strict sign plan, renderer queue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6 py-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
                  <label className="grid gap-2">
                    <span className="text-[11px] uppercase tracking-[0.28em] text-stone-400">
                      Domain focus
                    </span>
                    <select
                      value={domain}
                      onChange={(event) => setDomain(event.target.value as TranslationDomain)}
                      className="rounded-[1rem] border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-white outline-none"
                    >
                      {DOMAIN_OPTIONS.map((value) => (
                        <option key={value} value={value} className="bg-slate-900">
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[11px] uppercase tracking-[0.28em] text-stone-400">
                      Planner
                    </span>
                    <select
                      value={plannerModel}
                      onChange={(event) => setPlannerModel(event.target.value as PlannerModel)}
                      className="rounded-[1rem] border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-white outline-none"
                    >
                      {PLANNER_OPTIONS.map((value) => (
                        <option key={value} value={value} className="bg-slate-900">
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  {mode === "speech" && (
                    <label className="grid gap-2">
                      <span className="text-[11px] uppercase tracking-[0.28em] text-stone-400">
                        STT model
                      </span>
                      <select
                        value={sttModel}
                        onChange={(event) => setSttModel(event.target.value as SttModel)}
                        className="rounded-[1rem] border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-white outline-none"
                      >
                        {STT_OPTIONS.map((value) => (
                          <option key={value} value={value} className="bg-slate-900">
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                {mode === "text" && (
                  <label className="grid gap-3">
                    <span className="text-[11px] uppercase tracking-[0.28em] text-stone-400">
                      Raw text
                    </span>
                    <textarea
                      value={textDraft}
                      onChange={(event) => setTextDraft(event.target.value)}
                      placeholder="Type the hearing-side message here."
                      className="min-h-44 rounded-[1.5rem] border border-stone-800 bg-stone-900 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-stone-500 focus:border-white"
                    />
                  </label>
                )}

                {mode === "speech" && (
                  <div className="grid gap-4">
                    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant={isRecording ? "destructive" : "default"}
                          onClick={() => void startRecording()}
                        >
                          {isRecording
                            ? "Stop Capture"
                            : speechAudio
                              ? "Record Again"
                              : "Record Audio"}
                        </Button>
                        <span className="text-xs text-stone-300">
                          `whisper-large-v3` stays accuracy-first; `whisper-large-v3-turbo` is the
                          faster intake option.
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <SpeechMetric
                          label="State"
                          value={isRecording ? "Listening" : speechAudio ? "Ready" : "Idle"}
                        />
                        <SpeechMetric
                          label="Length"
                          value={isRecording ? "Live" : formatDurationLabel(speechRecordingMs)}
                        />
                        <SpeechMetric
                          label="Clip"
                          value={speechAudio ? formatBytesLabel(speechAudio.size) : "No clip"}
                        />
                      </div>

                      {speechAudioUrl && (
                        <audio
                          controls
                          preload="metadata"
                          src={speechAudioUrl}
                          className="mt-4 h-10 w-full rounded-xl"
                        />
                      )}
                    </div>

                    <label className="grid gap-3">
                      <span className="text-[11px] uppercase tracking-[0.28em] text-stone-400">
                        STT spelling prompt
                      </span>
                      <textarea
                        value={speechPrompt}
                        onChange={(event) => setSpeechPrompt(event.target.value)}
                        className="min-h-28 rounded-[1.5rem] border border-stone-800 bg-stone-900 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-stone-500 focus:border-white"
                      />
                    </label>

                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
                        <span>Transcript</span>
                        <span>
                          {speechEnvelope?.intake
                            ? `${speechEnvelope.intake.words.length} timed words${
                                speechEnvelope.intake.durationSeconds
                                  ? ` · ${speechEnvelope.intake.durationSeconds.toFixed(1)}s`
                                  : ""
                              }`
                            : "Transcript appears only after Groq STT returns."}
                        </span>
                      </div>
                      <textarea
                        readOnly
                        value={visibleSpeechTranscript}
                        placeholder="The transcript appears here after the STT intake step."
                        className="min-h-28 rounded-[1.5rem] border border-stone-800 bg-stone-950 px-4 py-4 text-sm leading-6 text-stone-200 outline-none placeholder:text-stone-500"
                      />
                    </div>
                  </div>
                )}

                {mode === "sign" && (
                  <div className="grid gap-4">
                    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-4">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-stone-400">
                        Sign sequence
                      </p>
                      <p className="mt-3 min-h-14 text-lg font-medium tracking-wide text-white">
                        {formatUnits(signUnits) ||
                          "Use the deterministic controls to build a sequence."}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-stone-300">
                        Physical keyboard: `A-Z` adds fingerspelling, `Space` inserts a boundary,
                        `Backspace` removes the last token.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void commitCurrentMode()} disabled={isWorking}>
                    {isWorking ? "Running Pipeline..." : "Translate & Commit"}
                  </Button>
                  <Button variant="outline" onClick={loadExample}>
                    Load Example
                  </Button>
                  <Button variant="ghost" onClick={() => void clearCurrentMode()}>
                    Clear Current Mode
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-stone-800 bg-stone-950 py-0 text-stone-100">
              <CardHeader className="border-b border-stone-800 px-6 py-5">
                <CardTitle className="text-white">Pipeline View & Sign Player</CardTitle>
                <CardDescription className="text-stone-300">
                  Raw input flows into normalized meaning, then a strict plan, then focused sign
                  playback.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-6">
                <PipelineView envelope={pipelineEnvelope} rawInput={rawInput} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-stone-800 bg-stone-950 py-0 text-stone-100">
              <CardHeader className="border-b border-stone-800 px-6 py-5">
                <CardTitle className="text-white">Conversation Thread</CardTitle>
                <CardDescription className="text-stone-300">
                  Prior turns stay visible so speech and text can be normalized with context instead
                  of isolated sentences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 py-6">
                {deferredEntries.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-stone-800 bg-stone-950 px-4 py-8 text-center text-sm text-stone-400">
                    Commit a speech, text, sign-key, or camera fingerspelling input to build shared
                    state.
                  </div>
                ) : (
                  deferredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-stone-800 bg-stone-900 px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                            {entry.mode}
                          </span>
                          <span className="rounded-full border border-stone-800 bg-stone-900 px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-stone-300">
                            {entry.track}
                          </span>
                          <span className="text-xs text-stone-400">
                            {formatTimestamp(entry.createdAt)}
                          </span>
                        </div>
                        {entry.intakeModel && (
                          <span className="text-[11px] uppercase tracking-[0.25em] text-amber-200/70">
                            {entry.intakeModel}
                          </span>
                        )}
                      </div>

                      <div className="grid gap-3 text-sm leading-6 text-stone-200 lg:grid-cols-4">
                        <ThreadMetric label="Raw" value={entry.raw} />
                        <ThreadMetric label="Normalized" value={entry.normalized} />
                        <ThreadMetric
                          label="Sign Plan"
                          value={entry.signPlan.join(" ") || "No plan"}
                        />
                        <ThreadMetric
                          label="Renderer Queue"
                          value={entry.rendererQueue.join(" -> ") || "No queue"}
                        />
                      </div>

                      <p className="mt-3 text-xs leading-5 text-stone-400">
                        {entry.note}
                        {entry.wordCount ? ` Word timestamps captured: ${entry.wordCount}.` : ""}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border border-stone-800 bg-stone-950 py-0 text-stone-100">
              <CardHeader className="border-b border-stone-800 px-6 py-5">
                <CardTitle className="text-white">Deterministic Fallback</CardTitle>
                <CardDescription className="text-stone-300">
                  Fingerspelling, sign keys, and fixed phrases keep the system useful when semantic
                  translation is uncertain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6 py-6">
                <div className="grid grid-cols-6 gap-2">
                  {LETTER_KEYS.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => appendSignUnit(letter)}
                      className="rounded-2xl border border-stone-800 bg-stone-900 py-3 text-sm font-medium text-white transition hover:border-stone-700 hover:bg-stone-800"
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {QUICK_LEXEMES.map((lexemeId) => (
                    <button
                      key={lexemeId}
                      type="button"
                      onClick={() => appendSignUnit(lexemeId)}
                      className="rounded-2xl border border-stone-800 bg-stone-900 px-3 py-3 text-left text-xs font-medium tracking-wide text-white transition hover:border-stone-700 hover:bg-stone-800"
                    >
                      {SIGN_LEXICON[lexemeId].gloss}
                    </button>
                  ))}
                </div>

                <div className="grid gap-2">
                  {FIXED_PHRASE_LIBRARY.slice(0, 4).map((phrase) => (
                    <button
                      key={phrase.id}
                      type="button"
                      onClick={() => setSignUnits(buildPhraseUnits(phrase.tokens))}
                      className="rounded-[1.15rem] border border-stone-800 bg-stone-950 px-4 py-3 text-left text-sm text-stone-200 transition hover:border-stone-700 hover:bg-stone-900"
                    >
                      {phrase.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => appendSignUnit("/")}>
                    Boundary
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSignUnits((current) => current.slice(0, -1))}
                  >
                    Backspace
                  </Button>
                  <Button variant="ghost" onClick={() => setSignUnits([])}>
                    Clear Keys
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-stone-800 bg-stone-950 py-0 text-stone-100">
              <CardHeader className="border-b border-stone-800 px-6 py-5">
                <CardTitle className="text-white">Camera Fingerspelling</CardTitle>
                <CardDescription className="text-stone-300">
                  Uses the same direct MediaPipe video loop as the working `comm-interface` camera.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6 py-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void camera.start()} disabled={camera.isActive}>
                    Start Camera
                  </Button>
                  <Button variant="outline" onClick={camera.stop} disabled={!camera.isActive}>
                    Stop Camera
                  </Button>
                  <Button variant="ghost" onClick={camera.clear}>
                    Reset Buffer
                  </Button>
                  <span className="text-xs text-stone-300">
                    {camera.delegate ? `${camera.delegate} delegate` : "Vision booting"} ·{" "}
                    {camera.fps} fps
                  </span>
                </div>

                <p className="text-xs leading-5 text-stone-400">
                  Accuracy is best when one signing hand stays centered, fully visible, and clearly
                  separated from the face.
                </p>

                <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-stone-800 bg-black">
                  <div className="absolute inset-0 scale-x-[-1]">
                    <video
                      ref={camera.videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <HandOverlay tracking={camera.tracking} />
                  </div>

                  {camera.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-rose-300">
                      {camera.error}
                    </div>
                  )}
                </div>

                <div className="rounded-[1.4rem] border border-stone-800 bg-stone-900 p-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-stone-400">
                    Camera sentence
                  </p>
                  <p className="mt-3 min-h-10 text-base text-white">
                    {camera.tracking.sentenceText ||
                      camera.tracking.currentWord ||
                      "No committed fingerspelling yet."}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-stone-300">
                    Current sign: {camera.tracking.classification?.sign ?? "none"} · confidence{" "}
                    {Math.round((camera.tracking.classification?.confidence ?? 0) * 100)}%
                  </p>
                </div>

                <Button onClick={commitCameraSentence}>Commit Camera Sentence</Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-stone-800 bg-stone-950 py-0 text-stone-100">
              <CardHeader className="border-b border-stone-800 px-6 py-5">
                <CardTitle className="text-white">Evaluation Direction</CardTitle>
                <CardDescription className="text-stone-300">
                  The quality bar is tied to continuous ASL direction and held-out phrases, not only
                  to demos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 py-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Suites" value={`${EVALUATION_SUMMARY.suites}`} />
                  <MetricCard label="Held-out" value={`${EVALUATION_SUMMARY.heldOutCases} cases`} />
                  <MetricCard
                    label="Continuous"
                    value={`${EVALUATION_SUMMARY.continuousCases} cases`}
                  />
                </div>

                <div className="rounded-[1.35rem] border border-stone-800 bg-stone-900 p-4 text-sm leading-6 text-stone-200">
                  Domains covered: {EVALUATION_SUMMARY.domains.join(", ")}.
                </div>

                <div className="space-y-3">
                  <Guardrail
                    title="Continuous ASL benchmark direction"
                    detail="Use How2Sign-style continuous data and recent gloss-free SLT framing to test sentence-level behavior, not just isolated tokens."
                  />
                  <Guardrail
                    title="Held-out phrase coverage"
                    detail="General, support, healthcare, and education phrases stay separate from the UI examples so regressions remain visible."
                  />
                </div>
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
  const toneClasses = {
    amber: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  } satisfies Record<"amber" | "cyan" | "emerald", string>;

  return (
    <div className={`rounded-full border px-3 py-2 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.28em]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
    </div>
  );
}

function ThreadMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950 p-3">
      <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-2 text-sm text-stone-100">{value}</p>
    </div>
  );
}

function Guardrail({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1.35rem] border border-stone-800 bg-stone-900 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-stone-300">{detail}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-stone-800 bg-stone-900 p-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function SpeechMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-stone-800 bg-stone-950 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
