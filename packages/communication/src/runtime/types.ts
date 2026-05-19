import type {
  TranslationEnvelope,
  IkiraroToken,
  CommunicationMode,
  SttModel,
  TranslationContext,
} from "@ikiraro/engine/types";
import type { CaptureStatus } from "../capture/types";

/**
 * Flattened view of runtime state for convenient React consumption.
 * Prefer this over digging into `getState().plugins.*`.
 */
export interface RuntimeSnapshot {
  status: "idle" | "recording" | "translating" | "finished" | "error";
  isTranslating: boolean;
  lastEnvelope: TranslationEnvelope | null;
  compositionTokens: IkiraroToken[];
  compositionText: string;
  speechStatus: CaptureStatus;
  speechLevel: number;
  error: string | null;
}

import type { CompositionState } from "./plugins/composition";
import type { TranslationState } from "./plugins/translation";
import type { InspectorState } from "./plugins/inspector";
import type { SessionState } from "./plugins/session";
import type { SpeechState } from "./plugins/speech";

/** Shared payload for translation:cmd:request and translation:started. */
export type TranslationRequest = {
  mode: CommunicationMode;
  text?: string;
  audio?: Blob;
  units?: string[];
  sttModel?: SttModel;
  prompt?: string;
  context?: TranslationContext;
};

/**
 * Central map of every event name to its payload type.
 * Add a new entry here when introducing a new event — nowhere else.
 */
export interface EventRegistry {
  // Runtime Core
  "runtime:ready": undefined;
  "runtime:status-change": "idle" | "active" | "processing" | "error";

  // Input Layer
  "input:token": IkiraroToken;
  "input:unit": { unit: string; confidence: number; type: string };
  "input:committed": { text: string; type: string };

  // Vision Plugin
  "vision:status-change": "idle" | "starting" | "active" | "error";
  "vision:tracking": import("@ikiraro/engine/types").CameraTrackingState;
  "vision:cmd:start": { videoElement: HTMLVideoElement };
  "vision:cmd:stop": undefined;

  // Composition Plugin
  "composition:update": {
    newUnits?: string[];
    newTokens?: IkiraroToken[];
    allEvents: IkiraroEvent<any>[];
  };
  "composition:cleared": undefined;
  "composition:cmd:clear": undefined;

  // Translation Plugin
  "translation:cmd:request": TranslationRequest;
  "translation:started": TranslationRequest;
  "translation:finished": TranslationEnvelope;
  "translation:error": string;

  // Keyboard Plugin
  "keyboard:cmd:press": { unit: string };

  // Speech Plugin
  "speech:status-change": CaptureStatus;
  "speech:level-update": number;
  "speech:cmd:start": undefined;
  "speech:cmd:stop": { sttModel?: SttModel; prompt?: string; context?: TranslationContext };
  "speech:cmd:cancel": undefined;

  // Session Plugin
  "session:status-change": SessionState["status"];
  "session:cmd:start": {
    mode: CommunicationMode;
    text?: string;
    units?: string[];
    sttModel?: SttModel;
    prompt?: string;
    context?: TranslationContext;
  };
  "session:cmd:stop": undefined;
  "session:cmd:cancel": undefined;
}

/**
 * The unified event envelope for all runtime interactions.
 */
export interface IkiraroEvent<K extends keyof EventRegistry = any> {
  type: K;
  payload: EventRegistry[K];
  timestamp: number;
  source: string;
}

/**
 * Context provided to plugins to interact with the runtime.
 */
export interface PluginContext<S = any> {
  emit: <K extends keyof EventRegistry>(event: IkiraroEvent<K>) => void;
  subscribe: <K extends keyof EventRegistry>(
    type: K,
    handler: (event: IkiraroEvent<K>) => void,
  ) => () => void;
  getState: () => IkiraroState;
  getPluginState: () => S;
  config: RuntimeConfig;
}

export type PluginTeardown =
  | void
  | (() => void | Promise<void>)
  | Array<() => void | Promise<void>>;

/**
 * Interface for all Ikiraro plugins.
 * Plugins can be Input Adapters, Fusion Layers, or Output Directors.
 */
export interface IkiraroPlugin<S = any> {
  name: string;
  initialState?: S;
  setup: (ctx: PluginContext<S>) => PluginTeardown | Promise<PluginTeardown>;
  reducer?: (state: S, event: IkiraroEvent) => S;
  teardown?: () => void | Promise<void>;
}

/**
 * Typed map of plugin name → plugin state for all stateful plugins.
 * Vision and keyboard plugins are event-only (no state) and are not listed here.
 */
export interface PluginRegistry {
  session: SessionState;
  composition: CompositionState;
  translation: TranslationState;
  inspector: InspectorState;
  speech: SpeechState;
}

/**
 * The central state of the runtime.
 */
export interface IkiraroState {
  status: "idle" | "active" | "processing" | "error";
  activeTracks: string[];
  plugins: PluginRegistry;
}

/**
 * Configuration for the Ikiraro Runtime.
 */
export interface RuntimeConfig {
  baseUrl?: string;
  sdk?: import("../sdk").IkiraroConfig;
  plugins?: IkiraroPlugin[];
}
