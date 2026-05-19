// ─── Communication ────────────────────────────────────────────────────────────

export type CommunicationMode = "speech" | "text" | "sign-keys" | "camera-fingerspell";
export type TranslationTrack = "semantic" | "deterministic";
export type PlanningStrategy = "semantic" | "deterministic";

// ─── STT ─────────────────────────────────────────────────────────────────────

export const STT_MODELS = ["whisper-large-v3", "whisper-large-v3-turbo"] as const;
export type SttModel = (typeof STT_MODELS)[number];

export function isSttModel(value: string | null | undefined): value is SttModel {
  return Boolean(value && (STT_MODELS as readonly string[]).includes(value));
}

// ─── Token primitives ─────────────────────────────────────────────────────────

export type TokenStability = "draft" | "stable" | "committed";

/**
 * The IkiraroToken is the unified domain object for all conversational input.
 * It encapsulates value, source, and lifecycle data, enabling deep fusion.
 */
export interface IkiraroToken {
  id: string;
  value: string;
  type: "sign" | "speech" | "text" | "control";
  source: string;
  timestamp: number;
  confidence: number;
  stability: TokenStability;
  correlationId?: string; // Links related tokens (e.g., a draft and its committed version)
  metadata?: Record<string, any>;
}

export const EMPHASIS_LEVELS = ["low", "normal", "high"] as const;
export const FACIAL_EXPRESSIONS = [
  "neutral",
  "inquisitive",
  "assertive",
  "urgent",
  "empathetic",
] as const;

export type EmphasisLevel = (typeof EMPHASIS_LEVELS)[number];
export type FacialExpression = (typeof FACIAL_EXPRESSIONS)[number];

export type CoarticulationMode = "blend" | "snap" | "none";

export type BaseToken = {
  durationMs: number;
  emphasis: EmphasisLevel;
  facialExpression?: FacialExpression;
  coarticulationHint?: CoarticulationMode;
};

export type LexemeToken = BaseToken & { type: "lexeme"; lexemeId: string };
export type FingerspellToken = BaseToken & { type: "fingerspell"; text: string };
export type NumberToken = BaseToken & { type: "number"; value: string };
export type PointingToken = BaseToken & { type: "pointing"; target: string };
export type PauseToken = { type: "pause"; durationMs: number };
export type SignToken = LexemeToken | FingerspellToken | NumberToken | PauseToken | PointingToken;

export type SignClause = {
  intent: string;
  tokens: SignToken[];
};

// ─── Sign plan ────────────────────────────────────────────────────────────────

export type SignPlan = {
  sourceText: string;
  normalizedText: string;
  glossText: string;
  track: TranslationTrack;
  strategy: PlanningStrategy;
  clauses: SignClause[];
  metadata: {
    confidence: number;
    reviewNeeded: boolean;
    notes: string[];
  };
};

// ─── Renderer Queue ──────────────────────────────────────────────────────────

export type MotionType =
  | "none"
  | "shake"
  | "arc"
  | "tap"
  | "circle"
  | "z-trace"
  | "j-trace"
  | "g-push"
  | "h-slide"
  | "d-arc"
  | "n-dip"
  | "k-push";

// Per-sign dominant-arm override (deltas from the generic SIGN pose).
export type ArmTarget = {
  rArmX?: number;
  rArmZ?: number;
  rArmY?: number;
  rForeX?: number;
  rForeZ?: number;
  rForeY?: number;
  rHandX?: number;
};

export type FrameItem = {
  type: "lexeme" | "fingerspell" | "number" | "pause" | "pointing";
  value: string;
  label: string;
  sublabel?: string;
  duration: number;
  motion?: MotionType;
  armTarget?: ArmTarget;
  facialExpression?: string;
  coarticulation?: CoarticulationMode;
};

// ─── Speech intake ────────────────────────────────────────────────────────────

export type SpeechWordTiming = {
  word: string;
  start: number;
  end: number;
  confidence?: number;
};

export type SpeechSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

export type SpeechIntake = {
  model: SttModel;
  text: string;
  language: string | null;
  durationSeconds: number | null;
  prompt: string;
  words: SpeechWordTiming[];
  segments: SpeechSegment[];
};

// ─── Translation context ──────────────────────────────────────────────────────

export type TranslationContext = {
  conversationId?: string;
  previousTurns?: Array<{ role: "hearing" | "signer"; text: string }>;
  locale?: string;
};

// ─── Two-layer output ─────────────────────────────────────────────────────────

export type SemanticIntent = {
  rawGloss: string;
  glossTokens: string[];
  confidence: number;
  model: string;
  promptTokens?: number;
};

export type TranslationEnvelope = {
  mode: CommunicationMode;
  intake: SpeechIntake | null;
  plan: SignPlan;
  rendererQueue: FrameItem[];
  rawInput: string;
  normalizedText: string;
  intent?: SemanticIntent;
};

// ─── Vision types ─────────────────────────────────────────────────────────────

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type HandLandmarks = Point3D[];

export interface FeatureVector {
  isValid: boolean;
  fingerStates: [boolean, boolean, boolean, boolean, boolean];
  fingerCurls: [number, number, number, number, number];
  thumbToIndexDist: number;
  thumbToMiddleDist: number;
  thumbToPinkyDist: number;
  indexMiddleSpread: number;
  ringPinkySpread: number;
  palmOrientation: number;
  thumbPosition: number;
  /** Z of thumb tip minus mean Z of finger PIPs. Negative = thumb in front (ASL S); positive = thumb behind/tucked (M, N, A, T). */
  thumbVsFingerDepth: number;
  fingerAngles: [number, number, number, number, number];
  wristAngle: number;
  fingerprint: string;
  spatialZone: "chest" | "face" | "chin" | "forehead" | "neutral";
  velocity: Point3D;
  isMoving: boolean;
}

export interface ClassificationResult {
  sign: string | null;
  confidence: number;
  vector: FeatureVector;
  candidates: Array<{ name: string; score: number }>;
  isTransitioning?: boolean;
  gesture?: "double-letter-slide" | "double-letter-bounce" | "none";
}

export interface IFeatureExtractor {
  extract(landmarks: HandLandmarks, imageLandmarks?: HandLandmarks): FeatureVector;
}

export interface ISignMatcher {
  match(vector: FeatureVector): Array<{ name: string; score: number }>;
}

export interface ITemporalSmoother {
  smooth(candidates: Array<{ name: string; score: number }>): {
    sign: string | null;
    confidence: number;
  };
  reset(): void;
}

export interface ILandmarkSmoother {
  smooth(landmarks: HandLandmarks): HandLandmarks;
  getVelocity(): Point3D;
  reset(): void;
}

export interface IGestureDetector {
  update(velocity: Point3D): {
    type: "double-letter-slide" | "double-letter-bounce" | "none";
    confidence: number;
  };
  reset(): void;
}

export interface ITransitionDetector {
  isTransitioning(velocity: Point3D, confidence: number): boolean;
  reset(): void;
}

export interface VisionPipelineConfig {
  smoother: ILandmarkSmoother;
  extractor: IFeatureExtractor;
  matcher: ISignMatcher;
  temporal: ITemporalSmoother;
  gesture: IGestureDetector;
  transition: ITransitionDetector;
  motionVelocityThreshold: number;
}

export type CameraTrackingState = {
  landmarks: HandLandmarks;
  classification: ClassificationResult | null;
  currentWord: string;
  sentence: string[];
  sentenceText: string;
  committedToken: SignToken | null;
};

export interface HandshapeDefinition {
  name: string;
  fingerprint: string;
  requiresMotion?: boolean;
  disambiguate?: (vector: FeatureVector) => number;
}

export interface ClassifierConfig {
  windowSize: number;
  rawScoreThreshold: number;
  lockThreshold: number;
  unlockThreshold: number;
  motionVelocityThreshold: number;
}

export interface ASLModelInterface {
  readonly name: string;
  load(): Promise<void>;
  isLoaded(): boolean;
  classify(landmarks: HandLandmarks): Promise<ClassificationResult>;
}
