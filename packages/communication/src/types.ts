import type { ClassificationResult, HandLandmarks } from "@sensa/shared";

export const TRANSLATION_DOMAINS = ["general", "support", "healthcare", "education"] as const;
export const PLANNER_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"] as const;
export const STT_MODELS = ["whisper-large-v3", "whisper-large-v3-turbo"] as const;
export const EMPHASIS_LEVELS = ["low", "normal", "high"] as const;
export const POINTING_TARGETS = ["self", "you", "there"] as const;
export const TRANSLATION_INTENTS = [
  "statement",
  "question",
  "greeting",
  "request-help",
  "locate",
  "medical",
  "education",
  "emergency",
  "confirmation",
  "negation",
  "introduction",
] as const;
export const BENCHMARK_TAGS = ["live-input", "held-out-phrases", "continuous-asl"] as const;

export type TranslationDomain = (typeof TRANSLATION_DOMAINS)[number];
export type PlannerModel = (typeof PLANNER_MODELS)[number];
export type SttModel = (typeof STT_MODELS)[number];
export type EmphasisLevel = (typeof EMPHASIS_LEVELS)[number];
export type PointingTarget = (typeof POINTING_TARGETS)[number];
export type TranslationIntent = (typeof TRANSLATION_INTENTS)[number];
export type BenchmarkTag = (typeof BENCHMARK_TAGS)[number];

export type CommunicationMode = "speech" | "text" | "sign-keys" | "camera-fingerspell";
export type TranslationTrack = "semantic-translation" | "deterministic-fallback";
export type PlanningStrategy = "semantic" | "deterministic";

export type LexemeToken = {
  type: "lexeme";
  lexemeId: string;
  durationMs: number;
  emphasis: EmphasisLevel;
};

export type FingerspellToken = {
  type: "fingerspell";
  text: string;
  durationMs: number;
  emphasis: EmphasisLevel;
};

export type NumberToken = {
  type: "number";
  value: string;
  durationMs: number;
  emphasis: EmphasisLevel;
};

export type PointingToken = {
  type: "pointing";
  target: PointingTarget;
  durationMs: number;
  emphasis: EmphasisLevel;
};

export type PauseToken = {
  type: "pause";
  durationMs: number;
};

export type SignToken = LexemeToken | FingerspellToken | NumberToken | PointingToken | PauseToken;

export type SignClause = {
  intent: TranslationIntent;
  tokens: SignToken[];
};

export type SignPlan = {
  sourceText: string;
  normalizedText: string;
  track: TranslationTrack;
  strategy: PlanningStrategy;
  clauses: SignClause[];
  metadata: {
    confidence: number;
    fallbackUsed: boolean;
    reviewNeeded: boolean;
    domain: TranslationDomain;
    benchmarkTag: BenchmarkTag;
    plannerModel?: PlannerModel;
    notes: string[];
  };
};

export type TranslationContext = {
  conversationId?: string;
  previousTurns?: Array<{
    role: "hearing" | "signer";
    text: string;
  }>;
  locale?: string;
  domain?: TranslationDomain;
  spellingHints?: string[];
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

export type TranslationEnvelope = {
  mode: CommunicationMode;
  intake: SpeechIntake | null;
  plan: SignPlan;
  rendererQueue: string[];
  rawInput: string;
  normalizedText: string;
};

export type CameraTrackingState = {
  landmarks: HandLandmarks;
  classification: ClassificationResult | null;
  currentWord: string;
  sentence: string[];
  sentenceText: string;
  committedWord: string | null;
};

export function isPlannerModel(value: string | null | undefined): value is PlannerModel {
  return Boolean(value && (PLANNER_MODELS as readonly string[]).includes(value));
}

export function isSttModel(value: string | null | undefined): value is SttModel {
  return Boolean(value && (STT_MODELS as readonly string[]).includes(value));
}

export function isTranslationDomain(value: string | null | undefined): value is TranslationDomain {
  return Boolean(value && (TRANSLATION_DOMAINS as readonly string[]).includes(value));
}
