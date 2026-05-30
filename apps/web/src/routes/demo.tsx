import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState, lazy, Suspense } from "react";
import { Mic, Send, Shrink, Expand, Settings as SettingsIcon } from "lucide-react";
import { WebSpeechProvider } from "@ikiraro/renderer/web-speech";
import { AvatarViewer } from "@ikiraro/renderer/avatar-viewer";
import { useHandTracking } from "@ikiraro/runtime/hand-tracking";
import { AudioQueue } from "@ikiraro/runtime/audio";
import { useAccessibilityMode } from "@ikiraro/runtime/accessibility";
import { useIkiraro } from "../lib/ikiraro";
import { usePlaygroundStore } from "../store/playground";
import { useDemoStore } from "../store/demo";
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
import { PRODUCTS } from "../components/store/mock-storefront";
import { ARTICLES } from "../components/demo/mock-news";

const MockStorefront = lazy(() =>
  import("../components/store/mock-storefront").then((m) => ({
    default: m.MockStorefront,
  })),
);
const MockNews = lazy(() =>
  import("../components/demo/mock-news").then((m) => ({ default: m.MockNews })),
);

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
  const { snapshot, translate, startSpeech, stopSpeech } = useIkiraro();
  const camera = useHandTracking();
  const { start: startCamera, stop: stopCamera } = camera;

  const {
    selectedScene,
    setSelectedScene,
    avatarExpanded,
    setAvatarExpanded,
    textDraft,
    setTextDraft,
  } = useDemoStore();

  const { ttsProvider, setTtsProvider, visionEnabled } = usePlaygroundStore();

  const activeEnvelope = useDeferredValue(snapshot.lastEnvelope);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    tts.setConfig({ provider: ttsProvider });
  }, [ttsProvider]);

  useEffect(() => {
    if (visionEnabled) void startCamera();
    else stopCamera();
  }, [visionEnabled, startCamera, stopCamera]);

  const { mode: accessMode, setMode: setAccessMode, isAvatarSuppressed } = useAccessibilityMode();

  // Announce mode changes
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
    };
    audioQueue.speak(modeNames[accessMode], "critical");
  }, [accessMode]);

  // On-entry and scene-change announcement
  useEffect(() => {
    const msgs: Record<typeof selectedScene, string> = {
      store: `TechNova store. ${PRODUCTS.length} products available.`,
      news: `TechPulse news feed. ${ARTICLES.length} articles available.`,
    };
    const tid = setTimeout(() => audioQueue.speak(msgs[selectedScene], "normal"), 600);
    return () => clearTimeout(tid);
  }, [selectedScene]);

  const handleSend = () => {
    if (!textDraft.trim()) return;
    translate(textDraft);
    setTextDraft("");
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeech();
      setIsRecording(false);
    } else {
      startSpeech();
      setIsRecording(true);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-50 font-sans text-zinc-900 overflow-hidden dark:bg-zinc-950 dark:text-zinc-50">
      {/* 1. Main Viewport (App Content) */}
      <div className="relative flex-1 flex flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b px-6 bg-white dark:bg-zinc-900 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight">Ikiraro Demo</h1>
            <nav className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              <Button
                variant={selectedScene === "store" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedScene("store")}
                className="h-7 text-xs"
              >
                Store
              </Button>
              <Button
                variant={selectedScene === "news" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedScene("news")}
                className="h-7 text-xs"
              >
                News
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Settings</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="tts-provider">Speech Provider</Label>
                    <Select value={ttsProvider} onValueChange={(v) => setTtsProvider(v as any)}>
                      <SelectTrigger id="tts-provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web-speech">Web Speech (Browser)</SelectItem>
                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="access-mode">Accessibility Mode</Label>
                    <Select value={accessMode} onValueChange={(v) => setAccessMode(v as any)}>
                      <SelectTrigger id="access-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="audio-first">Audio-First (Blind)</SelectItem>
                        <SelectItem value="visual-first">Visual-First (Deaf)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="flex-1 relative overflow-hidden">
          <Suspense fallback={<div className="p-8">Loading scene...</div>}>
            {selectedScene === "store" ? <MockStorefront /> : <MockNews />}
          </Suspense>
        </main>

        <footer className="p-4 border-t bg-white dark:bg-zinc-900">
          <div className="max-w-3xl auto flex gap-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={toggleRecording}
              className={isRecording ? "animate-pulse" : ""}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Ask me anything..."
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={snapshot.isTranslating}>
              {snapshot.isTranslating ? (
                <div className="animate-spin mr-2">/</div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </footer>
      </div>

      {/* 2. Avatar Sidebar */}
      <div
        className={`relative border-l bg-white dark:bg-zinc-900 transition-all duration-500 ease-in-out ${
          avatarExpanded ? "w-[450px]" : "w-[320px]"
        } ${isAvatarSuppressed ? "hidden" : "flex flex-col"}`}
      >
        <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${snapshot.status === "translating" ? "bg-green-500 animate-pulse" : "bg-zinc-300"}`}
            />
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Sign Engine
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setAvatarExpanded(!avatarExpanded)}>
            {avatarExpanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-800">
          <AvatarViewer envelope={activeEnvelope} modelUrl={MODEL_URL} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
