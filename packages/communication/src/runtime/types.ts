import type {
  TranslationEnvelope,
  SensaToken,
  CommunicationMode,
  SttModel,
  TranslationContext,
} from "@sensa/engine/types";
import type { CaptureStatus } from "../capture/types";
import type { CompositionState } from "./plugins/composition";
import type { TranslationState } from "./plugins/translation";
import type { InspectorState } from "./plugins/inspector";

/**
 * The EventRegistry is the central "Truth" for all runtime interactions.
 * It maps event names to their payload shapes, providing deep leverage
 * for all plugins and the core runtime.
 */
export interface EventRegistry {
  // Runtime Core
  "runtime:ready": undefined;
  "runtime:status-change": "idle" | "active" | "processing" | "error";

  // Input Layer
  "input:token": SensaToken;
  "input:unit": { unit: string; confidence: number; type: string };
  "input:committed": { text: string; type: string };

  // Vision Plugin
  "vision:status-change": "idle" | "starting" | "active" | "error";
  "vision:tracking": import("@sensa/engine/types").CameraTrackingState;
  "vision:cmd:start": { videoElement: HTMLVideoElement };
  "vision:cmd:stop": undefined;

  // Composition Plugin
  "composition:update": {
    newUnits?: string[];
    newTokens?: SensaToken[];
    allEvents: SensaEvent<any>[];
  };
  "composition:cleared": undefined;
  "composition:cmd:clear": undefined;

  // Translation Plugin
  "translation:cmd:request": {
    mode: CommunicationMode;
    text?: string;
    audio?: Blob;
    units?: string[];
    sttModel?: SttModel;
    context?: TranslationContext;
  };
  "translation:started": any; // Options passed in
  "translation:finished": TranslationEnvelope;
  "translation:error": string;

  // Keyboard Plugin
  "keyboard:cmd:press": { unit: string };

  // Speech Plugin
  "speech:status-change": CaptureStatus;
  "speech:level-update": number;
  "speech:cmd:start": undefined;
  "speech:cmd:stop": { sttModel?: SttModel; context?: TranslationContext };
  "speech:cmd:cancel": undefined;

  // Catch-all for extensibility
  [key: string]: any;
}

/**
 * The unified event envelope for all runtime interactions.
 */
export interface SensaEvent<K extends keyof EventRegistry = any> {
  type: K;
  payload: EventRegistry[K];
  timestamp: number;
  source: string;
}

/**
 * Context provided to plugins to interact with the runtime.
 */
export interface PluginContext<S = any> {
  emit: <K extends keyof EventRegistry>(event: SensaEvent<K>) => void;
  subscribe: <K extends keyof EventRegistry>(
    type: K,
    handler: (event: SensaEvent<K>) => void,
  ) => () => void;
  getState: () => SensaState;
  getPluginState: () => S;
  config: RuntimeConfig;
}

/**
 * Interface for all Sensa plugins.
 * Plugins can be Input Adapters, Fusion Layers, or Output Directors.
 */
export interface SensaPlugin<S = any> {
  name: string;
  initialState?: S;
  setup: (ctx: PluginContext<S>) => void | Promise<void>;
  reducer?: (state: S, event: SensaEvent) => S;
  teardown?: () => void | Promise<void>;
}

/**
 * The PluginRegistry defines the state shape for each plugin.
 * This provides deep leverage for state access across the runtime.
 */
export interface PluginRegistry {
  composition: CompositionState;
  translation: TranslationState;
  inspector: InspectorState;
  speech: import("./plugins/speech").SpeechState;
  vision: any; // Placeholder until VisionState is defined
  keyboard: any;
  [key: string]: any;
}

/**
 * The central state of the runtime.
 */
export interface SensaState {
  status: "idle" | "active" | "processing" | "error";
  activeTracks: string[];
  plugins: PluginRegistry;
}

/**
 * Configuration for the Sensa Runtime.
 */
export interface RuntimeConfig {
  baseUrl?: string;
  sdk?: import("../sdk").SensaConfig;
  plugins?: SensaPlugin[];
}
