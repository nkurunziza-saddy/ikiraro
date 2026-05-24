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

export type SignNode = {
  gloss: string;
  role: "topic" | "action" | "object" | "modifier";
  emphasis: number;
  spatialAnchor?: string;
  tokenType?: "lexeme" | "fingerspell" | "number" | "pointing";
};

export type SignGraph = {
  intent: "statement" | "question" | "command";
  nodes: SignNode[];
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
  | "wave";

export type ArmTarget = {
  rArmX?: number;
  rArmZ?: number;
  rArmY?: number;
  rForeX?: number;
  rForeZ?: number;
  rForeY?: number;
  rHandX?: number;
  lArmX?: number;
  lArmZ?: number;
  lArmY?: number;
  lForeX?: number;
  lForeZ?: number;
  lForeY?: number;
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

export type TransitionType = "blend" | "crossfade" | "inertial";
export type Transition = {
  from: MotionType;
  to: MotionType;
  type: TransitionType;
  durationMs: number;
};
export type TransitionPlan = {
  entry: Transition | null;
  exit: Transition | null;
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
  getHandshape: (key: string) => any | null; // We use 'any' here temporarily to avoid circular deps with Handshape
  getLexemePose: (
    gloss: string,
  ) => { handshape: any; armTarget?: ArmTarget; motion: MotionType } | null;
}

export type CompiledSign = {
  id: string;
  bodyMotion: MotionType;
  motionClip?: string;
  handshape: string;
  facial: string;
  transitions: TransitionPlan;
  duration: number;
  spatialTarget?: { x: number; y: number; z: number };
  armTarget?: ArmTarget;
  emphasisCurve: "linear" | "accelerate" | "impact";
};

export type SpatialMemory = {
  self: { x: number; y: number; z: number };
  entities: Map<string, { x: number; y: number; z: number }>;
  createdAt: Map<string, number>;
};

export type MotionInstruction = {
  bodyMotion: MotionType;
  startTime: number;
  endTime: number;
  spatialTarget?: { x: number; y: number; z: number };
  armTarget?: ArmTarget;
  handshape: string;
  emphasisCurve: "linear" | "accelerate" | "impact";
  facial: string;
  coarticulationHint?: CoarticulationMode;
};

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
  instructions?: MotionInstruction[];
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
  faceLandmarks?: Point3D[];
  poseLandmarks?: Point3D[];
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
  minCandidateScore: number;
  scoreGapThreshold: number;
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
