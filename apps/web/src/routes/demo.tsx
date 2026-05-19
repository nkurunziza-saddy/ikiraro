import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Mic, Type, Hand, Eye, CircleStop, Delete } from "lucide-react";

import {
  AslHandSvg,
  AudioVisualizer,
  AvatarViewer,
  HandOverlay,
  WebSpeechProvider,
} from "@ikiraro/components";
import { useHandTracking } from "@ikiraro/communication";
import { useCommunicationSession } from "@/hooks/use-communication-session";
import { Toolbar, type ToolbarItem } from "@/components/ui/toolbar";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

const tts = WebSpeechProvider.getInstance();
const MODEL_URL = "/models/avatar.glb";

function DemoPage() {
  const session = useCommunicationSession(() => {});
  const camera = useHandTracking();

  const activeEnvelope = useDeferredValue(session.previewEnvelope);
  const [visionEnabled, setVisionEnabled] = useState(false);
  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeEnvelope) return;
    const text = activeEnvelope.normalizedText;
    if (!text || text === lastSpokenRef.current) return;
    lastSpokenRef.current = text;
    void tts.speak(text);
  }, [activeEnvelope]);

  const toolbarItems: ToolbarItem[] = [
    {
      type: "button",
      label: "Text",
      icon: <Type />,
      active: session.mode === "text",
      onClick: () => session.setMode("text"),
    },
    {
      type: "button",
      label: "Speech",
      icon: <Mic />,
      active: session.mode === "speech",
      onClick: () => session.setMode("speech"),
    },
    {
      type: "button",
      label: "Sign",
      icon: <Hand />,
      active: session.mode === "sign",
      onClick: () => session.setMode("sign"),
    },
    { type: "divider" },
    {
      type: "button",
      label: "Camera",
      icon: <Eye />,
      active: visionEnabled,
      onClick: () => {
        if (visionEnabled) {
          camera.stop();
          setVisionEnabled(false);
        } else {
          setVisionEnabled(true);
          void camera.start();
        }
      },
    },
  ];

  return (
    <div className="min-h-screen bg-paper flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="px-6 h-14 border-b border-rule-soft flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[13px] font-medium text-ink tracking-[-0.01em]">
            Ikiraro <em className="font-normal italic text-primary">demo</em>
          </span>
        </div>
        <Toolbar items={toolbarItems} aria-label="Input mode" />
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-[520px] space-y-3">
          {/* Output */}
          <div className="bg-paper-card border border-rule rounded-[3px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="px-5 pt-4 pb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-stone">
                Translation
              </span>
            </div>
            <div className="px-5 pb-5 min-h-[80px] flex items-center">
              {activeEnvelope ? (
                <div className="w-full space-y-2">
                  <p className="text-[24px] font-medium text-ink tracking-[-0.02em] leading-tight">
                    {activeEnvelope.plan.glossText || activeEnvelope.normalizedText}
                  </p>
                  {activeEnvelope.normalizedText !== activeEnvelope.plan.glossText && (
                    <p className="text-[13px] text-stone leading-relaxed">
                      {activeEnvelope.normalizedText}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 bg-paper-soft border border-rule-soft rounded-[2px] text-stone font-mono">
                      {activeEnvelope.plan.strategy}
                    </span>
                    <span className="text-[9px] text-stone/60 font-mono">
                      {Math.round(activeEnvelope.plan.metadata.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-stone/50 italic">
                  {session.isWorking ? "Translating…" : "Awaiting input"}
                </p>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="bg-paper-card border border-rule rounded-[3px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="px-5 pt-4 pb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-stone">
                {session.mode === "text"
                  ? "Text"
                  : session.mode === "speech"
                    ? "Speech"
                    : "Fingerspell"}
              </span>
            </div>

            {/* Text mode */}
            {session.mode === "text" && (
              <div className="px-5 pb-4">
                <textarea
                  value={session.textDraft}
                  onChange={(e) => session.setTextDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && session.textDraft) {
                      e.preventDefault();
                      void session.commit();
                    }
                  }}
                  placeholder="Type a message… Enter to translate"
                  rows={3}
                  className="w-full bg-transparent outline-none text-[15px] resize-none text-ink placeholder:text-stone/40 placeholder:italic"
                />
                <div className="flex justify-end pt-2 border-t border-rule-soft mt-2">
                  <button
                    onClick={() => void session.commit()}
                    disabled={session.isWorking || !session.textDraft}
                    className="px-4 py-1.5 bg-ink text-on-dark text-[10px] font-bold uppercase tracking-[0.1em] rounded-[2px] hover:bg-ink-soft transition-colors disabled:opacity-30"
                  >
                    Translate
                  </button>
                </div>
              </div>
            )}

            {/* Speech mode */}
            {session.mode === "speech" && (
              <div className="px-5 pb-6 flex flex-col items-center gap-5 pt-4">
                {session.captureStatus !== "capturing" ? (
                  <button
                    onClick={session.startSpeechCapture}
                    className="relative w-16 h-16 rounded-full border-2 border-rule flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <Mic
                      size={22}
                      className="text-stone group-hover:text-primary transition-colors"
                    />
                  </button>
                ) : (
                  <div className="w-full flex flex-col items-center gap-4">
                    {/* Pulsing mic */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/10 animate-[voice-pulse_1.4s_ease-in-out_infinite] scale-150" />
                      <div className="relative w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                        <Mic size={22} className="text-primary" />
                      </div>
                    </div>
                    <AudioVisualizer level={session.captureLevel} count={20} />
                    <button
                      onClick={() => void session.commit()}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-ink text-on-dark text-[10px] font-bold uppercase tracking-[0.1em] rounded-[2px] hover:bg-ink-soft transition-colors"
                    >
                      <CircleStop size={11} />
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sign mode */}
            {session.mode === "sign" && (
              <div className="px-5 pb-4">
                {session.signUnits.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-rule-soft">
                    <p className="font-mono text-[15px] text-primary tracking-[0.08em] flex-1">
                      {session.signUnits.join("")}
                    </p>
                    <button
                      onClick={() => session.setSignUnits((p) => p.slice(0, -1))}
                      className="p-1 text-stone hover:text-ink transition-colors"
                    >
                      <Delete size={14} />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-7 gap-1">
                  {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                    <button
                      key={l}
                      onClick={() => session.setSignUnits((p) => [...p, l])}
                      className="flex flex-col items-center gap-0.5 py-1.5 border border-rule-soft rounded-[2px] hover:bg-paper-soft hover:border-rule transition-all group"
                    >
                      <AslHandSvg
                        letter={l}
                        size={18}
                        className="text-stone group-hover:text-ink transition-colors"
                      />
                      <span className="text-[7px] font-bold text-stone/60 group-hover:text-stone transition-colors uppercase">
                        {l}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end pt-3 border-t border-rule-soft mt-3">
                  <button
                    onClick={() => void session.commit()}
                    disabled={session.isWorking || session.signUnits.length === 0}
                    className="px-4 py-1.5 bg-ink text-on-dark text-[10px] font-bold uppercase tracking-[0.1em] rounded-[2px] hover:bg-ink-soft transition-colors disabled:opacity-30"
                  >
                    Translate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {(session.error || camera.error) && (
            <p className="text-[11px] text-red-500/70 text-center px-2">
              {session.error || camera.error}
            </p>
          )}
        </div>
      </main>

      {/* ── Fixed bottom-right panel ── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end z-40">
        {/* Camera feed — always mounted */}
        <div className={visionEnabled ? "block" : "hidden"}>
          <div className="w-[220px] bg-ink rounded-[3px] overflow-hidden border border-ink-soft shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="relative aspect-video">
              <video
                ref={camera.videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-70"
              />
              <HandOverlay tracking={camera.tracking} />
              {camera.delegate && (
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] text-white/80 font-mono uppercase tracking-widest">
                  {camera.fps} fps
                </span>
              )}
            </div>
            {(camera.tracking.sentenceText || camera.tracking.currentWord) && (
              <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-ink-soft">
                <span className="font-mono text-[12px] text-on-dark/80 truncate flex-1">
                  {camera.tracking.sentenceText || camera.tracking.currentWord}
                </span>
                <button
                  onClick={() => {
                    const text = camera.tracking.sentenceText || camera.tracking.currentWord;
                    if (text) {
                      session.setTextDraft(text);
                      session.setMode("text");
                      camera.clear();
                    }
                  }}
                  className="shrink-0 px-2 py-1 bg-primary text-on-primary text-[9px] font-bold uppercase tracking-widest rounded-[2px]"
                >
                  Use
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Avatar card */}
        <div className="w-[200px] h-[260px] bg-[#1A1610] rounded-[3px] overflow-hidden border border-[#2A2318] shadow-[0_4px_24px_rgba(0,0,0,0.5)] relative">
          <AvatarViewer envelope={activeEnvelope} modelUrl={MODEL_URL} className="w-full h-full" />
          {/* Status dot */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <span
              className={[
                "w-1.5 h-1.5 rounded-full transition-colors duration-500",
                activeEnvelope
                  ? "bg-primary animate-[voice-pulse_1s_ease-in-out_infinite]"
                  : "bg-white/20",
              ].join(" ")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
