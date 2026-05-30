import React from "react";
import { Mic } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface VoiceInputProps {
  onStart?: () => void;
  onStop?: () => void;
}

export function VoiceInput({
  className,
  onStart,
  onStop,
  ...props
}: React.ComponentProps<"div"> & VoiceInputProps) {
  const [listening, setListening] = React.useState(false);
  const [time, setTime] = React.useState(0);

  const onStartRef = React.useRef(onStart);
  const onStopRef = React.useRef(onStop);

  React.useEffect(() => {
    onStartRef.current = onStart;
    onStopRef.current = onStop;
  }, [onStart, onStop]);

  React.useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (listening) {
      onStartRef.current?.();
      intervalId = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      onStopRef.current?.();
      setTime(0);
    }
    return () => clearInterval(intervalId);
  }, [listening]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)} {...props}>
      <motion.button
        className="flex cursor-pointer items-center justify-center rounded-full border p-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
        layout
        transition={{ layout: { duration: 0.4 } }}
        onClick={() => setListening(!listening)}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
        aria-pressed={listening}
      >
        <div className="flex h-6 w-6 items-center justify-center">
          {listening ? (
            <motion.div
              className="bg-primary h-4 w-4 rounded-sm"
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          ) : (
            <Mic aria-hidden="true" />
          )}
        </div>
        <AnimatePresence mode="wait">
          {listening && (
            <motion.div
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="flex items-center justify-center gap-0.5" aria-hidden="true">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-primary w-0.5 rounded-full"
                    initial={{ height: 2 }}
                    animate={{
                      height: [2, 3 + Math.random() * 10, 3 + Math.random() * 5, 2],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              <div className="text-muted-foreground w-10 text-center text-xs tabular-nums">
                <span className="sr-only">Elapsed time: </span>
                {formatTime(time)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
