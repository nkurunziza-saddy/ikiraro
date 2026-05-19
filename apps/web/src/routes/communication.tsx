import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Delete, Hand, Mic, Plus, Type, X } from "lucide-react";
import {
  AslHandSvg,
  AudioVisualizer,
  AvatarViewer,
  HandOverlay,
  WebSpeechProvider,
} from "@ikiraro/components";
import { useIkiraro, useHandTracking } from "@ikiraro/communication";
import type { TranslationEnvelope } from "@ikiraro/engine/types";

export const Route = createFileRoute("/communication")({
  component: CommunicationPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "text" | "speech" | "sign";

interface Participant {
  id: string;
  name: string;
  mode: Mode;
}

interface Message {
  id: string;
  participantId: string;
  text: string;
  glossText: string;
  envelope: TranslationEnvelope | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const tts = WebSpeechProvider.getInstance();
const MODEL_URL = "/models/avatar.glb";

const MODE_META: Record<
  Mode,
  {
    label: string;
    hint: string;
    Icon: React.FC<{ size?: number; className?: string }>;
  }
> = {
  text: {
    label: "Text",
    hint: "They type — messages are signed by the avatar.",
    Icon: Type,
  },
  speech: {
    label: "Speech",
    hint: "They speak — voice is transcribed and signed.",
    Icon: Mic,
  },
  sign: {
    label: "Sign",
    hint: "They sign or use the keyboard — gestures are voiced.",
    Icon: Hand,
  },
};

// Person 0 → dark; Person 1+ → light (using explicit tokens)
const BUBBLE_CLASS = [
  "bg-foreground text-background",
  "bg-secondary border border-border text-foreground",
] as const;

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function defaultParticipants(): Participant[] {
  return [
    { id: uid(), name: "", mode: "text" },
    { id: uid(), name: "", mode: "speech" },
  ];
}

// ── Page component ────────────────────────────────────────────────────────────
// All hooks live here — they must never unmount while session is active.

export default function CommunicationPage() {
  const { snapshot, translate, translateUnits, startSpeech, stopSpeech, isReady, onTranslated } =
    useIkiraro({ sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY } });

  const camera = useHandTracking();

  const [participants, setParticipants] = useState<Participant[]>(defaultParticipants);
  const [screen, setScreen] = useState<"setup" | "session">("setup");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [signLetters, setSignLetters] = useState<string[]>([]);
  const [cameraOn, setCameraOn] = useState(false);

  const pendingId = useRef<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const activeEnvelope = useDeferredValue(snapshot.lastEnvelope);

  const activeP = participants[activeIdx];
  const nextIdx = (activeIdx + 1) % participants.length;
  const nextP = participants[nextIdx];

  // ── Translation callback ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;
    return onTranslated((envelope) => {
      const pid = pendingId.current ?? activeP.id;
      pendingId.current = null;

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          participantId: pid,
          text: envelope.normalizedText,
          glossText: envelope.plan.glossText,
          envelope,
        },
      ]);

      if (participants.some((p) => p.id !== pid && p.mode === "speech")) {
        void tts.speak(envelope.normalizedText);
      }
    });
  }, [isReady, onTranslated, activeP.id, participants]);

  // Auto-scroll
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send() {
    pendingId.current = activeP.id;
    if (activeP.mode === "text" && draft.trim()) {
      translate(draft.trim());
      setDraft("");
    } else if (activeP.mode === "speech" && snapshot.speechStatus === "capturing") {
      stopSpeech();
    } else if (activeP.mode === "sign" && signLetters.length > 0) {
      translateUnits(signLetters);
      setSignLetters([]);
    }
  }

  function pass() {
    setActiveIdx(nextIdx);
    setDraft("");
    setSignLetters([]);
    if (snapshot.speechStatus === "capturing") stopSpeech();
  }

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (screen === "setup") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <ArrowLeftRight size={16} className="text-background" />
            </div>
            <h1 className="text-foreground text-[24px] font-semibold tracking-tight">
              Communication Room
            </h1>
            <p className="text-muted-foreground text-[14px] leading-relaxed max-w-md">
              Each person selects how they communicate. The app acts as translator — bridging text,
              speech, and sign language in real time.
            </p>
          </div>

          {/* Participant cards — side by side for 2, stacked for 3+ */}
          <div
            className={`grid gap-4 ${participants.length === 2 ? "md:grid-cols-2" : "grid-cols-1"}`}
          >
            {participants.map((p, i) => (
              <ParticipantCard
                key={p.id}
                participant={p}
                index={i}
                canRemove={participants.length > 2}
                onChange={(updated) =>
                  setParticipants((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                }
                onRemove={() => setParticipants((prev) => prev.filter((x) => x.id !== p.id))}
              />
            ))}
          </div>

          {/* Add person */}
          {participants.length < 4 && (
            <button
              onClick={() =>
                setParticipants((prev) => [...prev, { id: uid(), name: "", mode: "text" }])
              }
              className="flex items-center gap-2 text-[12px] text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <Plus size={13} />
              Add another person
            </button>
          )}

          {/* Begin */}
          <div className="flex items-center gap-5 pt-2">
            <button
              onClick={() => {
                setMessages([]);
                setActiveIdx(0);
                setScreen("session");
              }}
              className="px-8 py-3 bg-foreground text-background text-[14px] font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Begin session
            </button>
            <span className="text-[12px] text-muted-foreground/40">
              Local · no account required
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Session screen ────────────────────────────────────────────────────────
  const isBusy = snapshot.isTranslating || snapshot.status === "recording";

  return (
    <div className="bg-background flex flex-col" style={{ height: "calc(100dvh - 49px)" }}>
      {/* ── Session bar ── */}
      <div className="border-b border-border h-[52px] flex items-center justify-between px-6 shrink-0">
        {/* Bridge label */}
        <div className="flex items-center gap-3">
          {participants.map((p, i) => {
            const { Icon } = MODE_META[p.mode];
            const isActive = i === activeIdx;
            return (
              <span
                key={p.id}
                className={`flex items-center gap-1.5 text-[13px] transition-colors ${
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground/50"
                }`}
              >
                <Icon size={12} className={isActive ? "opacity-100" : "opacity-50"} />
                {p.name || `Person ${String.fromCharCode(65 + i)}`}
                {i < participants.length - 1 && (
                  <ArrowLeftRight size={10} className="text-border mx-0.5" />
                )}
              </span>
            );
          })}
        </div>

        {/* End */}
        <button
          onClick={() => {
            if (snapshot.speechStatus === "capturing") stopSpeech();
            camera.stop();
            setCameraOn(false);
            setScreen("setup");
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-secondary transition-all"
        >
          <X size={13} />
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Message feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto px-6 py-6">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-8 select-none">
              <div className="flex items-center gap-6">
                {participants.map((p, i) => {
                  const { Icon, label } = MODE_META[p.mode];
                  return (
                    <div key={p.id} className="flex items-center gap-6">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl border border-border bg-secondary flex items-center justify-center">
                          <Icon size={22} className="text-muted-foreground/30" />
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] font-medium text-muted-foreground/40">
                            {p.name || `Person ${String.fromCharCode(65 + i)}`}
                          </p>
                          <p className="text-[10px] text-muted-foreground/25 mt-0.5">{label}</p>
                        </div>
                      </div>
                      {i < participants.length - 1 && (
                        <ArrowLeftRight size={18} className="text-border mb-8" />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[12px] text-muted-foreground/25">
                {activeP.name || `Person ${String.fromCharCode(65 + activeIdx)}`} goes first
              </p>
            </div>
          )}

          {/* Message bubbles */}
          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              const pIdx = participants.findIndex((p) => p.id === msg.participantId);
              const p = participants[pIdx];
              const isTwoParty = participants.length === 2;
              const alignRight = isTwoParty && pIdx !== 0;
              const bubble = BUBBLE_CLASS[Math.min(pIdx, BUBBLE_CLASS.length - 1)];

              const prevMsg = i > 0 ? messages[i - 1] : null;
              const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
              const isNewGroup = !prevMsg || prevMsg.participantId !== msg.participantId;
              const isEndGroup = !nextMsg || nextMsg.participantId !== msg.participantId;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${alignRight ? "items-end" : "items-start"} ${
                    isNewGroup ? "mt-5 first:mt-0" : "mt-0.5"
                  }`}
                >
                  {isNewGroup && (
                    <span
                      className={`text-[10px] text-muted-foreground/40 px-1 mb-1.5 ${
                        alignRight ? "text-right" : "text-left"
                      }`}
                    >
                      {p?.name || `Person ${String.fromCharCode(65 + pIdx)}`}
                      <span className="ml-1.5 opacity-60 font-mono">
                        {MODE_META[p?.mode ?? "text"].label}
                      </span>
                    </span>
                  )}
                  <div
                    className={`max-w-[68%] px-4 py-2.5 ${bubble} ${
                      // Adjust border-radius for grouping (iMessage-style)
                      isNewGroup && isEndGroup
                        ? "rounded-2xl"
                        : isNewGroup
                          ? alignRight
                            ? "rounded-t-2xl rounded-bl-2xl rounded-br-md"
                            : "rounded-t-2xl rounded-br-2xl rounded-bl-md"
                          : isEndGroup
                            ? alignRight
                              ? "rounded-b-2xl rounded-tl-2xl rounded-tr-md"
                              : "rounded-b-2xl rounded-tr-2xl rounded-tl-md"
                            : alignRight
                              ? "rounded-l-2xl rounded-r-md"
                              : "rounded-r-2xl rounded-l-md"
                    }`}
                  >
                    <p className="text-[15px] leading-snug">{msg.text}</p>
                    {msg.glossText && msg.glossText.toUpperCase() !== msg.text.toUpperCase() && (
                      <p className="text-[10px] opacity-35 mt-1.5 font-mono tracking-[0.06em]">
                        {msg.glossText}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Translating */}
            {isBusy && (
              <div
                className={`flex mt-0.5 ${
                  participants.length === 2 && activeIdx !== 0 ? "justify-end" : "justify-start"
                }`}
              >
                <div className="px-4 py-3 bg-secondary border border-border rounded-2xl flex items-center gap-1.5">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="w-1 h-1 rounded-full bg-muted-foreground/30 animate-[voice-pulse_1s_ease-in-out_infinite]"
                      style={{ animationDelay: `${j * 180}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avatar panel — desktop */}
        <div className="hidden lg:block w-72 shrink-0 bg-foreground relative">
          <AvatarViewer
            envelope={activeEnvelope}
            modelUrl={MODEL_URL}
            className="absolute inset-0 w-full h-full"
          />
          {/* Pulse */}
          <div className="absolute top-4 right-4 z-10">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
                activeEnvelope
                  ? "bg-background animate-[voice-pulse_1.6s_ease-in-out_infinite]"
                  : "bg-background/15"
              }`}
            />
          </div>
          {/* Gloss */}
          {activeEnvelope && (
            <div className="absolute bottom-0 inset-x-0 z-10 px-4 pb-4">
              <p className="font-mono text-[9px] tracking-widest uppercase text-background/40">
                {activeEnvelope.plan.glossText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Input panel ── */}
      <div className="border-t border-border bg-background shrink-0">
        {/* Who's speaking + pass button */}
        <div className="flex items-center justify-between px-6 h-11 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
            <span className="text-[13px] font-semibold text-foreground">
              {activeP.name || `Person ${String.fromCharCode(65 + activeIdx)}`}
            </span>
            {(() => {
              const { Icon, label } = MODE_META[activeP.mode];
              return (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                  <Icon size={11} />
                  {label}
                </span>
              );
            })()}
          </div>

          {participants.length > 1 && (
            <button
              onClick={pass}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all group"
            >
              Pass to{" "}
              <span className="text-foreground group-hover:text-background transition-colors">
                {nextP.name || `Person ${String.fromCharCode(65 + nextIdx)}`}
              </span>
              <ArrowLeftRight
                size={11}
                className="opacity-40 group-hover:opacity-100 transition-opacity"
              />
            </button>
          )}
        </div>

        {/* Mode input */}
        <div className="px-6 py-4">
          {/* Text */}
          {activeP.mode === "text" && (
            <div className="flex items-end gap-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && draft.trim()) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type your message…"
                rows={2}
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-[14px] outline-none resize-none text-foreground placeholder:text-muted-foreground/25 focus:border-foreground/25 transition-colors"
              />
              <button
                onClick={send}
                disabled={isBusy || !draft.trim()}
                className="px-5 py-3 bg-foreground text-background text-[13px] font-semibold rounded-xl hover:opacity-90 disabled:opacity-20 transition-all shrink-0"
              >
                Send
              </button>
            </div>
          )}

          {/* Speech */}
          {activeP.mode === "speech" && (
            <div className="flex items-center gap-5 py-1">
              {snapshot.speechStatus !== "capturing" ? (
                <button
                  onClick={() => {
                    pendingId.current = activeP.id;
                    startSpeech();
                  }}
                  disabled={!isReady || isBusy}
                  className="flex items-center gap-3 px-6 py-3 bg-foreground text-background text-[14px] font-semibold rounded-xl hover:opacity-90 disabled:opacity-30 transition-all"
                >
                  <Mic size={16} />
                  Start speaking
                </button>
              ) : (
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={send}
                    className="flex items-center gap-3 px-6 py-3 bg-foreground text-background text-[14px] font-semibold rounded-xl shrink-0 animate-[voice-pulse_1.4s_ease-in-out_infinite]"
                  >
                    <Mic size={16} />
                    Recording…
                  </button>
                  <div className="flex-1">
                    <AudioVisualizer level={snapshot.speechLevel} count={20} />
                  </div>
                  <button
                    onClick={send}
                    className="text-[12px] text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sign */}
          {activeP.mode === "sign" && (
            <div className="space-y-3">
              {/* Composed word + send */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-2.5 min-h-[44px]">
                  {signLetters.length > 0 ? (
                    <>
                      <p className="flex-1 text-[17px] font-bold tracking-[0.14em] text-foreground uppercase">
                        {signLetters.join("")}
                      </p>
                      <button
                        onClick={() => setSignLetters((p) => p.slice(0, -1))}
                        className="text-muted-foreground/30 hover:text-foreground transition-colors"
                      >
                        <Delete size={14} />
                      </button>
                    </>
                  ) : (
                    <p className="text-[13px] text-muted-foreground/25">
                      Select letters or use camera…
                    </p>
                  )}
                </div>
                <button
                  onClick={send}
                  disabled={isBusy || signLetters.length === 0}
                  className="px-5 py-2.5 bg-foreground text-background text-[13px] font-semibold rounded-xl hover:opacity-90 disabled:opacity-20 transition-all shrink-0"
                >
                  Sign
                </button>
              </div>

              {/* Camera detected text */}
              {cameraOn && (camera.tracking.currentWord || camera.tracking.sentenceText) && (
                <div className="flex items-center gap-3 px-4 py-2 bg-secondary border border-border rounded-xl">
                  <p className="flex-1 text-[13px] font-semibold text-foreground tracking-widest uppercase truncate">
                    {camera.tracking.sentenceText || camera.tracking.currentWord}
                  </p>
                  <button
                    onClick={() => {
                      const t = camera.tracking.sentenceText || camera.tracking.currentWord;
                      if (t) {
                        setSignLetters(t.split(""));
                        camera.clear();
                      }
                    }}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    Use →
                  </button>
                </div>
              )}

              {/* Camera feed */}
              {cameraOn && (
                <div className="relative h-24 rounded-xl overflow-hidden border border-border bg-foreground">
                  <video
                    ref={camera.videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-60"
                  />
                  <HandOverlay tracking={camera.tracking} />
                  <span className="absolute bottom-1.5 right-2.5 text-[8px] text-white/30 font-mono">
                    {camera.fps} fps
                  </span>
                </div>
              )}

              {/* Letter keyboard */}
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
              >
                {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                  <button
                    key={l}
                    onClick={() => setSignLetters((p) => [...p, l])}
                    className="flex flex-col items-center gap-0.5 py-2 border border-border rounded-lg hover:border-foreground/30 hover:bg-secondary transition-all"
                  >
                    <AslHandSvg letter={l} size={13} className="text-muted-foreground/30" />
                    <span className="text-[7px] font-bold text-muted-foreground/25 uppercase">
                      {l}
                    </span>
                  </button>
                ))}
              </div>

              {/* Camera toggle */}
              <button
                onClick={async () => {
                  if (cameraOn) {
                    camera.stop();
                    setCameraOn(false);
                  } else {
                    setCameraOn(true);
                    await camera.start();
                  }
                }}
                className={`text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                  cameraOn ? "text-foreground" : "text-muted-foreground/40 hover:text-foreground"
                }`}
              >
                <Hand size={11} />
                {cameraOn ? "Disable live camera" : "Enable live camera"}
                {cameraOn && camera.delegate && (
                  <span className="font-mono text-muted-foreground/30 ml-1">{camera.delegate}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Participant card (setup screen) ───────────────────────────────────────────

function ParticipantCard({
  participant,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  participant: Participant;
  index: number;
  canRemove: boolean;
  onChange: (p: Participant) => void;
  onRemove: () => void;
}) {
  const letter = String.fromCharCode(65 + index);

  return (
    <div className="border border-border rounded-2xl p-5 bg-background space-y-5">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
            <span className="text-background text-[11px] font-bold">{letter}</span>
          </div>
          <span className="text-[14px] font-semibold text-foreground">
            {participant.name || `Person ${letter}`}
          </span>
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-muted-foreground/30 hover:text-foreground transition-colors p-1"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Name */}
      <input
        type="text"
        value={participant.name}
        onChange={(e) => onChange({ ...participant, name: e.target.value })}
        placeholder="Name (optional)"
        className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-foreground/20 transition-colors"
      />

      {/* Mode selection */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">
          Communication mode
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["text", "speech", "sign"] as Mode[]).map((mode) => {
            const { label, Icon } = MODE_META[mode];
            const active = participant.mode === mode;
            return (
              <button
                key={mode}
                onClick={() => onChange({ ...participant, mode })}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border text-[12px] font-medium transition-all ${
                  active
                    ? "bg-foreground text-background border-transparent"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
          {MODE_META[participant.mode].hint}
        </p>
      </div>
    </div>
  );
}
