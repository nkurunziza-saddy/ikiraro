import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Mic, Type, Hand, Eye, Delete } from "lucide-react";

import {
  AslHandSvg,
  AudioVisualizer,
  AvatarViewer,
  Button,
  HandOverlay,
  WebSpeechProvider,
} from "@ikiraro/components";
import { useIkiraro, useHandTracking } from "@ikiraro/communication";
import { Toolbar, type ToolbarItem } from "@/components/ui/toolbar";

export const Route = createFileRoute("/playground")({
  component: DemoPage,
});

const tts = WebSpeechProvider.getInstance();
const MODEL_URL = "/models/avatar.glb";
type Mode = "text" | "speech" | "sign";

function DemoPage() {
  const {
    snapshot,
    translate,
    translateUnits,
    startSpeech,
    stopSpeech,
    error: initError,
  } = useIkiraro({
    sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
  });

  const camera = useHandTracking();
  const { start: startCamera, stop: stopCamera } = camera;

  const [mode, setMode] = useState<Mode>("text");
  const [textDraft, setTextDraft] = useState("");
  const [signUnits, setSignUnits] = useState<string[]>([]);
  const [visionEnabled, setVisionEnabled] = useState(false);

  const activeEnvelope = useDeferredValue(snapshot.lastEnvelope);
  const lastSpokenRef = useRef<string | null>(null);

  const isWorking = snapshot.isTranslating || snapshot.status === "recording";
  const displayError = snapshot.error ?? initError;

  useEffect(() => {
    if (!activeEnvelope) return;
    const text = activeEnvelope.normalizedText;
    if (!text || text === lastSpokenRef.current) return;
    lastSpokenRef.current = text;
    void tts.speak(text);
  }, [activeEnvelope]);

  const commit = () => {
    if (mode === "text" && textDraft) {
      translate(textDraft);
      setTextDraft("");
    } else if (mode === "sign" && signUnits.length > 0) {
      translateUnits(signUnits);
      setSignUnits([]);
    } else if (mode === "speech") {
      stopSpeech();
    }
  };

  const toolbarItems = useMemo<ToolbarItem[]>(
    () => [
      {
        type: "button",
        label: "Text",
        icon: <Type />,
        active: mode === "text",
        onClick: () => setMode("text"),
      },
      {
        type: "button",
        label: "Speech",
        icon: <Mic />,
        active: mode === "speech",
        onClick: () => setMode("speech"),
      },
      {
        type: "button",
        label: "Sign",
        icon: <Hand />,
        active: mode === "sign",
        onClick: () => setMode("sign"),
      },
      { type: "divider" },
      {
        type: "button",
        label: "Camera",
        icon: <Eye />,
        active: visionEnabled,
        onClick: () => {
          if (visionEnabled) {
            stopCamera();
            setVisionEnabled(false);
          } else {
            setVisionEnabled(true);
            void startCamera();
          }
        },
      },
    ],
    [mode, visionEnabled, startCamera, stopCamera],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left: output + input ── */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Mode switcher */}
            <Toolbar items={toolbarItems} aria-label="Input mode" />

            {/* Translation output */}
            <div className="min-h-[96px] flex items-start py-2">
              {activeEnvelope ? (
                <div className="space-y-2 w-full">
                  <p className="text-[26px] font-bold text-foreground tracking-tight leading-tight">
                    {activeEnvelope.plan.glossText || activeEnvelope.normalizedText}
                  </p>
                  {activeEnvelope.normalizedText !== activeEnvelope.plan.glossText && (
                    <p className="text-[14px] text-muted-foreground leading-relaxed">
                      {activeEnvelope.normalizedText}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[14px] text-muted-foreground/30">
                  {isWorking ? "Translating…" : "Translation will appear here"}
                </p>
              )}
            </div>

            {/* Input area */}
            <div className="border border-border rounded-lg overflow-hidden">
              {mode === "text" && (
                <div className="p-5">
                  <textarea
                    value={textDraft}
                    onChange={(e) => setTextDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && textDraft) {
                        e.preventDefault();
                        commit();
                      }
                    }}
                    placeholder="Type something to sign…"
                    rows={3}
                    className="w-full bg-transparent outline-none text-[15px] resize-none text-foreground placeholder:text-muted-foreground/25"
                  />
                  <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                    <span className="text-[11px] text-muted-foreground/40">↵ to translate</span>
                    <Button
                      onClick={commit}
                      disabled={isWorking || !textDraft}
                      className="px-4 h-7 bg-foreground text-background text-[11px] font-bold rounded hover:opacity-90 disabled:opacity-20 transition-all"
                    >
                      Translate
                    </Button>
                  </div>
                </div>
              )}

              {mode === "speech" && (
                <div className="p-8 flex flex-col items-center gap-5">
                  {snapshot.speechStatus !== "capturing" ? (
                    <>
                      <button
                        onClick={() => startSpeech()}
                        className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:border-foreground hover:bg-secondary transition-all"
                      >
                        <Mic size={18} className="text-foreground" />
                      </button>
                      <span className="text-[11px] text-muted-foreground/40">Click to record</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center animate-[voice-pulse_1.2s_ease-in-out_infinite]">
                        <Mic size={18} className="text-background" />
                      </div>
                      <AudioVisualizer level={snapshot.speechLevel} count={20} />
                      <button
                        onClick={commit}
                        className="text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        Stop recording
                      </button>
                    </>
                  )}
                </div>
              )}

              {mode === "sign" && (
                <div className="p-5">
                  {signUnits.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                      <p className="text-[18px] text-foreground font-bold flex-1 tracking-[0.18em] uppercase">
                        {signUnits.join("")}
                      </p>
                      <button
                        onClick={() => setSignUnits((p) => p.slice(0, -1))}
                        className="text-muted-foreground/30 hover:text-foreground transition-colors"
                      >
                        <Delete size={14} />
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-9 gap-1">
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                      <button
                        key={l}
                        onClick={() => setSignUnits((p) => [...p, l])}
                        className="flex flex-col items-center gap-0.5 py-2 border border-border rounded hover:border-foreground hover:bg-secondary transition-all"
                      >
                        <AslHandSvg letter={l} size={16} className="text-muted-foreground/40" />
                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase">
                          {l}
                        </span>
                      </button>
                    ))}
                  </div>
                  {signUnits.length > 0 && (
                    <div className="flex justify-end pt-4 border-t border-border mt-4">
                      <Button
                        onClick={commit}
                        disabled={isWorking}
                        className="px-4 h-7 bg-foreground text-background text-[11px] font-bold rounded"
                      >
                        Sign
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {displayError && (
              <p className="text-[12px] text-muted-foreground/60 text-center">{displayError}</p>
            )}
          </div>

          {/* ── Right: avatar + camera ── */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="aspect-[4/5] bg-foreground rounded-lg overflow-hidden relative">
              <AvatarViewer
                envelope={activeEnvelope}
                modelUrl={MODEL_URL}
                className="w-full h-full"
              />
              <div className="absolute top-3 right-3">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${activeEnvelope ? "bg-background" : "bg-background/15"}`}
                />
              </div>
            </div>

            {visionEnabled && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="relative aspect-video bg-foreground">
                  <video
                    ref={camera.videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-60"
                  />
                  <HandOverlay tracking={camera.tracking} />
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 rounded text-[8px] text-white/60 font-mono">
                    {camera.fps} fps
                  </div>
                </div>
                {(camera.tracking.sentenceText || camera.tracking.currentWord) && (
                  <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-[12px] font-semibold text-foreground truncate tracking-wide uppercase">
                      {camera.tracking.sentenceText || camera.tracking.currentWord}
                    </span>
                    <button
                      onClick={() => {
                        const text = camera.tracking.sentenceText || camera.tracking.currentWord;
                        if (text) {
                          setTextDraft(text);
                          setMode("text");
                          camera.clear();
                        }
                      }}
                      className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      Use →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
