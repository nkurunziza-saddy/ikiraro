// Core factory

export type {
  AccessibilityMode,
  AccessibilityShortcutManagerOptions,
  AudioPriority,
  EarconType,
  ShortcutSpec,
} from "./audio";
// Audio accessibility
export {
  AccessibilityModeManager,
  AccessibilityShortcutManager,
  AudioQueue,
  accessibilityMode,
  EarconPlayer,
} from "./audio";
// Utilities
export type { CaptureStatus } from "./capture/types";
export type { IkiraroReactClient } from "./react/client";
// React bindings
export { createIkiraroClient } from "./react/client";
export { useAccessibilityMode } from "./react/use-accessibility-mode";
export { useHandTracking } from "./react/use-hand-tracking";
// Runtime class
export { IkiraroRuntime } from "./runtime/core";
export type { IkiraroDefaultConfig } from "./runtime/factory";
export { createIkiraro } from "./runtime/factory";
export type { CompositionState } from "./runtime/plugins/composition";
// Optional plugins (for advanced users and plugin authors)
export { KeyboardPlugin } from "./runtime/plugins/keyboard";
// Plugin state types
export type { SessionState, SessionStatus } from "./runtime/plugins/session";
export type { SpeechState } from "./runtime/plugins/speech";
export type { TranslationState } from "./runtime/plugins/translation";
export { VisionPlugin } from "./runtime/plugins/vision";
// Public types
export type {
  EventRegistry,
  IkiraroEvent,
  IkiraroPlugin,
  IkiraroState,
  PluginContext,
  PluginTeardown,
  RuntimeConfig,
  RuntimeSnapshot,
  TranslationRequest,
} from "./runtime/types";
export type { IkiraroConfig } from "./sdk";
/**
 * One-shot translation for non-React or server-side contexts.
 * For sustained app use, prefer `createIkiraro()` which reuses the AI layer.
 */
export { translate } from "./translate";
