export * from "./language-registry";
export { coarticulationBlend } from "./planning/coarticulation";
export { FrameBuilder, frameBuilder } from "./planning/frame-builder";
export type { GlossRegistryEntry } from "./planning/gloss-registry";
export { GLOSS_REGISTRY_KEYS, getGlossDurationMs, isKnownGloss } from "./planning/gloss-registry";
export type { LexemePose } from "./planning/lexeme-poses";
export { LEXEME_POSES, resolveLexemePose } from "./planning/lexeme-poses";
export type { MotionDelta } from "./planning/motion-paths";
export { computeMotionDelta } from "./planning/motion-paths";
export { normalizeText } from "./planning/normalizer";
export * from "./planning/pose-library";
export { RendererDirector } from "./planning/renderer-director";
export type { PlaybackOptions, RendererState, SignCanvas } from "./planning/renderer-types";
export { buildPlanFromUnits, createEnvelope } from "./planning/tokenizer";
export {
  DEFAULT_LEXEME_DURATION_MS,
  DEFAULT_PAUSE_MS,
  FINGERSPELL_PER_CHAR_MS,
  fingerspellToken,
  INTER_UNIT_PAUSE_MS,
  INTER_WORD_PAUSE_MS,
  lexemeToken,
  NUMBER_PER_DIGIT_MS,
  numberToken,
  POINTING_DURATION_MS,
  pauseToken,
  pointingToken,
} from "./planning/tokens";
export * from "./plugins/asl-plugin";
export type { FrameItem, SignPlan, SignToken, TranslationEnvelope } from "./types";

import { LanguageRegistry } from "./language-registry";
import { ASLPlugin } from "./plugins/asl-plugin";

LanguageRegistry.register(ASLPlugin);
LanguageRegistry.setActive("asl");
