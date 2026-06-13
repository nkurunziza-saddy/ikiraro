import type { Handshape } from "./planning/pose-library";

export type CommunicationMode = "speech" | "text" | "sign-keys" | "camera-fingerspell";
export type TranslationTrack = "semantic" | "deterministic";
export type PlanningStrategy = "semantic" | "deterministic";

export const STT_MODELS = ["whisper-large-v3", "whisper-large-v3-turbo"] as const;
export type SttModel = (typeof STT_MODELS)[number];
export function isSttModel(value: string | null | undefined): value is SttModel {
  return Boolean(value && (STT_MODELS as readonly string[]).includes(value));
}

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
  correlationId?: string;
  metadata?: Record<string, unknown>;
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

export type MotionType =
  | "none"
  | "shake"
  | "arc"
  | "salute"
  | "forward-push"
  | "outward-sweep"
  | "pull-back"
  | "chest-pat"
  | "two-hand-tap"
  | "music-sweep"
  | "wrist-twist"
  | "tap"
  | "circle"
  | "z-trace"
  | "j-trace"
  | "g-push"
  | "h-slide"
  | "d-arc"
  | "n-dip"
  | "k-push"
  | "wave"
  | "fs-pulse";

export type ArmTarget = {
  rArmX?: number;
  rArmZ?: number;
  rArmY?: number;
  rForeX?: number;
  rForeY?: number;
  rForeZ?: number;
  rHandX?: number;
  lArmX?: number;
  lArmZ?: number;
  lArmY?: number;
  lForeX?: number;
  lForeY?: number;
  lForeZ?: number;
  lHandX?: number;
};
export type FrameItem = {
  type: "lexeme" | "fingerspell" | "number" | "pause" | "pointing";
  value: string;
  label: string;
  sublabel?: string;
  duration: number;
  motion?: MotionType;
  motionClip?: string;
  armTarget?: ArmTarget;
  facialExpression?: string;
  coarticulation?: CoarticulationMode;
};

export interface SignLanguagePlugin {
  id: string;
  name: string;

  // Rules for NLP tokenization & parsing
  nlp: {
    questionWords: Set<string>;
    pronouns: Record<string, string>;
    actionWords: Set<string>;
    modifierWords: Set<string>;
  };

  // Alphabet & number motions
  fingerspellMotions: Partial<Record<string, MotionType>>;
  numberMotions: Partial<Record<string, MotionType>>;
  numberArmTarget: ArmTarget;

  // Handshapes and Lexicon
  getHandshape: (key: string) => Handshape | null;
  getLexemePose: (gloss: string) => {
    handshape: Handshape;
    armTarget?: ArmTarget;
    motion: MotionType;
  } | null;
}

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

export type TranslationContext = {
  conversationId?: string;
  previousTurns?: Array<{ role: "hearing" | "signer"; text: string }>;
  locale?: string;
};

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

export interface Point3D {
  x: number;
  y: number;
  z: number;
}
export type HandLandmarks = Point3D[];

export interface ClassificationResult {
  sign: string | null;
  confidence: number;
  candidates: Array<{ name: string; score: number }>;
  velocity: Point3D;
  isMoving: boolean;
  isTransitioning?: boolean;
}

export interface ILandmarkSmoother {
  smooth(landmarks: HandLandmarks): HandLandmarks;
  getVelocity(): Point3D;
  reset(): void;
}

export type CameraTrackingState = {
  landmarks: HandLandmarks;
  faceLandmarks?: Point3D[];
  poseLandmarks?: Point3D[];
  classification: ClassificationResult | null;
  currentWord: string;
  sentence: string[];
  sentenceText: string;
  committedToken: SignToken | null;
};

export interface ASLModelInterface {
  readonly name: string;
  load(): Promise<void>;
  isLoaded(): boolean;
  classify(landmarks: HandLandmarks): Promise<ClassificationResult>;
}
