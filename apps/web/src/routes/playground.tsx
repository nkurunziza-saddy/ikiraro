import { AudioVisualizer, AvatarViewer, HandOverlay, WebSpeechProvider } from "@ikiraro/renderer";
import { useAccessibilityMode } from "@ikiraro/runtime/accessibility";
import { AudioQueue } from "@ikiraro/runtime/audio";
import { useHandTracking } from "@ikiraro/runtime/hand-tracking";
import {
  RiAlertLine,
  RiArrowRightLine,
  RiCameraOffLine,
  RiHistoryLine,
  RiMicLine,
  RiPulseLine,
  RiSettings3Line,
  RiTerminalBoxLine,
  RiVolumeMuteLine,
  RiVolumeUpLine,
} from "@remixicon/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { ChatExchange } from "@/components/pieces/chat-exchange";
import { ModeSelector } from "@/components/pieces/mode-selector";
import { TokenStream } from "@/components/pieces/token-stream";
import { TopKLogits } from "@/components/pieces/top-k-logits";
import { WorkflowSteps } from "@/components/pieces/workflow-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  { id: "stream", icon: RiPulseLine, label: "Live stream" },
  { id: "metadata", icon: RiTerminalBoxLine, label: "Engine logs" },
  { id: "history", icon: RiHistoryLine, label: "History" },
  { id: "settings", icon: RiSettings3Line, label: "Settings" },
] as const;

const ACCESSIBILITY_OPTIONS = [
  {
    value: "standard",
    label: "Standard",
    description: "Balanced experience for everyday use.",
  },
  {
    value: "audio-first",
    label: "Audio first",
    description: "Prioritizes spoken cues and audio feedback.",
  },
  {
    value: "visual-first",
    label: "Visual first",
    description: "Emphasizes visual indicators and captions.",
  },
] as const;

const TTS_PROVIDER_OPTIONS = [
  {
    value: "browser",
    label: "Browser voice",
    description: "Use the device's built-in speech synthesis.",
  },
  {
    value: "openai",
    label: "OpenAI TTS",
    description: "Use OpenAI speech synthesis.",
  },
  {
    value: "elevenlabs",
    label: "ElevenLabs",
    description: "Use ElevenLabs voice synthesis.",
  },
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
  const [ttsProvider, setTtsProvider] = useState<"browser" | "openai" | "elevenlabs">("browser");
  const [ttsApiKey, setTtsApiKey] = useState("");

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
      setLogs((prev) => [snapshot.lastEnvelope?.normalizedText ?? "", ...prev].slice(0, 20));
    }
  }, [snapshot.lastEnvelope]);

  useEffect(() => {
    tts.setConfig({
      provider: ttsProvider,
      apiKey: ttsApiKey || undefined,
    });
  }, [ttsProvider, ttsApiKey]);

  const lastCommittedRef = useRef<object | null>(null);
  useEffect(() => {
    const token = tracking.committedToken;
    if (!token || token === lastCommittedRef.current) return;
    lastCommittedRef.current = token;
    const word =
      token.type === "fingerspell" ? token.text : token.type === "number" ? token.value : "";
    if (!word) return;
    setText((prev) => (prev ? `${prev} ${word}` : word));
    setLogs((prev) => [`signed: ${word}`, ...prev].slice(0, 20));
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
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[320px] border-r border-border flex flex-col shrink-0 relative z-10 bg-background/50 backdrop-blur-md">
        {/* Branding Header */}
        <div className="px-5 py-6 shrink-0">
          <Link to="/" className="text-[15px] font-medium">
            ikiraro
          </Link>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as Tab)}>
          <div className="p-2.5">
            <TabsList>
              {TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <Separator />

          <div className="p-2.5">
            <TabsContent value="stream" className="space-y-3">
              <div>
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={isCameraActive ? "default" : "secondary"}
                    size="sm"
                    onClick={toggleCamera}
                    className="font-normal text-xs"
                  >
                    Camera
                  </Button>
                  <Button
                    variant={isRecording ? "default" : "secondary"}
                    size="sm"
                    onClick={toggleRecording}
                    className="font-normal text-xs"
                  >
                    Microphone
                  </Button>
                </div>
                <div className="aspect-video relative overflow-hidden bg-foreground/[0.02] border border-border rounded-lg">
                  <video
                    ref={(el) => {
                      videoElRef.current = el;
                      videoRef(el);
                    }}
                    className={cn(
                      "w-full h-full object-cover transition-opacity duration-300 scale-x-[-1]",
                      isCameraActive ? "opacity-40" : "opacity-0",
                    )}
                    autoPlay
                    playsInline
                    muted
                  />
                  {isCameraActive && <HandOverlay tracking={tracking} video={videoElRef.current} />}
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
                      <RiCameraOffLine className="size-5 stroke-[1.5]" />
                      <span className="text-[12px] font-light">Standby</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recognition (TopKLogits) */}
              <div className="">
                <TopKLogits
                  title="current sign"
                  context="Visual inference confidence"
                  topPrefix="top"
                  tokens={
                    tracking.classification?.sign
                      ? [
                          {
                            token: tracking.classification.sign,
                            probability: tracking.classification.confidence,
                          },
                        ]
                      : []
                  }
                />
              </div>

              {/* Buffer */}
              <div>
                <div className="text-[13px] font-medium text-foreground mb-2">
                  Building sentence
                </div>
                <Card>
                  <CardContent className="p-3 text-[14px] font-light text-muted-foreground leading-relaxed italic">
                    {tracking.sentenceText
                      ? `"${tracking.sentenceText}"`
                      : "Waiting for you to sign..."}
                  </CardContent>
                </Card>
              </div>

              {/* Audio visualizer */}
              <div>
                <div className="text-[13px] font-medium text-foreground mb-2">Voice level</div>
                <Card className="h-10 overflow-hidden">
                  <AudioVisualizer
                    level={snapshot.speechLevel}
                    className="w-full h-full opacity-40"
                  />
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-3">
              <WorkflowSteps
                steps={[
                  {
                    label: "Vision/Acoustic Ingestion",
                    status: isCameraActive || isRecording ? "active" : "done",
                  },
                  {
                    label: "Linguistic Engine",
                    status: isTranslating ? "active" : "pending",
                  },
                  {
                    label: `Layer: ${activeEnvelope?.plan.track || "idle"}`,
                    status: activeEnvelope ? "active" : "pending",
                  },
                  {
                    label: `Movement: ${activeEnvelope?.plan.strategy || "idle"}`,
                    status: activeEnvelope ? "active" : "pending",
                  },
                ]}
              />

              <TokenStream
                tokens={
                  activeEnvelope?.plan.glossText?.split(" ").filter(Boolean) || [
                    "waiting",
                    "for",
                    "input",
                  ]
                }
                tone="violet"
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[13px] font-medium text-foreground">Recent translations</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogs([])}
                  className="h-6 text-xs text-muted-foreground/60"
                >
                  Clear
                </Button>
              </div>

              {logs.length === 0 && (
                <div className="text-[14px] font-light text-muted-foreground/50 italic">
                  Nothing translated yet.
                </div>
              )}

              <div className="space-y-3">
                {logs.map((log, i) => (
                  <ChatExchange key={i} user={log} assistant="Translated successfully." />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-3">
              <div>
                <div className="text-[13px] font-medium text-foreground mb-3">
                  Accessibility mode
                </div>
                <div className="space-y-2">
                  <ModeSelector
                    value={accessMode}
                    items={ACCESSIBILITY_OPTIONS.map((option) => ({
                      ...option,
                      description: option.value === accessMode ? "Active mode" : option.description,
                    }))}
                    onSelect={(value) => setAccessMode(value as any)}
                    className={cn("cursor-pointer transition-opacity", accessMode && "opacity-100")}
                  />
                </div>
              </div>

              <div>
                <div className="text-[13px] font-medium text-foreground mb-3">Text-to-speech</div>
                <div className="space-y-3">
                  <label
                    htmlFor="tts-provider-select"
                    className="block text-[12px] text-muted-foreground/80"
                  >
                    Provider
                  </label>
                  <Select
                    value={ttsProvider}
                    onValueChange={(val) =>
                      setTtsProvider(val as "browser" | "openai" | "elevenlabs")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {TTS_PROVIDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[12px] text-muted-foreground/70">
                    Browser uses your device voice. OpenAI and ElevenLabs require your API key.
                  </p>

                  {ttsProvider !== "browser" && (
                    <>
                      <label
                        htmlFor="tts-api-key"
                        className="block text-[12px] text-muted-foreground/80"
                      >
                        API key
                      </label>
                      <Input
                        id="tts-api-key"
                        type="password"
                        value={ttsApiKey}
                        onChange={(event) => setTtsApiKey(event.target.value)}
                        placeholder={ttsProvider === "openai" ? "sk-..." : "elevenlabs key"}
                      />
                    </>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[13px] font-medium text-foreground mb-2">Performance</div>
                <Card>
                  <CardContent className="grid grid-cols-[100px_1fr] gap-y-2 text-[14px] font-light p-3">
                    <span className="text-muted-foreground/70">Renderer</span>
                    <span className="text-foreground">{delegate ?? "idle"}</span>
                    <span className="text-muted-foreground/70">Framerate</span>
                    <span className="text-foreground">{fps}</span>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </aside>

      {/* Viewport */}
      <main className="flex-1 flex flex-col relative bg-transparent">
        {/* 3D Scene */}
        <div className="flex-1 relative">
          <AvatarViewer
            envelope={activeEnvelope}
            modelUrl={MODEL_URL}
            zoom={0.75}
            className="w-full h-full absolute inset-0"
          />
          {activeEnvelope && (
            <div className="absolute bottom-32 left-0 w-full px-12 text-center pointer-events-none">
              <p className="text-[26px] font-light tracking-tight text-foreground">
                {activeEnvelope.normalizedText}
              </p>
            </div>
          )}
        </div>

        {/* Floating Chat Input */}
        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 pt-24 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-4 pointer-events-auto">
            <div className="flex w-full items-end gap-3">
              <InputGroup>
                <InputGroupTextarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message to translate..."
                  disabled={isTranslating}
                  className="flex-1"
                />
                <InputGroupAddon align="block-end">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label="Voice message"
                          className="rounded-full"
                          size="icon-sm"
                          variant="ghost"
                        />
                      }
                    >
                      <RiMicLine />
                    </TooltipTrigger>
                    <TooltipContent>Record voice message</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button size="icon-sm" variant="ghost" onClick={() => setIsMuted(!isMuted)}>
                          {isMuted ? <RiVolumeMuteLine /> : <RiVolumeUpLine />}
                        </Button>
                      }
                    >
                      <RiMicLine />
                    </TooltipTrigger>
                    <TooltipContent>Mute sound</TooltipContent>
                  </Tooltip>

                  <InputGroupText className="ml-auto text-muted-foreground text-xs">
                    Press Enter to send
                  </InputGroupText>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label="Send message"
                          className="rounded-full"
                          size="icon-sm"
                          onClick={handleSend}
                          disabled={isTranslating}
                        />
                      }
                    >
                      <RiArrowRightLine />
                    </TooltipTrigger>
                    <TooltipContent>Send</TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </div>
      </main>

      {snapshot.error && (
        <div className="fixed bottom-12 right-12 z-50 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="bg-background border border-destructive/20 text-destructive text-[14px] font-light px-4 py-3 flex items-center gap-3 rounded-lg">
            <RiAlertLine className="size-4 opacity-70" />
            {snapshot.error}
          </div>
        </div>
      )}
    </div>
  );
}
