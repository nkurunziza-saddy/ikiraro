import { AvatarViewer, type RuntimeSnapshot, type TranslationEnvelope } from "@ikiraro/sdk";
import {
  RiAlertLine,
  RiArrowRightLine,
  RiMicLine,
  RiVolumeMuteLine,
  RiVolumeUpLine,
} from "@remixicon/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
  TextEffect,
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
        <AnimatePresence>
          {activeEnvelope && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }}
              className="absolute bottom-32 left-0 w-full px-6 md:px-12 text-center pointer-events-none"
            >
              <TextEffect
                preset="fade-in-blur"
                per="word"
                className="text-[20px] md:text-[26px] font-light tracking-tight text-foreground"
              >
                {activeEnvelope.normalizedText}
              </TextEffect>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chat Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] as any }}
        className="absolute bottom-4 md:bottom-0 left-0 w-full px-4 md:px-8 pb-4 md:pb-8 pt-24 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none"
      >
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
                placeholder="Type a message..."
                disabled={isTranslating}
                className="flex-1 min-h-[44px]"
              />
              <InputGroupAddon align="block-end" className="hidden sm:flex">
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

              {/* Mobile-only send button */}
              <div className="flex sm:hidden items-center px-2 pb-2">
                <Button
                  aria-label="Send message"
                  className="rounded-full size-8"
                  size="icon"
                  onClick={handleSend}
                  disabled={isTranslating}
                >
                  <RiArrowRightLine className="size-4" />
                </Button>
              </div>
            </InputGroup>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {snapshot.error && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] as any }}
            className="fixed bottom-12 right-12 z-50"
          >
            <div className="bg-background border border-destructive/20 text-destructive text-[14px] font-light px-4 py-3 flex items-center gap-3 rounded-lg shadow-xl shadow-destructive/5 backdrop-blur-sm">
              <RiAlertLine className="size-4 opacity-70" />
              {snapshot.error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
