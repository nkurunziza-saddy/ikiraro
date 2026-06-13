/**
 * @ikiraro/sdk — React SDK
 *
 * The primary entry point for React applications.
 * For non-React or custom-framework integrations, import from @ikiraro/runtime directly.
 */

export type { PlaybackOptions, RendererState, SignCanvas } from "@ikiraro/engine/planning";
// Advanced / custom renderers
export { RendererDirector } from "@ikiraro/engine/planning";
export type {
  CommunicationMode,
  IkiraroToken,
  SignPlan,
  SignToken,
  SttModel,
  TranslationContext,
  TranslationEnvelope,
} from "@ikiraro/engine/types";
export type { SpeakOptions } from "@ikiraro/renderer";
// React components
export {
  AslHandSvg,
  AudioVisualizer,
  AvatarViewer,
  HandOverlay,
  preloadAvatarModel,
  WebSpeechProvider,
} from "@ikiraro/renderer";
// Runtime types
// Plugins
export type {
  AccessibilityMode,
  AccessibilityShortcutManagerOptions,
  AudioPriority,
  CaptureStatus,
  CompositionState,
  EarconType,
  EventRegistry,
  IkiraroConfig,
  IkiraroDefaultConfig,
  IkiraroEvent,
  IkiraroPlugin,
  IkiraroReactClient,
  PluginContext,
  PluginTeardown,
  RuntimeSnapshot,
  SessionState,
  ShortcutSpec,
  SpeechState,
  TranslationRequest,
  TranslationState,
} from "@ikiraro/runtime";
// Core factory and runtime
// React hooks and clients
// Accessibility
export {
  AccessibilityModeManager,
  AccessibilityShortcutManager,
  AudioQueue,
  accessibilityMode,
  createIkiraro,
  createIkiraroClient,
  EarconPlayer,
  IkiraroRuntime,
  KeyboardPlugin,
  useAccessibilityMode,
  useHandTracking,
  VisionPlugin,
} from "@ikiraro/runtime";
