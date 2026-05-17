export type {
  Point3D,
  HandLandmarks,
  FeatureVector,
  ClassificationResult,
  CameraTrackingState,
  ASLModelInterface,
} from "../types";

export interface HandshapeDefinition {
  name: string;
  fingerprint: string;
  requiresMotion?: boolean;
  disambiguate?: (vector: import("../types").FeatureVector) => number;
}

export interface ClassifierConfig {
  windowSize: number;
  rawScoreThreshold: number;
  lockThreshold: number;
  unlockThreshold: number;
  motionVelocityThreshold: number;
}

export interface WordBufferOptions {
  pauseThresholdMs: number;
  minSignDurationMs: number;
}

export interface BufferState {
  currentWord: string;
  sentence: string[];
  sentenceText: string;
}

// ─── Vision System ────────────────────────────────────────────────────────────

export type VisionStatus = "idle" | "starting" | "active" | "error";

export interface VisionEventMap {
  "status-change": VisionStatus;
  "tracking-update": import("../types").CameraTrackingState;
  "hand-found": { landmarks: import("../types").HandLandmarks };
  "hand-lost": void;
  "sign-detected": { sign: string; confidence: number };
  "word-committed": string;
  "buffer-update": { currentWord: string; sentenceText: string };
  "fps-update": number;
  error: string;
}

/**
 * Seam for hand landmark processing.
 * Usually implemented by a Web Worker to keep the main thread free.
 */
export interface HandProcessor {
  init(): Promise<void>;
  process(bitmap: ImageBitmap, timestamp: number): void;
  reset(): void;
  correct(sign: string): void;
  dispose(): void;
  onResult(cb: (tracking: import("../types").CameraTrackingState) => void): void;
  onError(cb: (error: string) => void): void;
  onReady(cb: (delegate: "GPU" | "CPU") => void): void;
}
