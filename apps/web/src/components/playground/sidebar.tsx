import type { CameraTrackingState } from "@ikiraro/engine/vision";
import {
  type AccessibilityMode,
  AudioVisualizer,
  HandOverlay,
  type RuntimeSnapshot,
  type TranslationEnvelope,
} from "@ikiraro/sdk";
import { RiCameraOffLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";
import {
  ChatExchange,
  ModeSelector,
  TokenStream,
  TopKLogits,
  WorkflowSteps,
} from "@/components/pieces";
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  ACCESSIBILITY_OPTIONS,
  PLAYGROUND_TABS,
  type PlaygroundTab,
  TTS_PROVIDER_OPTIONS,
  type TtsProvider,
} from "./constants";

interface SidebarProps {
  activeTab: PlaygroundTab;
  setActiveTab: (tab: PlaygroundTab) => void;
  isCameraActive: boolean;
  isRecording: boolean;
  toggleCamera: () => void;
  toggleRecording: () => void;
  videoRef: (el: HTMLVideoElement | null) => void;
  videoEl: HTMLVideoElement | null;
  tracking: CameraTrackingState;
  snapshot: RuntimeSnapshot;
  activeEnvelope: TranslationEnvelope | null;
  isTranslating: boolean;
  logs: string[];
  setLogs: (logs: string[]) => void;
  accessMode: AccessibilityMode;
  setAccessMode: (mode: AccessibilityMode) => void;
  ttsProvider: TtsProvider;
  setTtsProvider: (provider: TtsProvider) => void;
  ttsApiKey: string;
  setTtsApiKey: (key: string) => void;
  fps: number;
  delegate?: "GPU" | "CPU" | null;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isCameraActive,
  isRecording,
  toggleCamera,
  toggleRecording,
  videoRef,
  videoEl,
  tracking,
  snapshot,
  activeEnvelope,
  isTranslating,
  logs,
  setLogs,
  accessMode,
  setAccessMode,
  ttsProvider,
  setTtsProvider,
  ttsApiKey,
  setTtsApiKey,
  fps,
  delegate,
}: SidebarProps) {
  return (
    <aside className="w-[320px] border-r border-border flex flex-col shrink-0 relative z-10 bg-background/50 backdrop-blur-md">
      {/* Branding Header */}
      <div className="px-5 py-6 shrink-0">
        <Link to="/" className="text-[15px] font-medium">
          ikiraro
        </Link>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as PlaygroundTab)}>
        <div className="p-2.5">
          <TabsList>
            {PLAYGROUND_TABS.map((tab) => (
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
                  ref={videoRef}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300 scale-x-[-1]",
                    isCameraActive ? "opacity-40" : "opacity-0",
                  )}
                  autoPlay
                  playsInline
                  muted
                />
                {isCameraActive && <HandOverlay tracking={tracking} video={videoEl} />}
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
              <div className="text-[13px] font-medium text-foreground mb-2">Building sentence</div>
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
              <div className="text-[13px] font-medium text-foreground mb-3">Accessibility mode</div>
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
                  onValueChange={(val) => setTtsProvider(val as TtsProvider)}
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
  );
}
