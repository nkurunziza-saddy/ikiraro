import { VisionSystem, type CameraTrackingState } from "@sensa/engine/vision";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkerHandProcessor } from "./worker-hand-processor";

const EMPTY_TRACKING: CameraTrackingState = {
  landmarks: [],
  classification: null,
  currentWord: "",
  sentence: [],
  sentenceText: "",
  committedWord: null,
};

/**
 * React adapter for the VisionSystem.
 * Provides a thin, reactive layer over the deep VisionSystem module.
 */
export function useHandTracking() {
  const [tracking, setTracking] = useState<CameraTrackingState>(EMPTY_TRACKING);
  const [isReady, setIsReady] = useState(false);
  const [delegate, setDelegate] = useState<"GPU" | "CPU" | null>(null);
  const [fps, setFps] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoElRef = useRef<HTMLVideoElement | null>(null);

  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
  }, []);

  // Maintain singleton-ish instances for the lifetime of the hook.
  const processor = useMemo(() => new WorkerHandProcessor(), []);
  const vision = useMemo(() => new VisionSystem(processor), [processor]);

  useEffect(() => {
    // Sync status and metadata
    processor.onReady((d) => {
      setDelegate(d);
      setIsReady(true);
      setError(null);
    });

    vision.on("status-change", (s) => {
      setIsActive(s === "active");
    });

    vision.on("fps-update", (f) => setFps(f));
    vision.on("error", (e) => setError(e));

    // Sync high-frequency tracking data
    vision.on("tracking-update", (t) => {
      startTransition(() => {
        setTracking(t);
      });
    });

    // Start booting the worker immediately on mount
    processor.init().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to initialize worker");
    });

    return () => {
      vision.stop();
      processor.dispose();
    };
  }, [vision, processor]);

  const start = async () => {
    if (!videoElRef.current) {
      setError("Camera element is not mounted.");
      return;
    }
    try {
      await vision.start(videoElRef.current);
    } catch {
      // Error already handled by vision event listener
    }
  };

  const stop = () => {
    vision.stop();
  };

  const clear = () => {
    vision.reset();
    setTracking(EMPTY_TRACKING);
  };

  const manualCorrect = (sign: string) => {
    vision.manualCorrect(sign);
  };

  return {
    videoRef,
    tracking,
    isReady,
    delegate,
    fps,
    isActive,
    error,
    clear,
    manualCorrect,
    start,
    stop,
  };
}
