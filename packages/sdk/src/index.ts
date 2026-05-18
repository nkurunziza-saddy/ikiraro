// ─── Sensa SDK ────────────────────────────────────────────────────────────────
// Main entry point. Re-exports the communication SDK (runtime, hooks,
// translate API), key rendering components, and the core planning primitives
// consumers need to build translation pipelines without an API key.
//
// For the full component library: @ikiraro/sdk/components
// For engine internals (advanced): @ikiraro/sdk/engine

// Communication SDK — SensaSDK, SensaRuntime, useSensa, useHandTracking, plugins
export * from "@sensa/communication";

// Core rendering components
export { SignPlayer3D, SignModelGLTF, SignModelProcedural } from "@sensa/components";

// Planning primitives — deterministic pipeline, pose library, renderer
export {
  buildPlanFromGloss,
  buildPlanFromUnits,
  buildFrameQueue,
  createEnvelope,
  REST_POSE,
  resolveHandshape,
  mixHandshapes,
  RendererDirector,
} from "@sensa/engine/planning";
export type {
  Handshape,
  FingerAngles,
  ThumbAngles,
  SignCanvas,
  RendererState,
  HandPose,
} from "@sensa/engine/planning";
export type { TranslationEnvelope, SignPlan, SignToken } from "@sensa/engine/types";
