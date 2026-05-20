import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VisionSystem } from "../runtime/vision-system";
import type { CameraTrackingState, VisionStatus } from "@ikiraro/engine/vision";
import { WorkerHandProcessor } from "../capture/worker-hand-processor";

const EMPTY_TRACKING: CameraTrackingState = {
  landmarks: [],
  classification: null,
  currentWord: "",
  sentence: [],
  sentenceText: "",
  committedToken: null,
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
    processor.onReady((d: "GPU" | "CPU") => {
      setDelegate(d);
      setIsReady(true);
      setError(null);
    });

    vision.on("status-change", (s: VisionStatus) => {
      setIsActive(s === "active");
    });

    vision.on("fps-update", (f: number) => setFps(f));
    vision.on("error", (e: string) => setError(e));

    // Sync high-frequency tracking data
    vision.on("tracking-update", (t: CameraTrackingState) => {
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

  const start = useCallback(async () => {
    if (!videoElRef.current) {
      setError("Camera element is not mounted.");
      return;
    }
    try {
      await vision.start(videoElRef.current);
    } catch {
      // Error already handled by vision event listener
    }
  }, [vision]);

  const stop = useCallback(() => {
    vision.stop();
  }, [vision]);

  const clear = useCallback(() => {
    vision.reset();
    setTracking(EMPTY_TRACKING);
  }, [vision]);

  const manualCorrect = useCallback(
    (sign: string) => {
      vision.manualCorrect(sign);
    },
    [vision],
  );

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
}
