import { AvatarViewer, type RuntimeSnapshot, type TranslationEnvelope } from "@ikiraro/sdk";
import {
  RiAlertLine,
  RiArrowRightLine,
  RiMicLine,
  RiVolumeMuteLine,
  RiVolumeUpLine,
} from "@remixicon/react";
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";

interface ViewportProps {
  activeEnvelope: TranslationEnvelope | null;
  modelUrl: string;
  text: string;
  setText: (text: string) => void;
  isTranslating: boolean;
  handleSend: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  snapshot: RuntimeSnapshot;
}

export function Viewport({
  activeEnvelope,
  modelUrl,
  text,
  setText,
  isTranslating,
  handleSend,
  isMuted,
  setIsMuted,
  snapshot,
}: ViewportProps) {
  return (
    <main className="flex-1 flex flex-col relative bg-transparent">
      {/* 3D Scene */}
      <div className="flex-1 relative">
        <AvatarViewer
          envelope={activeEnvelope}
          modelUrl={modelUrl}
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

      {snapshot.error && (
        <div className="fixed bottom-12 right-12 z-50 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="bg-background border border-destructive/20 text-destructive text-[14px] font-light px-4 py-3 flex items-center gap-3 rounded-lg">
            <RiAlertLine className="size-4 opacity-70" />
            {snapshot.error}
          </div>
        </div>
      )}
    </main>
  );
}
