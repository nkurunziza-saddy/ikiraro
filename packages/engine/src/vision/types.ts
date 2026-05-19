export type {
  Point3D,
  HandLandmarks,
  FeatureVector,
  ClassificationResult,
  CameraTrackingState,
  ASLModelInterface,
  IFeatureExtractor,
  ISignMatcher,
  ITemporalSmoother,
  ILandmarkSmoother,
  IGestureDetector,
  ITransitionDetector,
  VisionPipelineConfig,
  HandshapeDefinition,
  ClassifierConfig,
} from "../types";

export interface WordBufferOptions {
  pauseThresholdMs: number;
  minSignDurationMs: number;
}

export interface BufferState {
  currentWord: string;
  sentence: string[];
  sentenceText: string;
}

export interface WordBufferContext {
  isTransitioning?: boolean;
  gesture?: "double-letter-slide" | "double-letter-bounce" | "none";
  confidence?: number;
}

import type { SignToken } from "../types";

/**
 * Extension seam for the LinguisticBuffer.
 *
 * Each strategy receives every sign detection and decides when to commit a token.
 * Built-in adapters: FingerspellStrategy (single letters), LexemeStrategy (whole words).
 * Add a new strategy to handle a new sign type (numbers, compounds, classifiers, etc.)
 * and pass it via LinguisticBufferConfig.strategies.
 */
export interface ILinguisticStrategy {
  readonly name: string;
  update(sign: string, context: WordBufferContext): SignToken | null;
  commit?(): SignToken | null;
  reset(): void;
  /** Returns the in-progress (uncommitted) text for this strategy, if any. */
  getInProgress?(): string;
  /** Replaces the last accumulated character — used for manual correction. */
  overrideLast?(sign: string): void;
}

export interface LinguisticBufferConfig {
  strategies: ILinguisticStrategy[];
  pauseThresholdMs: number;
}

// ─── Vision System ────────────────────────────────────────────────────────────

export type VisionStatus = "idle" | "starting" | "active" | "error";

export interface VisionEventMap {
  "status-change": VisionStatus;
  "tracking-update": import("../types").CameraTrackingState;
  "hand-found": { landmarks: import("../types").HandLandmarks };
  "hand-lost": void;
  "sign-detected": { sign: string; confidence: number };
  "word-committed": import("../types").SignToken;
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
