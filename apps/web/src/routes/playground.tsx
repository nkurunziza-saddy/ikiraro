import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Hand, Mic, Send } from "lucide-react";
import { WebSpeechProvider } from "@ikiraro/renderer/web-speech";
import { AvatarViewer } from "@ikiraro/renderer/avatar-viewer";
import { AslHandSvg } from "@ikiraro/renderer/asl-hand-svg";
import { useHandTracking } from "@ikiraro/runtime/hand-tracking";
import { useIkiraro } from "../lib/ikiraro";
import { usePlaygroundStore } from "../store/playground";
import { PlaygroundCamera } from "../components/playground/playground-camera";
import { PlaygroundSettings } from "../components/playground/playground-settings";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/playground")({
  component: PlaygroundPage,
});

const tts = WebSpeechProvider.getInstance();
const MODEL_URL = "/models/avatar.glb";

function PlaygroundPage() {
  const { snapshot, translate, error: initError } = useIkiraro();

  const camera = useHandTracking();
  const { start: startCamera, stop: stopCamera } = camera;

  const {
    ttsProvider,
    ttsApiKey,
    visionEnabled,
    showKeyboard,
    setShowKeyboard,
    textDraft,
    setTextDraft,
    signUnits,
    setSignUnits,
  } = usePlaygroundStore();

  const activeEnvelope = useDeferredValue(snapshot.lastEnvelope);
  const displayError = snapshot.error ?? initError;

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    tts.setConfig({ provider: ttsProvider, apiKey: ttsApiKey });
  }, [ttsProvider, ttsApiKey]);

  useEffect(() => {
    if (visionEnabled) void startCamera();
    else stopCamera();
  }, [visionEnabled, startCamera, stopCamera]);

  // Lazily create SpeechRecognition to avoid repeated instances
  const getRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      if (text) {
        translate(text);
        void tts.speak(text);
      }
      setIsRecording(false);
    };
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    return r;
  };

  const isSpeechSupported =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const toggleRecording = () => {
    const r = getRecognition();
    if (!r) return;
    if (isRecording) {
      r.stop();
      setIsRecording(false);
    } else {
      try {
        r.start();
        setIsRecording(true);
        setTimeout(() => setIsRecording(false), 8000);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const commitText = (text: string) => {
    if (!text.trim()) return;
    translate(text);
    void tts.speak(text);
    setTextDraft("");
  };

  const commitSignUnits = () => {
    const current = usePlaygroundStore.getState().signUnits;
    if (current.length === 0) return;
    commitText(current.join(""));
    setSignUnits([]);
  };

  return (
    <div className="h-screen w-full bg-background overflow-hidden relative font-sans pt-[90px]">
      {/* Camera widget */}
      <PlaygroundCamera
        camera={camera}
        commitText={(text) => {
          translate(text);
          void tts.speak(text);
        }}
      />

      {/* Hero + Avatar — centered stage */}
      <div className="absolute top-[90px] bottom-[88px] left-0 right-0 flex flex-col items-center justify-center gap-6">
        <div className="text-center mb-2 select-none">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Interactive Engine
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Sign Language Playground
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Type or speak — watch the avatar sign it in real time
          </p>
        </div>

        {/* Avatar */}
        <div className="relative w-[280px] h-[300px] md:w-[320px] md:h-[360px] rounded-3xl border border-border shadow-2xl overflow-hidden bg-background glass-pane">
          <AvatarViewer envelope={activeEnvelope} modelUrl={MODEL_URL} className="w-full h-full" />

          {/* Subtitle strip */}
          <div className="absolute bottom-4 left-3 right-3 text-center pointer-events-none">
            {activeEnvelope ? (
              <div className="bg-background/70 backdrop-blur-md rounded-xl border border-border/20 px-3 py-2">
                <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                  {activeEnvelope.plan.glossText || activeEnvelope.normalizedText}
                </p>
              </div>
            ) : (
              <div className="bg-background/40 backdrop-blur-sm rounded-lg px-3 py-1.5 opacity-60">
                <p className="text-xs text-muted-foreground">Waiting for input...</p>
              </div>
            )}
          </div>
        </div>

        {displayError && (
          <div className="bg-destructive/20 text-destructive-foreground px-4 py-2 rounded-lg text-xs border border-destructive max-w-xs text-center">
            {displayError}
          </div>
        )}
      </div>

      {/* ASL Keyboard */}
      {showKeyboard && (
        <div className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-20 w-full max-w-[600px] px-4 md:px-0">
          <div className="bg-popover/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-4 animate-in slide-in-from-bottom-2 text-popover-foreground">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">
                {signUnits.length > 0 ? signUnits.join(" ") : "Manual Alphabet Input"}
              </span>
              {signUnits.length > 0 && (
                <Button
                  onClick={commitSignUnits}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
                >
                  Send Sign
                </Button>
              )}
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-9 gap-1 max-h-[200px] overflow-y-auto">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                <button
                  key={l}
                  onClick={() => setSignUnits((p) => [...p, l])}
                  className="flex flex-col items-center justify-center gap-1 py-2 bg-secondary hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border"
                >
                  <AslHandSvg letter={l} size={20} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground">{l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Omnibar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-[600px] px-4 md:px-0">
        <div className="bg-popover/95 backdrop-blur-xl border border-border rounded-full shadow-2xl p-2 flex items-center w-full text-popover-foreground">
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`p-3 rounded-full transition-colors flex-shrink-0 ${showKeyboard ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground"}`}
            title="Manual Sign Keyboard"
          >
            <Hand size={20} />
          </button>

          <PlaygroundSettings />

          <Input
            type="text"
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && textDraft) commitText(textDraft);
            }}
            placeholder="Type anything to sign..."
            className="flex-1 bg-transparent border-none outline-none focus-visible:ring-0 shadow-none px-4 text-[15px]"
            id="playground-input"
          />

          <button
            onClick={toggleRecording}
            disabled={!isSpeechSupported}
            className={`p-3 rounded-full transition-colors flex-shrink-0 relative disabled:opacity-30 disabled:cursor-not-allowed ${
              isRecording
                ? "bg-destructive/10 text-destructive animate-pulse"
                : "hover:bg-accent text-muted-foreground"
            }`}
            title={isSpeechSupported ? "Voice Input" : "Voice not supported in this browser"}
          >
            <Mic size={20} />
            {isRecording && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-popover" />
            )}
          </button>

          <button
            onClick={() => textDraft && commitText(textDraft)}
            disabled={!textDraft || snapshot.isTranslating}
            className="p-3 bg-primary text-primary-foreground rounded-full transition-all disabled:opacity-50 ml-1 flex-shrink-0 hover:bg-primary/90 active:scale-95 shadow-md shadow-primary/20"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
