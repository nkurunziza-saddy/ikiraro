import type {
  CommunicationMode,
  IkiraroToken,
  SttModel,
  TranslationContext,
  TranslationEnvelope,
} from "@ikiraro/engine/types";
import type { CaptureStatus } from "../capture/types";
/**
 * Flattened view of runtime state for React consumption.
 */
export interface RuntimeSnapshot {
  /** Session lifecycle phase: "idle" | "recording" | "translating" | "finished" | "error" */
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
import type { SessionState } from "./plugins/session";
import type { SpeechState } from "./plugins/speech";
import type { TranslationState } from "./plugins/translation";

/** Payload for translation requests. */
export type TranslationRequest = {
  mode: CommunicationMode;
  text?: string;
  audio?: Blob;
  units?: string[];
  sttModel?: SttModel;
  prompt?: string;
  context?: TranslationContext;
};

/** Central map of event names to payload types. */
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
    allEvents: IkiraroEvent[];
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
 * Discriminated union of all runtime events.
 */
export type IkiraroEvent<K extends keyof EventRegistry = keyof EventRegistry> = {
  [P in K]: {
    type: P;
    payload: EventRegistry[P];
    timestamp: number;
    source: string;
  };
}[K];

export interface PluginContext<S = unknown> {
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
 */
export interface IkiraroPlugin<S = unknown> {
  name: string;
  initialState?: S;
  setup: (ctx: PluginContext<S>) => PluginTeardown | Promise<PluginTeardown>;
  reducer?: (state: S, event: IkiraroEvent) => S;
}
/** Typed map of plugin states. */
export interface PluginRegistry {
  session: SessionState;
  composition: CompositionState;
  translation: TranslationState;
  speech: SpeechState;
}

export interface IkiraroState {
  lifecycleStatus: "idle" | "active" | "processing" | "error";
  plugins: PluginRegistry;
}

export interface RuntimeConfig {
  baseUrl?: string;
  sdk?: import("../sdk").IkiraroConfig;
  plugins?: IkiraroPlugin<any>[];
}
