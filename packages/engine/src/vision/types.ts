import type {
  ASLModelInterface,
  CameraTrackingState,
  ClassificationResult,
  HandLandmarks,
  ILandmarkSmoother,
  Point3D,
  SignToken,
} from "../types";

export type {
  ASLModelInterface,
  CameraTrackingState,
  ClassificationResult,
  HandLandmarks,
  ILandmarkSmoother,
  Point3D,
};

export interface BufferState {
  currentWord: string;
  sentence: string[];
  sentenceText: string;
}
export interface WordBufferContext {
  isTransitioning?: boolean;
  confidence?: number;
  velocity?: import("../types").Point3D;
  isPlateauReached?: boolean;
}

/**
 * Extension seam for the LinguisticBuffer.
 *
 * Each strategy receives every sign detection and decides when to commit a token.
 * Built-in adapters: FingerspellStrategy (single letters), LexemeStrategy (whole words).
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

/**
 * Seam for sign recognition from hand landmarks.
 * Implement this to plug in different detection models (surgical, ML, etc.)
 */
export interface SignRecognizer {
  process(worldLandmarks: HandLandmarks, imageLandmarks?: HandLandmarks): ClassificationResult;
  reset(): void;
}

export type VisionStatus = "idle" | "starting" | "active" | "error";

export interface VisionEventMap {
  "status-change": VisionStatus;
  "tracking-update": import("../types").CameraTrackingState;
  "hand-found": { landmarks: import("../types").HandLandmarks };
  "hand-lost": undefined;
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
  onResult(cb: (tracking: import("../types").CameraTrackingState) => void): () => void;
  onError(cb: (error: string) => void): () => void;
  onReady(cb: (delegate: "GPU" | "CPU") => void): () => void;
}
