export type { GlossRegistryEntry } from "./gloss-registry";
export { isKnownGloss, getGlossDurationMs, GLOSS_REGISTRY_KEYS } from "./gloss-registry";
export { normalizeText } from "./normalizer";
export { isSttModel, STT_MODELS } from "../types";
export type { SttModel, TranslationContext } from "../types";
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
} from "./tokens";
export * from "./services";
export { buildPlanFromGloss, buildPlanFromUnits, createEnvelope } from "./tokenizer";
export { FrameBuilder, frameBuilder } from "./frame-builder";
export type { FrameItem } from "../types";
export * from "./pose-library";
export { resolveLexemePose, LEXEME_POSES } from "./lexeme-poses";
export type { LexemePose } from "./lexeme-poses";
export { computeMotionDelta } from "./motion-paths";
export type { MotionDelta } from "./motion-paths";
export type { KinematicPose } from "./kinematics/types";
export { KinematicController } from "./kinematics/controller";
export { RendererDirector } from "./renderer-director";
export type { SignCanvas, RendererState, PlaybackOptions } from "./renderer-types";
export { coarticulationBlend } from "./coarticulation";
export type { CoarticulationMode, MotionType, ArmTarget } from "../types";
export * from "../language-registry";
export * from "../plugins";

import { LanguageRegistry } from "../language-registry";
import { ASLPlugin } from "../plugins/asl-plugin";
LanguageRegistry.register(ASLPlugin);
LanguageRegistry.setActive("asl");
