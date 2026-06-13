import { AudioVisualizer, AvatarViewer, HandOverlay, WebSpeechProvider } from "@ikiraro/renderer";
import { useAccessibilityMode } from "@ikiraro/runtime/accessibility";
import { AudioQueue } from "@ikiraro/runtime/audio";
import { useHandTracking } from "@ikiraro/runtime/hand-tracking";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Camera as CameraIcon,
  CameraOff,
  ChevronRight,
  History,
  Mic,
  Send,
  Settings,
  Terminal,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { useIkiraro } from "../lib/ikiraro";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/playground")({
  component: SDKPlayground,
});

const MODEL_URL = "/models/avatar.glb";
const tts = WebSpeechProvider.getInstance();
const audioQueue = AudioQueue.getInstance(
  (text) => tts.speak(text).catch((err) => console.error("TTS failed:", err)),
  () => tts.cancel(),
);

const TABS = [
  { id: "stream", icon: Activity, label: "Live stream" },
  { id: "metadata", icon: Terminal, label: "Engine logs" },
  { id: "history", icon: History, label: "History" },
  { id: "settings", icon: Settings, label: "Settings" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function SDKPlayground() {
  const { snapshot, translate, startSpeech, stopSpeech, onTranslated } = useIkiraro();
  const camera = useHandTracking();
  const {
    videoRef,
    tracking,
    isActive: isCameraActive,
    fps,
    delegate,
    start: startCamera,
    stop: stopCamera,
  } = camera;
  const { mode: accessMode, setMode: setAccessMode } = useAccessibilityMode();
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("stream");
  const [logs, setLogs] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const activeEnvelope = useDeferredValue(snapshot.lastEnvelope);
  const isRecording = snapshot.speechStatus === "capturing";
  const isTranslating = snapshot.isTranslating;

  useEffect(() => {
    return onTranslated((envelope) => {
      if (!isMuted && envelope.normalizedText) {
        audioQueue.speak(envelope.normalizedText, "normal");
      }
    });
  }, [onTranslated, isMuted]);

  useEffect(() => {
    if (snapshot.lastEnvelope) {
      setLogs((prev) => [snapshot.lastEnvelope?.normalizedText, ...prev].slice(0, 20));
    }
  }, [snapshot.lastEnvelope]);

  // Sign recognition as an input source: each word committed by the vision
  // pipeline lands in the same input field as typed text, with spoken feedback.
  const lastCommittedRef = useRef<object | null>(null);
  useEffect(() => {
    const token = tracking.committedToken;
    if (!token || token === lastCommittedRef.current) return;
    lastCommittedRef.current = token;
    const word =
      token.type === "fingerspell" ? token.text : token.type === "number" ? token.value : "";
    if (!word) return;
    setText((prev) => (prev ? `${prev} ${word}` : word));
    setLogs((prev) => [`✋ signed: ${word}`, ...prev].slice(0, 20));
    if (!isMuted) audioQueue.speak(word, "normal");
  }, [tracking.committedToken, isMuted]);

  const handleSend = () => {
    if (!text.trim()) return;
    translate(text);
    setText("");
  };
  const toggleRecording = () => {
    if (isRecording) stopSpeech();
    else startSpeech();
  };
  const toggleCamera = () => {
    if (isCameraActive) stopCamera();
    else void startCamera();
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-72 border-r border-border bg-card flex flex-col shrink-0">
          <div className="h-14 px-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-foreground text-card rounded flex items-center justify-center text-[11px] font-medium">
                I
              </div>
              <span className="text-[14px] font-medium tracking-[-0.02em]">Ikiraro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "size-1.5 rounded-full transition-colors duration-[180ms]",
                  isTranslating ? "bg-foreground animate-pulse" : "bg-border",
                )}
              />
              <span className="text-[11px] text-muted-foreground font-light">Online</span>
            </div>
          </div>

          <Separator />

          <div className="flex gap-1 px-3 py-2 shrink-0">
            {TABS.map((tab) => (
              <Tooltip key={tab.id} content={tab.label} side="bottom">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center h-8 rounded-md transition-all duration-[180ms] active:scale-[0.98]",
                    activeTab === tab.id
                      ? "bg-background border border-border text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <tab.icon className="size-[15px]" />
                </button>
              </Tooltip>
            ))}
          </div>

          <Separator />

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === "stream" && (
              <div className="flex flex-col">
                <div className="aspect-video bg-[#1c1a18] relative overflow-hidden group">
                  <video
                    ref={(el) => {
                      videoElRef.current = el;
                      videoRef(el);
                    }}
                    className={cn(
                      "w-full h-full object-cover transition-opacity duration-300 scale-x-[-1]",
                      isCameraActive ? "opacity-50 group-hover:opacity-80" : "opacity-0",
                    )}
                    autoPlay
                    playsInline
                    muted
                  />
                  {isCameraActive && <HandOverlay tracking={tracking} video={videoElRef.current} />}
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
                      <CameraOff className="size-6 stroke-[1.5]" />
                      <span className="text-[10px] font-light">Standby</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="px-5 py-4">
                  <p className="text-[11px] font-medium text-muted-foreground mb-3">Sources</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={toggleCamera}
                      className={cn(
                        "flex items-center justify-center gap-2 h-9 rounded-[10px] border text-[12px] font-medium transition-all duration-[180ms] active:scale-[0.98]",
                        isCameraActive
                          ? "bg-background border-border text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                      )}
                    >
                      <CameraIcon className="size-3.5" /> Vision
                    </button>
                    <button
                      onClick={toggleRecording}
                      className={cn(
                        "flex items-center justify-center gap-2 h-9 rounded-[10px] border text-[12px] font-medium transition-all duration-[180ms] active:scale-[0.98]",
                        isRecording
                          ? "bg-background border-border text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                      )}
                    >
                      <Mic className={cn("size-3.5", isRecording && "animate-pulse")} /> Voice
                    </button>
                  </div>
                </div>

                <Separator />

                <div className="px-5 py-4">
                  <p className="text-[11px] font-medium text-muted-foreground mb-4">Recognition</p>
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-[40px] font-light tracking-[-0.05em] leading-none">
                      {tracking.classification?.sign ?? "—"}
                    </span>
                    <span className="text-[12px] font-medium text-muted-foreground pb-1">
                      {Math.round((tracking.classification?.confidence ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="h-px w-full bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground transition-all duration-500 ease-out"
                      style={{
                        width: `${(tracking.classification?.confidence ?? 0) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="px-5 py-4 space-y-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Current word</p>
                    <p className="text-[13px] font-medium">{tracking.currentWord || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Sentence buffer</p>
                    <p className="text-[13px] font-light text-secondary leading-[1.75] italic">
                      {tracking.sentenceText ? `"${tracking.sentenceText}"` : "Waiting for input…"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-2">Voice input</p>
                    <div className="h-14 rounded-[10px] border border-border overflow-hidden bg-background">
                      <AudioVisualizer level={snapshot.speechLevel} className="w-full h-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "metadata" && (
              <div className="px-5 py-5 space-y-5 animate-in fade-in duration-200">
                <p className="text-[11px] font-medium text-muted-foreground">Planning</p>
                <div>
                  <div className="flex items-baseline justify-between py-2.5 border-b border-border">
                    <span className="text-[11px] text-muted-foreground">Track</span>
                    <span className="text-[12px] font-medium">
                      {activeEnvelope?.plan.track ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between py-2.5 border-b border-border">
                    <span className="text-[11px] text-muted-foreground">Strategy</span>
                    <span className="text-[12px] font-medium">
                      {activeEnvelope?.plan.strategy ?? "—"}
                    </span>
                  </div>
                  <div className="py-3">
                    <p className="text-[10px] text-muted-foreground mb-1.5">Gloss stream</p>
                    <p className="text-[12px] font-light leading-[1.75]">
                      {activeEnvelope?.plan.glossText || "Idle"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-3">Intent</p>
                  <pre className="text-[11px] font-light bg-background p-4 rounded-[10px] border border-border text-secondary overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72 custom-scrollbar">
                    {activeEnvelope
                      ? JSON.stringify(activeEnvelope.intent, null, 2)
                      : "// Awaiting translation…"}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="px-5 py-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[11px] font-medium text-muted-foreground">Session activity</p>
                  <button
                    onClick={() => setLogs([])}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-[180ms]"
                  >
                    Clear
                  </button>
                </div>
                {logs.length === 0 ? (
                  <div className="py-14 text-center">
                    <History className="size-6 mx-auto text-border mb-3" />
                    <p className="text-[12px] font-light text-muted-foreground">
                      No recent translations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className="flex gap-3 group animate-in slide-in-from-left-2 duration-200"
                      >
                        <div className="w-px bg-border group-hover:bg-foreground transition-colors duration-[180ms] shrink-0 rounded-full" />
                        <div className="py-1 flex-1">
                          <p className="text-[13px] font-light leading-[1.75]">{log}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Translation committed
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="px-5 py-5 animate-in fade-in duration-200">
                <p className="text-[11px] font-medium text-muted-foreground mb-4">Interface mode</p>
                <div className="space-y-1">
                  {(["standard", "audio-first", "visual-first"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setAccessMode(m as any)}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-[10px] text-[12px] transition-all duration-[180ms] text-left flex items-center justify-between active:scale-[0.98] border",
                        accessMode === m
                          ? "bg-background border-border text-foreground font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground font-light",
                      )}
                    >
                      <span className="capitalize">{m.replace("-", " ")}</span>
                      {accessMode === m && (
                        <ChevronRight className="size-3 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>

                <Separator className="my-5" />

                <p className="text-[11px] font-medium text-muted-foreground mb-3">
                  Engine performance
                </p>
                <div>
                  <div className="flex items-center justify-between py-2.5 border-b border-border">
                    <span className="text-[12px] font-light text-muted-foreground flex items-center gap-2">
                      <Zap className="size-3.5 opacity-40" /> Delegate
                    </span>
                    <span className="text-[12px] font-medium capitalize">{delegate ?? "idle"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[12px] font-light text-muted-foreground flex items-center gap-2">
                      <Activity className="size-3.5 opacity-40" /> FPS
                    </span>
                    <span className="text-[12px] font-medium">{fps}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Viewport */}
        <main className="flex-1 flex flex-col bg-background">
          <div className="flex-1 relative flex items-center justify-center p-10">
            <AvatarViewer
              envelope={activeEnvelope}
              modelUrl={MODEL_URL}
              className="w-full h-full"
            />
            {activeEnvelope && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-10 text-center animate-in fade-in zoom-in-95 duration-500">
                <p className="text-[22px] font-light tracking-[-0.03em] leading-tight">
                  {activeEnvelope.normalizedText}
                </p>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="px-10 pb-10 shrink-0">
            <div className="max-w-2xl mx-auto flex items-center gap-2 bg-card border border-border rounded-[10px] p-1.5 transition-colors duration-[180ms] focus-within:border-muted-foreground/40">
              <Tooltip content={isMuted ? "Unmute voice" : "Mute voice"}>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "size-9 flex items-center justify-center rounded-[8px] transition-all duration-[180ms] active:scale-[0.98]",
                    isMuted
                      ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                      : "text-foreground bg-muted",
                  )}
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              </Tooltip>

              <input
                placeholder="Type a message to translate…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 h-9 bg-transparent border-none px-2 text-[13px] font-light focus:outline-none placeholder:text-muted-foreground/50"
              />

              <Tooltip content="Translate">
                <button
                  onClick={handleSend}
                  disabled={isTranslating || !text.trim()}
                  className={cn(
                    "size-9 flex items-center justify-center rounded-[8px] transition-all duration-[180ms] active:scale-[0.98]",
                    text.trim() && !isTranslating
                      ? "bg-foreground text-card"
                      : "text-muted-foreground/40",
                  )}
                >
                  {isTranslating ? (
                    <div className="size-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </main>

        {/* Error toast */}
        {snapshot.error && (
          <div className="fixed bottom-24 right-10 z-50 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="bg-card border border-destructive/30 px-4 py-2.5 rounded-[10px] flex items-center gap-2.5">
              <AlertCircle className="size-4 text-destructive shrink-0" />
              <p className="text-[12px] font-medium text-destructive">{snapshot.error}</p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
