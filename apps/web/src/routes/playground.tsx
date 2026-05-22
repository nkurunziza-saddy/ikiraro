import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Mic, Type, Hand, Eye, Delete, ArrowRight, EyeOff } from "lucide-react";
import {
  AslHandSvg,
  AudioVisualizer,
  AvatarViewer,
  HandOverlay,
  WebSpeechProvider,
} from "@ikiraro/renderer";
import { useHandTracking } from "@ikiraro/runtime";
import { useIkiraro } from "../lib/ikiraro";
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
  } = useIkiraro();
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

  useEffect(() => {
    if (visionEnabled) {
      void startCamera();
    } else {
      stopCamera();
    }
  }, [visionEnabled, startCamera, stopCamera]);
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
  return (
    <div className="min-h-screen bg-background flex flex-col pt-[100px] md:pt-[120px]">
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 md:px-8 pb-12">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">Playground</h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            Interact with the translation engine in real-time.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              {[
                { id: "text", label: "Text", icon: Type },
                { id: "speech", label: "Speech", icon: Mic },
                { id: "sign", label: "Sign", icon: Hand },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as Mode)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                    mode === m.id
                      ? "bg-foreground text-background"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
              <div className="w-[1px] h-4 bg-border mx-2"></div>
              <button
                onClick={() => setVisionEnabled(!visionEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                  visionEnabled
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
                }`}
              >
                {visionEnabled ? <Eye size={14} /> : <EyeOff size={14} />} Camera
              </button>
            </div>
            <div className="min-h-[100px] flex flex-col justify-center py-4">
              {activeEnvelope ? (
                <div>
                  <p className="text-[28px] font-semibold text-foreground tracking-tight leading-tight mb-1">
                    {activeEnvelope.plan.glossText || activeEnvelope.normalizedText}
                  </p>
                  {activeEnvelope.normalizedText !== activeEnvelope.plan.glossText && (
                    <p className="text-[14px] text-muted-foreground">
                      {activeEnvelope.normalizedText}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[14px] text-muted-foreground">
                  {isWorking ? "Translating..." : "Translation will appear here."}
                </p>
              )}
              {displayError && <p className="text-[13px] text-red-500 mt-2">{displayError}</p>}
            </div>
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              {mode === "text" && (
                <div className="relative">
                  <textarea
                    value={textDraft}
                    onChange={(e) => setTextDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && textDraft) {
                        e.preventDefault();
                        commit();
                      }
                    }}
                    placeholder="Type something to sign..."
                    className="w-full bg-transparent outline-none text-[15px] text-foreground p-5 resize-none min-h-[120px]"
                  />
                  <div className="flex items-center justify-between p-3 border-t border-border">
                    <span className="text-[12px] text-muted-foreground ml-2">
                      Press Enter to translate
                    </span>
                    <button
                      onClick={commit}
                      disabled={isWorking || !textDraft}
                      className="px-4 py-1.5 bg-foreground text-background text-[13px] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Translate
                    </button>
                  </div>
                </div>
              )}
              {mode === "speech" && (
                <div className="flex flex-col items-center justify-center p-8 min-h-[180px]">
                  {snapshot.speechStatus !== "capturing" ? (
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => startSpeech()}
                        className="w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center hover:bg-secondary transition-all text-foreground"
                      >
                        <Mic size={18} />
                      </button>
                      <span className="text-[13px] text-muted-foreground">Click to record</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 w-full px-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center animate-pulse text-primary-foreground">
                        <Mic size={18} />
                      </div>
                      <div className="w-full h-[30px] flex items-center justify-center">
                        <AudioVisualizer level={snapshot.speechLevel} count={24} />
                      </div>
                      <button
                        onClick={commit}
                        className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Stop Recording
                      </button>
                    </div>
                  )}
                </div>
              )}
              {mode === "sign" && (
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                    <span className="text-[18px] font-bold tracking-[0.1em] uppercase text-foreground">
                      {signUnits.length > 0 ? (
                        signUnits.join(" ")
                      ) : (
                        <span className="text-muted-foreground/50 tracking-normal font-medium text-[14px]">
                          No sequence
                        </span>
                      )}
                    </span>
                    {signUnits.length > 0 && (
                      <button
                        onClick={() => setSignUnits((p) => p.slice(0, -1))}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Delete size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                      <button
                        key={l}
                        onClick={() => setSignUnits((p) => [...p, l])}
                        className="flex flex-col items-center justify-center gap-1 py-2 bg-secondary/50 hover:bg-secondary rounded-md transition-colors"
                      >
                        <AslHandSvg letter={l} size={16} className="text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground">{l}</span>
                      </button>
                    ))}
                  </div>
                  {signUnits.length > 0 && (
                    <button
                      onClick={commit}
                      disabled={isWorking}
                      className="w-full mt-4 bg-foreground text-background py-2 text-[13px] font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Sign Sequence
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="w-full aspect-[4/3] bg-secondary rounded-xl relative overflow-hidden flex items-center justify-center">
              <AvatarViewer
                envelope={activeEnvelope}
                modelUrl={MODEL_URL}
                className="w-full h-full scale-[1.1] transition-transform duration-700"
              />
            </div>
            {visionEnabled && (
              <div className="w-full rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex flex-col sm:flex-row h-auto sm:h-[180px]">
                  <div className="aspect-video bg-black relative flex-shrink-0">
                    <video
                      ref={camera.videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-70"
                    />
                    <HandOverlay tracking={camera.tracking} />
                  </div>
                  <div className="flex-1 flex flex-col justify-center p-5">
                    <span className="text-[12px] font-medium text-muted-foreground mb-1">
                      Detected Text
                    </span>
                    {camera.tracking.sentenceText || camera.tracking.currentWord ? (
                      <div className="flex flex-col">
                        <span className="text-[18px] font-semibold text-foreground uppercase tracking-wide">
                          {camera.tracking.sentenceText || camera.tracking.currentWord}
                        </span>
                        <button
                          onClick={() => {
                            const text =
                              camera.tracking.sentenceText || camera.tracking.currentWord;
                            if (text) {
                              setTextDraft(text);
                              setMode("text");
                              camera.clear();
                            }
                          }}
                          className="mt-3 text-[12px] font-medium text-primary hover:opacity-80 transition-opacity inline-flex items-center gap-1 w-fit"
                        >
                          Use Text <ArrowRight size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">
                        Waiting for signs...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
