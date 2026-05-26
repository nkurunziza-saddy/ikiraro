/**
 * @ikiraro/sdk — React SDK
 *
 * The primary entry point for React applications.
 * For non-React or custom-framework integrations, import from @ikiraro/runtime directly.
 */

// Core factory and runtime
export { createIkiraro, IkiraroRuntime, IkiraroSDK } from "@ikiraro/runtime";
export type { IkiraroDefaultConfig, IkiraroConfig } from "@ikiraro/runtime";

// React hooks and clients
export { createIkiraroClient } from "@ikiraro/runtime";
export type { IkiraroReactClient } from "@ikiraro/runtime";
export { useHandTracking } from "@ikiraro/runtime";

// React components
export {
  AvatarViewer,
  preloadAvatarModel,
  AslHandSvg,
  AudioVisualizer,
  HandOverlay,
} from "@ikiraro/renderer";
export { WebSpeechProvider } from "@ikiraro/renderer";
export type { SpeakOptions } from "@ikiraro/renderer";

// Runtime types
export type { RuntimeSnapshot, TranslationRequest, CaptureStatus } from "@ikiraro/runtime";
export type {
  TranslationEnvelope,
  SignPlan,
  SignToken,
  CommunicationMode,
  SttModel,
  TranslationContext,
  IkiraroToken,
} from "@ikiraro/engine/types";

// Accessibility
export {
  AccessibilityModeManager,
  accessibilityMode,
  AudioQueue,
  EarconPlayer,
  AccessibilityShortcutManager,
  useAccessibilityMode,
} from "@ikiraro/runtime";
export type {
  AccessibilityMode,
  AudioPriority,
  EarconType,
  ShortcutSpec,
  AccessibilityShortcutManagerOptions,
} from "@ikiraro/runtime";

// Plugins
export type {
  IkiraroPlugin,
  PluginContext,
  PluginTeardown,
  EventRegistry,
  IkiraroEvent,
} from "@ikiraro/runtime";
export type {
  SessionState,
  CompositionState,
  TranslationState,
  SpeechState,
} from "@ikiraro/runtime";
export { KeyboardPlugin, InspectorPlugin, VisionPlugin } from "@ikiraro/runtime";

// Advanced / custom renderers
export { RendererDirector } from "@ikiraro/engine/planning";
export type { SignCanvas, RendererState, PlaybackOptions } from "@ikiraro/engine/planning";
