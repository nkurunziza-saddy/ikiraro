import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import {
  SensaSurgicalClassifier,
  WebSpeechProvider,
  WordBuffer,
  evaluateHandGeometry,
  type CameraTrackingState,
} from "@sensa/communication";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const CAMERA_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 960 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 60 },
};
const FAST_WORD_BUFFER_OPTIONS = {
  pauseThresholdMs: 700,
  minSignDurationMs: 120,
} as const;
const MIN_HANDEDNESS_SCORE = 0.5;
const MIN_CLASSIFICATION_GEOMETRY_SCORE = 0.5;
const MIN_CLASSIFICATION_HAND_AREA = 0.005;
const MIN_STABLE_USABLE_FRAMES = 2;
const SIGNING_ZONE = {
  minX: 0.08,
  maxX: 0.92,
  minY: 0.06,
  maxY: 0.94,
} as const;

type MediaPipeCategory = {
  score?: number;
};

type MediaPipeHandResult = {
  landmarks?: CameraTrackingState["landmarks"][];
  handedness?: MediaPipeCategory[][];
};

const EMPTY_TRACKING: CameraTrackingState = {
  landmarks: [],
  classification: null,
  currentWord: "",
  sentence: [],
  sentenceText: "",
  committedWord: null,
};

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const videoFrameCallbackRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const classifierRef = useRef(new SensaSurgicalClassifier());
  const wordBufferRef = useRef(new WordBuffer(FAST_WORD_BUFFER_OPTIONS));
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const isActiveRef = useRef(false);
  const isDisposedRef = useRef(false);
  const usableFramesRef = useRef(0);
  const nonUsableFramesRef = useRef(0);
  const frameCounterRef = useRef(0);
  const lastFpsRef = useRef(0);
  const [tracking, setTracking] = useState<CameraTrackingState>(EMPTY_TRACKING);
  const [isReady, setIsReady] = useState(false);
  const [delegate, setDelegate] = useState<"GPU" | "CPU" | null>(null);
  const [fps, setFps] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readHandednessScore = (results: MediaPipeHandResult, index: number): number | null => {
    const score = results.handedness?.[index]?.[0]?.score;
    return typeof score === "number" ? score : null;
  };

  const stop = () => {
    isActiveRef.current = false;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const video = videoRef.current;
    if (
      videoFrameCallbackRef.current !== null &&
      video &&
      "cancelVideoFrameCallback" in video &&
      typeof video.cancelVideoFrameCallback === "function"
    ) {
      video.cancelVideoFrameCallback(videoFrameCallbackRef.current);
      videoFrameCallbackRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    lastVideoTimeRef.current = -1;
    usableFramesRef.current = 0;
    nonUsableFramesRef.current = 0;

    if (video) {
      video.pause();
      video.srcObject = null;
    }

    setIsActive(false);
    setFps(0);
  };

  const initializeLandmarker = useEffectEvent(async () => {
    if (handLandmarkerRef.current) {
      return;
    }

    if (initPromiseRef.current) {
      await initPromiseRef.current;
      return;
    }

    initPromiseRef.current = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      let lastError: unknown;

      for (const nextDelegate of ["GPU", "CPU"] as const) {
        try {
          const handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions:
              nextDelegate === "GPU"
                ? {
                    modelAssetPath: MODEL_ASSET_PATH,
                    delegate: "GPU",
                  }
                : {
                    modelAssetPath: MODEL_ASSET_PATH,
                  },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.55,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          if (isDisposedRef.current) {
            handLandmarker.close();
            return;
          }

          handLandmarkerRef.current = handLandmarker;
          setDelegate(nextDelegate);
          setIsReady(true);
          setError(null);
          return;
        } catch (nextError) {
          lastError = nextError;
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error("Unable to start the hand landmarker.");
    })();

    try {
      await initPromiseRef.current;
    } finally {
      initPromiseRef.current = null;
    }
  });

  const queueNextFrame = useEffectEvent(() => {
    if (!isActiveRef.current || isDisposedRef.current) {
      return;
    }

    const video = videoRef.current;
    if (
      video &&
      "requestVideoFrameCallback" in video &&
      typeof video.requestVideoFrameCallback === "function"
    ) {
      videoFrameCallbackRef.current = video.requestVideoFrameCallback(() => {
        videoFrameCallbackRef.current = null;
        scheduleFrame();
      });
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scheduleFrame);
  });

  const scheduleFrame = useEffectEvent(() => {
    if (!isActiveRef.current || isDisposedRef.current) {
      return;
    }

    const handLandmarker = handLandmarkerRef.current;
    const video = videoRef.current;

    if (!handLandmarker || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      queueNextFrame();
      return;
    }

    if (video.currentTime === lastVideoTimeRef.current) {
      queueNextFrame();
      return;
    }

    try {
      const now = performance.now();
      lastVideoTimeRef.current = video.currentTime;
      frameCounterRef.current += 1;
      if (now - lastFpsRef.current >= 1000) {
        setFps(frameCounterRef.current);
        frameCounterRef.current = 0;
        lastFpsRef.current = now;
      }

      const results = handLandmarker.detectForVideo(video, now) as MediaPipeHandResult;
      const landmarks = results.landmarks?.[0];
      const handednessScore = readHandednessScore(results, 0);
      const geometry = landmarks ? evaluateHandGeometry(landmarks) : null;
      const isInSigningZone =
        geometry !== null &&
        geometry.bounds.centerX >= SIGNING_ZONE.minX &&
        geometry.bounds.centerX <= SIGNING_ZONE.maxX &&
        geometry.bounds.centerY >= SIGNING_ZONE.minY &&
        geometry.bounds.centerY <= SIGNING_ZONE.maxY;
      const isUsableForClassification =
        Boolean(landmarks) &&
        geometry !== null &&
        geometry.score >= MIN_CLASSIFICATION_GEOMETRY_SCORE &&
        geometry.bounds.area >= MIN_CLASSIFICATION_HAND_AREA &&
        isInSigningZone &&
        (handednessScore === null || handednessScore >= MIN_HANDEDNESS_SCORE);

      if (landmarks && isUsableForClassification) {
        usableFramesRef.current += 1;
        nonUsableFramesRef.current = 0;
        if (usableFramesRef.current >= MIN_STABLE_USABLE_FRAMES) {
          const classification = classifierRef.current.process(landmarks);
          const committedWord = wordBufferRef.current.update(classification.sign);

          if (committedWord) {
            void WebSpeechProvider.getInstance()
              .speak(committedWord)
              .catch(() => undefined);
          }

          const state = wordBufferRef.current.getState();
          startTransition(() => {
            setTracking({
              landmarks,
              classification,
              currentWord: state.currentWord,
              sentence: state.sentence,
              sentenceText: state.sentenceText,
              committedWord,
            });
          });
          queueNextFrame();
          return;
        }

        const state = wordBufferRef.current.getState();
        startTransition(() => {
          setTracking({
            landmarks,
            classification: null,
            currentWord: state.currentWord,
            sentence: state.sentence,
            sentenceText: state.sentenceText,
            committedWord: null,
          });
        });
      } else if (landmarks) {
        usableFramesRef.current = 0;
        nonUsableFramesRef.current += 1;
        if (nonUsableFramesRef.current >= 4) {
          classifierRef.current.reset();
        }
        const state = wordBufferRef.current.getState();
        startTransition(() => {
          setTracking({
            landmarks,
            classification: null,
            currentWord: state.currentWord,
            sentence: state.sentence,
            sentenceText: state.sentenceText,
            committedWord: null,
          });
        });
      } else {
        usableFramesRef.current = 0;
        nonUsableFramesRef.current += 1;
        if (nonUsableFramesRef.current >= 2) {
          classifierRef.current.reset();
        }
        const committedWord = wordBufferRef.current.update(null);
        if (committedWord) {
          void WebSpeechProvider.getInstance()
            .speak(committedWord)
            .catch(() => undefined);
        }

        const state = wordBufferRef.current.getState();
        startTransition(() => {
          setTracking({
            landmarks: [],
            classification: null,
            currentWord: state.currentWord,
            sentence: state.sentence,
            sentenceText: state.sentenceText,
            committedWord,
          });
        });
      }
    } catch (nextError) {
      stop();
      setError(
        nextError instanceof Error ? nextError.message : "Unable to capture a camera frame.",
      );
      return;
    }

    queueNextFrame();
  });

  useEffect(() => {
    isDisposedRef.current = false;

    void initializeLandmarker().catch((nextError) => {
      if (isDisposedRef.current) {
        return;
      }

      setError(
        nextError instanceof Error ? nextError.message : "Unable to initialize camera recognition.",
      );
    });

    return () => {
      isDisposedRef.current = true;
      stop();
      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
      classifierRef.current.reset();
      wordBufferRef.current.clearAll();
      initPromiseRef.current = null;
      usableFramesRef.current = 0;
      nonUsableFramesRef.current = 0;
    };
  }, []);

  return {
    videoRef,
    tracking,
    isReady,
    delegate,
    fps,
    isActive,
    error,
    clear: () => {
      classifierRef.current.reset();
      wordBufferRef.current.clearAll();
      usableFramesRef.current = 0;
      nonUsableFramesRef.current = 0;
      setTracking(EMPTY_TRACKING);
      setError(null);
    },
    start: async () => {
      if (isActiveRef.current) {
        return;
      }

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This browser does not expose camera capture.");
        }

        await initializeLandmarker();
        if (!handLandmarkerRef.current) {
          throw new Error("Camera recognition is still starting. Try again in a moment.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: CAMERA_CONSTRAINTS,
        });

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          throw new Error("Camera element is unavailable.");
        }

        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            resolve();
            return;
          }

          const handleLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            resolve();
          };

          video.addEventListener("loadedmetadata", handleLoadedMetadata);
        });

        await video.play();
        isActiveRef.current = true;
        setIsActive(true);
        setError(null);
        frameCounterRef.current = 0;
        lastFpsRef.current = performance.now();
        lastVideoTimeRef.current = -1;
        queueNextFrame();
      } catch (nextError) {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        let errorMessage = "Unable to start the camera.";
        if (nextError instanceof DOMException) {
          if (nextError.name === "NotAllowedError") {
            errorMessage = "Please allow camera access in your browser settings.";
          } else if (nextError.name === "NotFoundError") {
            errorMessage = "No camera hardware detected.";
          } else if (nextError.name === "NotReadableError") {
            errorMessage = "Camera is already in use by another application.";
          }
        } else if (nextError instanceof Error) {
          errorMessage = nextError.message;
        }

        setError(errorMessage);
      }
    },
    stop,
  };
}
