export * from "../language-registry";
export * from "../plugins";
export type {
  ArmTarget,
  CoarticulationMode,
  FrameItem,
  MotionType,
  SttModel,
  TranslationContext,
} from "../types";
export { isSttModel, STT_MODELS } from "../types";
export { coarticulationBlend } from "./coarticulation";
export { FrameBuilder, frameBuilder } from "./frame-builder";
export type { GlossRegistryEntry } from "./gloss-registry";
export { GLOSS_REGISTRY_KEYS, getGlossDurationMs, isKnownGloss } from "./gloss-registry";
export { KinematicController } from "./kinematics/controller";
export type { KinematicPose } from "./kinematics/types";
export type { LexemePose } from "./lexeme-poses";
export { LEXEME_POSES, resolveLexemePose } from "./lexeme-poses";
export type { MotionDelta } from "./motion-paths";
export { computeMotionDelta } from "./motion-paths";
export { normalizeText } from "./normalizer";
export * from "./pose-library";
export { RendererDirector } from "./renderer-director";
export type { PlaybackOptions, RendererState, SignCanvas } from "./renderer-types";
export * from "./services";
export { buildPlanFromGloss, buildPlanFromUnits, createEnvelope } from "./tokenizer";
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
} from "./tokens";

import { LanguageRegistry } from "../language-registry";
import { ASLPlugin } from "../plugins/asl-plugin";

LanguageRegistry.register(ASLPlugin);
LanguageRegistry.setActive("asl");
