import { createFileRoute } from "@tanstack/react-router";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  lazy,
  Suspense,
} from "react";
import {
  Hand,
  Mic,
  Send,
  Shrink,
  Expand,
  Eye,
  Search,
  Settings as SettingsIcon,
  Keyboard,
  X,
} from "lucide-react";
import { WebSpeechProvider } from "@ikiraro/renderer/web-speech";
import { AvatarViewer } from "@ikiraro/renderer/avatar-viewer";
import { AslHandSvg } from "@ikiraro/renderer/asl-hand-svg";
import { useHandTracking } from "@ikiraro/runtime/hand-tracking";
import { AudioQueue } from "@ikiraro/runtime/audio";
import { useAccessibilityMode } from "@ikiraro/runtime/accessibility";
import { useIkiraro } from "../lib/ikiraro";
import { usePlaygroundStore, type TTSProvider } from "../store/playground";
import { useDemoStore } from "../store/demo";
const MockStorefront = lazy(() =>
  import("../components/store/mock-storefront").then((m) => ({ default: m.MockStorefront })),
);
const MockNews = lazy(() =>
  import("../components/demo/mock-news").then((m) => ({ default: m.MockNews })),
);
import { PRODUCTS } from "../components/store/mock-storefront";
import { ARTICLES } from "../components/demo/mock-news";
import { PlaygroundCamera } from "../components/playground/playground-camera";
import { useOrchestrator } from "../lib/orchestrator";
import { ManualInputChannel, VoiceInputChannel, VisionInputChannel } from "../lib/input-channels";
import { useDemoShortcuts } from "../hooks/use-demo-shortcuts";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import type { TranslationEnvelope } from "@ikiraro/engine/types";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

const tts = WebSpeechProvider.getInstance();
const MODEL_URL = "/models/avatar.glb";

// Singleton audio queue — all TTS routes through here for priority + mode awareness
const audioQueue = AudioQueue.getInstance(
  (text) => tts.speak(text),
  () => tts.cancel(),
);

function DemoPage() {
  const { snapshot, translate, error: initError } = useIkiraro();

  const channels = useMemo(
    () => ({
      manual: new ManualInputChannel(),
      voice: new VoiceInputChannel(),
      vision: new VisionInputChannel(),
    }),
    [],
  );

  // agentSpeak returns a Promise so the orchestrator can track speaking status
  const agentSpeak = useMemo(() => (text: string) => audioQueue.speakAsync(text, "high"), []);
  const stopAudio = useMemo(() => () => audioQueue.stop(), []);

  const { orchestrator, state: interactionState } = useOrchestrator(translate, agentSpeak);

  useEffect(() => {
    const unsubs = Object.values(channels).map((ch) =>
      ch.onIntent((intent) => orchestrator.handleIntent(intent)),
    );
    const unsubEnd = channels.voice.onRecordingEnd(() => setIsRecording(false));
    return () => {
      unsubs.forEach((u) => u());
      unsubEnd();
      Object.values(channels).forEach((ch) => ch.dispose());
    };
  }, [orchestrator, channels]);

  const camera = useHandTracking();
  const { start: startCamera, stop: stopCamera } = camera;

  const {
    selectedScene,
    setSelectedScene,
    agentActive,
    setAgentActive,
    avatarExpanded,
    setAvatarExpanded,
    showKeyboard,
    setShowKeyboard,
    textDraft,
    setTextDraft,
    signUnits,
    setSignUnits,
  } = useDemoStore();

  const { ttsProvider, setTtsProvider, ttsApiKey, setTtsApiKey, visionEnabled, setVisionEnabled } =
    usePlaygroundStore();

  const activeEnvelope = useDeferredValue(snapshot.lastEnvelope);
  const displayError = snapshot.error ?? initError;
  const isWorking = snapshot.isTranslating || interactionState.status !== "idle";

  const [isRecording, setIsRecording] = useState(false);
  // SSR-safe: browser APIs not available on server
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  useEffect(() => {
    setIsVoiceSupported(channels.voice.isSupported());
  }, [channels]);

  useEffect(() => {
    tts.setConfig({ provider: ttsProvider, apiKey: ttsApiKey });
  }, [ttsProvider, ttsApiKey]);

  useEffect(() => {
    if (visionEnabled) void startCamera();
    else stopCamera();
  }, [visionEnabled, startCamera, stopCamera]);

  const { mode: accessMode, setMode: setAccessMode, isAvatarSuppressed } = useAccessibilityMode();

  // Announce mode changes (skip first render)
  const isFirstModeRender = useRef(true);
  useEffect(() => {
    if (isFirstModeRender.current) {
      isFirstModeRender.current = false;
      return;
    }
    const modeNames: Record<typeof accessMode, string> = {
      standard: "Standard mode. All modalities active.",
      "audio-first": "Audio-first mode. Sign avatar hidden.",
      "visual-first": "Visual-first mode. Text-to-speech disabled.",
      motor: "Motor mode. Single-key navigation active.",
    };
    audioQueue.speak(modeNames[accessMode], "critical");
  }, [accessMode]);

  // On-entry and scene-change announcement
  useEffect(() => {
    const msgs: Record<typeof selectedScene, string> = {
      store: `TechNova store. ${PRODUCTS.length} products available. Ask me what's here, or press 1 to 4 to navigate. Press H for keyboard shortcuts.`,
      news: `TechPulse news feed. ${ARTICLES.length} articles available. Ask me what's here, or press 1 to 6 to navigate. Press H for keyboard shortcuts.`,
    };
    const tid = setTimeout(() => audioQueue.speak(msgs[selectedScene], "normal"), 600);
    return () => clearTimeout(tid);
  }, [selectedScene]);

  const agentQuery = useMemo(
    () => (text: string) => {
      if (!agentActive) {
        audioQueue.speak(
          "Agent is off. Enable it using the Agent button in the toolbar.",
          "normal",
        );
        return;
      }
      channels.manual.emit(text);
    },
    [agentActive, channels],
  );

  const toggleRecording = () => {
    if (!isVoiceSupported) {
      audioQueue.speak("Voice input is not supported in this browser.", "normal");
      return;
    }
    if (isRecording) {
      channels.voice.stop();
      setIsRecording(false);
    } else {
      void channels.voice.start();
      setIsRecording(true);
    }
  };

  const { showShortcuts, setShowShortcuts, shortcutRows } = useDemoShortcuts({
    scene: selectedScene,
    itemCount: selectedScene === "store" ? PRODUCTS.length : ARTICLES.length,
    announce: (text) => audioQueue.speak(text, "normal"),
    repeat: () => audioQueue.repeat(),
    query: agentQuery,
    stopAudio,
    toggleVoice: toggleRecording,
  });

  const commitText = (text: string) => {
    if (!text.trim()) return;
    channels.manual.emit(text);
    setTextDraft("");
  };

  // Uses reactive signUnits from store — no getState() call needed
  const commitSignUnits = () => {
    if (signUnits.length === 0) return;
    commitText(signUnits.join(""));
    setSignUnits([]);
  };

  return (
    <div className="h-screen w-full bg-background overflow-hidden relative font-sans pt-[90px]">
      {/* Always-mounted ARIA live region — screen readers track this even when it clears */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {interactionState.status === "thinking"
          ? "Thinking..."
          : interactionState.status === "speaking"
            ? "Speaking..."
            : ""}
      </div>

      {/* Scene & agent toolbar */}
      <div className="absolute top-[90px] left-0 right-0 z-10 border-b border-border bg-background/95 backdrop-blur-md px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto py-2 flex items-center justify-between">
          <div className="flex items-center gap-1" role="tablist" aria-label="Demo scene">
            {(["store", "news"] as const).map((scene) => (
              <button
                key={scene}
                role="tab"
                aria-selected={selectedScene === scene}
                onClick={() => setSelectedScene(scene)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-colors ${
                  selectedScene === scene
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {scene === "store" ? "E-Commerce Store" : "News Feed"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Show keyboard shortcuts"
              title="Keyboard shortcuts (H)"
            >
              <Keyboard size={12} />
              Shortcuts
            </button>

            <button
              onClick={() => setAgentActive(!agentActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                agentActive
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-secondary border-border text-muted-foreground"
              }`}
              aria-label={agentActive ? "Disable agent" : "Enable agent"}
              aria-pressed={agentActive}
            >
              <Search size={12} />
              Agent {agentActive ? "On" : "Off"}
            </button>
          </div>
        </div>
      </div>

      {/* Scene content */}
      <div
        className="absolute top-[134px] bottom-0 left-0 right-0 z-0"
        role="tabpanel"
        aria-label={selectedScene === "store" ? "E-Commerce Store" : "News Feed"}
      >
        <Suspense
          fallback={
            <div className="h-full w-full flex items-center justify-center text-muted-foreground font-mono text-xs">
              Loading Scene...
            </div>
          }
        >
          {selectedScene === "store" ? <MockStorefront /> : <MockNews />}
        </Suspense>
      </div>

      {/* Keyboard shortcuts panel */}
      {showShortcuts && (
        <div
          className="absolute top-[134px] left-4 z-30 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-2"
          role="dialog"
          aria-label="Keyboard shortcuts"
          aria-modal="false"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Keyboard size={14} className="text-primary" />
              <span className="text-sm font-bold">Keyboard Shortcuts</span>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close shortcuts panel"
            >
              <X size={14} />
            </button>
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {selectedScene === "store" ? "Store Demo" : "News Demo"}
            </p>
            <div className="space-y-2">
              {shortcutRows.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <kbd className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded border border-border text-foreground whitespace-nowrap">
                    {key}
                  </kbd>
                  <span className="text-[12px] text-muted-foreground text-right">{desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Ask the agent anything in natural language — "what's here?", "tell me about product
                2", "add it to cart".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera widget */}
      <PlaygroundCamera camera={camera} commitText={(text) => channels.vision.emit(text)} />

      {/* Avatar widget — hidden in audio-first (blind) mode */}
      {!isAvatarSuppressed && (
        <DemoAvatar
          activeEnvelope={activeEnvelope}
          displayError={displayError}
          expanded={avatarExpanded}
          onToggle={() => setAvatarExpanded(!avatarExpanded)}
          isWorking={isWorking}
        />
      )}

      {/* ASL keyboard popover */}
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
            aria-label="Toggle sign language keyboard"
          >
            <Hand size={20} />
          </button>

          <DemoSettings
            ttsProvider={ttsProvider}
            setTtsProvider={setTtsProvider}
            ttsApiKey={ttsApiKey}
            setTtsApiKey={setTtsApiKey}
            visionEnabled={visionEnabled}
            setVisionEnabled={setVisionEnabled}
            accessMode={accessMode}
            setAccessMode={setAccessMode}
          />

          <Input
            type="text"
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && textDraft) commitText(textDraft);
            }}
            placeholder={
              selectedScene === "store"
                ? "What's here? Add headphones to cart. Checkout."
                : "What's on the page? Open the AI article."
            }
            className="flex-1 bg-transparent border-none outline-none focus-visible:ring-0 shadow-none px-4 text-[15px]"
            id="demo-input"
            aria-label="Ask the agent a question or give a command"
          />

          <button
            onClick={toggleRecording}
            disabled={!isVoiceSupported}
            className={`p-3 rounded-full transition-colors flex-shrink-0 relative disabled:opacity-30 disabled:cursor-not-allowed ${
              isRecording
                ? "bg-destructive/10 text-destructive animate-pulse"
                : "hover:bg-accent text-muted-foreground"
            }`}
            title={isVoiceSupported ? "Voice Input" : "Voice not supported in this browser"}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
            aria-pressed={isRecording}
          >
            <Mic size={20} />
            {isRecording && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-popover" />
            )}
          </button>

          <button
            onClick={() => textDraft && commitText(textDraft)}
            disabled={!textDraft || isWorking}
            className="p-3 bg-primary text-primary-foreground rounded-full transition-all disabled:opacity-50 ml-1 flex-shrink-0 hover:bg-primary/90 active:scale-95 shadow-md shadow-primary/20"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Visual "Thinking" indicator for sighted users */}
      {isWorking && (
        <div
          className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-20 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold animate-pulse"
          aria-hidden="true"
        >
          Thinking...
        </div>
      )}
    </div>
  );
}

const DemoAvatar = memo(function DemoAvatar({
  activeEnvelope,
  displayError,
  expanded,
  onToggle,
  isWorking,
}: {
  activeEnvelope: TranslationEnvelope | null;
  displayError?: string | null;
  expanded: boolean;
  onToggle: () => void;
  isWorking: boolean;
}) {
  return (
    <div
      className={`absolute z-10 transition-all duration-500 ease-in-out border border-border shadow-2xl overflow-hidden bg-background ${
        expanded
          ? "inset-0 rounded-none"
          : "bottom-6 right-6 w-[220px] h-[220px] md:w-[260px] md:h-[280px] rounded-3xl glass-pane border-2"
      }`}
      aria-label="Sign language avatar"
      role="region"
    >
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity">
        <span className="text-white/80 text-xs font-semibold tracking-wider uppercase drop-shadow-md">
          Sign Language
        </span>
        <button
          onClick={onToggle}
          className="text-foreground hover:text-primary transition-colors bg-background/40 p-1.5 rounded-md backdrop-blur-md"
          aria-label={expanded ? "Shrink avatar" : "Expand avatar"}
        >
          {expanded ? <Shrink size={16} /> : <Expand size={16} />}
        </button>
      </div>

      {isWorking && (
        <div
          className="absolute top-3 right-3 z-10 w-2 h-2 bg-primary rounded-full animate-pulse"
          aria-hidden="true"
        />
      )}

      <AvatarViewer envelope={activeEnvelope} modelUrl={MODEL_URL} className="w-full h-full" />

      <div
        className={`absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-[90%] transition-all duration-500 ${
          expanded ? "bottom-32 max-w-2xl" : "bottom-4 max-w-full"
        }`}
        aria-live="polite"
      >
        {activeEnvelope ? (
          <div
            className={`bg-background/60 backdrop-blur-md rounded-xl border border-border/10 ${expanded ? "p-4" : "p-2"}`}
          >
            <p
              className={`font-semibold text-foreground tracking-tight leading-tight ${expanded ? "text-2xl" : "text-sm"}`}
            >
              {activeEnvelope.plan.glossText || activeEnvelope.normalizedText}
            </p>
            {activeEnvelope.normalizedText !== activeEnvelope.plan.glossText && (
              <p className={`text-foreground/70 mt-0.5 ${expanded ? "text-sm" : "text-[10px]"}`}>
                {activeEnvelope.normalizedText}
              </p>
            )}
          </div>
        ) : null}
        {displayError && (
          <div className="bg-destructive/20 text-destructive-foreground p-2 rounded mt-2 text-xs backdrop-blur-sm border border-destructive">
            {displayError}
          </div>
        )}
      </div>
    </div>
  );
});

const DemoSettings = memo(function DemoSettings({
  ttsProvider,
  setTtsProvider,
  ttsApiKey,
  setTtsApiKey,
  visionEnabled,
  setVisionEnabled,
  accessMode,
  setAccessMode,
}: {
  ttsProvider: TTSProvider;
  setTtsProvider: (p: TTSProvider) => void;
  ttsApiKey: string;
  setTtsApiKey: (k: string) => void;
  visionEnabled: boolean;
  setVisionEnabled: (v: boolean) => void;
  accessMode: import("@ikiraro/runtime").AccessibilityMode;
  setAccessMode: (m: import("@ikiraro/runtime").AccessibilityMode) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className="p-3 rounded-full transition-colors flex-shrink-0 hover:bg-accent text-muted-foreground"
        title="Demo Settings"
        aria-label="Demo Settings"
      >
        <SettingsIcon size={20} />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 p-5 space-y-4">
        <div className="border-b border-border pb-2">
          <h3 className="font-semibold text-foreground text-sm">Demo Settings</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Accessibility Mode
            </Label>
            <Select
              value={accessMode}
              onValueChange={(val) => {
                if (val) setAccessMode(val as import("@ikiraro/runtime").AccessibilityMode);
              }}
            >
              <SelectTrigger className="w-full bg-secondary border-border h-8 text-xs">
                <SelectValue placeholder="Select Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard — all modalities</SelectItem>
                <SelectItem value="audio-first">Audio-first — no sign avatar</SelectItem>
                <SelectItem value="visual-first">Visual-first — no TTS</SelectItem>
                <SelectItem value="motor">Motor — single-key navigation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Sign Language Input
            </Label>
            <button
              onClick={() => setVisionEnabled(!visionEnabled)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                visionEnabled
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
              }`}
              aria-pressed={visionEnabled}
            >
              <div className="flex items-center gap-2">
                <Eye size={15} />
                <span className="text-xs font-medium">Camera Tracking</span>
              </div>
              <div
                className={`w-2.5 h-2.5 rounded-full ${visionEnabled ? "bg-primary" : "bg-muted-foreground"}`}
              />
            </button>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              TTS Voice Engine
            </Label>
            <Select
              value={ttsProvider}
              onValueChange={(val) => {
                if (val) setTtsProvider(val as TTSProvider);
              }}
            >
              <SelectTrigger className="w-full mb-2 bg-secondary border-border h-8 text-xs">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="browser">Browser Default (Free)</SelectItem>
                <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
            {ttsProvider !== "browser" && (
              <Input
                type="password"
                value={ttsApiKey}
                onChange={(e) => setTtsApiKey(e.target.value)}
                placeholder="API Key"
                className="w-full bg-secondary border-border text-xs h-8"
              />
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
