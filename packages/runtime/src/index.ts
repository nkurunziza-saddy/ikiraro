// Core factory
export { createIkiraro } from "./runtime/factory";
export type { IkiraroDefaultConfig } from "./runtime/factory";

// Runtime class
export { IkiraroRuntime } from "./runtime/core";

// Public types
export type {
  RuntimeSnapshot,
  TranslationRequest,
  EventRegistry,
  IkiraroEvent,
  IkiraroPlugin,
  PluginContext,
  PluginTeardown,
  IkiraroState,
  RuntimeConfig,
} from "./runtime/types";

// Plugin state types
export type { SessionState, SessionStatus } from "./runtime/plugins/session";
export type { CompositionState } from "./runtime/plugins/composition";
export type { TranslationState } from "./runtime/plugins/translation";
export type { SpeechState } from "./runtime/plugins/speech";
export type { InspectorState } from "./runtime/plugins/inspector";

// Optional plugins (for advanced users and plugin authors)
export { KeyboardPlugin } from "./runtime/plugins/keyboard";
export { InspectorPlugin } from "./runtime/plugins/inspector";
export { VisionPlugin } from "./runtime/plugins/vision";

// React bindings
export { createIkiraroClient } from "./react/client";
export type { IkiraroReactClient } from "./react/client";
export { useHandTracking } from "./react/use-hand-tracking";

// Utilities
export type { CaptureStatus } from "./capture/types";
/**
 * One-shot translation for non-React or server-side contexts.
 * For sustained app use, prefer `createIkiraro()` which reuses the AI layer.
 */
export { translate } from "./translate";
export { IkiraroSDK } from "./sdk";
export type { IkiraroConfig } from "./sdk";
