// Ikiraro SDK
// Main entry point re-exporting runtime, hooks, components, and core planning.

// Runtime SDK
export * from "@ikiraro/runtime";

// Core rendering components
export { AvatarViewer, SignModelGLTF, WebSpeechProvider } from "@ikiraro/renderer";
export type { SpeakOptions } from "@ikiraro/renderer";

// Planning primitives
export {
  buildPlanFromGloss,
  buildPlanFromUnits,
  buildFrameQueue,
  createEnvelope,
  REST_POSE,
  resolveHandshape,
  mixHandshapes,
  RendererDirector,
} from "@ikiraro/engine/planning";
export type {
  Handshape,
  FingerAngles,
  ThumbAngles,
  SignCanvas,
  RendererState,
  HandPose,
} from "@ikiraro/engine/planning";
export type { TranslationEnvelope, SignPlan, SignToken } from "@ikiraro/engine/types";
