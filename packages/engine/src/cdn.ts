export { isKnownGloss, getGlossDurationMs, GLOSS_REGISTRY_KEYS } from "./planning/gloss-registry";
export type { GlossRegistryEntry } from "./planning/gloss-registry";
export { normalizeText } from "./planning/normalizer";
export {
  DEFAULT_LEXEME_DURATION_MS,
  FINGERSPELL_PER_CHAR_MS,
  NUMBER_PER_DIGIT_MS,
  POINTING_DURATION_MS,
  DEFAULT_PAUSE_MS,
  INTER_WORD_PAUSE_MS,
  INTER_UNIT_PAUSE_MS,
  lexemeToken,
  fingerspellToken,
  numberToken,
  pointingToken,
  pauseToken,
} from "./planning/tokens";
export { buildPlanFromUnits, createEnvelope } from "./planning/tokenizer";
export { FrameBuilder, frameBuilder } from "./planning/frame-builder";

export type { FrameItem } from "./types";
export * from "./planning/pose-library";
export { resolveLexemePose, LEXEME_POSES } from "./planning/lexeme-poses";
export type { LexemePose } from "./planning/lexeme-poses";
export { computeMotionDelta } from "./planning/motion-paths";
export type { MotionDelta } from "./planning/motion-paths";
export { RendererDirector } from "./planning/renderer-director";
export type { SignCanvas, RendererState, PlaybackOptions } from "./planning/renderer-types";
export { coarticulationBlend } from "./planning/coarticulation";
export type { SignPlan, SignToken, TranslationEnvelope } from "./types";
export * from "./language-registry";
export * from "./plugins/asl-plugin";

import { LanguageRegistry } from "./language-registry";
import { ASLPlugin } from "./plugins/asl-plugin";

LanguageRegistry.register(ASLPlugin);
LanguageRegistry.setActive("asl");
