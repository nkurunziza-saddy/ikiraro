export const ENGINE_ERROR_CODES = [
  "GROQ_UNAVAILABLE",
  "GROQ_INVALID_RESPONSE",
  "STT_FAILED",
  "GLOSS_VALIDATION_FAILED",
  "TOKENIZATION_FAILED",
  "CLASSIFIER_NOT_READY",
  "LANDMARK_QUALITY_LOW",
  "UNSUPPORTED_MODE",
  "UNKNOWN",
] as const;

export type EngineErrorCode = (typeof ENGINE_ERROR_CODES)[number];

export type TranslationStage =
  | "stt"
  | "normalization"
  | "gloss-generation"
  | "tokenization"
  | "rendering";

export type TranslationError = {
  code: EngineErrorCode;
  stage: TranslationStage;
  message: string;
  recoverable: boolean;
  fallbackUsed: boolean;
};

export function makeError(
  code: EngineErrorCode,
  stage: TranslationStage,
  message: string,
  opts: { recoverable?: boolean; fallbackUsed?: boolean } = {},
): TranslationError {
  return {
    code,
    stage,
    message,
    recoverable: opts.recoverable ?? true,
    fallbackUsed: opts.fallbackUsed ?? false,
  };
}
