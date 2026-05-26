# Ikiraro SDK — API Reference

All types and functions below are exported from `@ikiraro/sdk`.

---

## \`createIkiraroClient(config)\`

Primary React client factory. Creates and manages a reference-counted \`IkiraroRuntime\`. Config is read-once when the factory is created.

\`\`\`typescript
function createIkiraroClient(config: IkiraroHookConfig): IkiraroReactClient;

interface IkiraroHookConfig {
sdk: {
groqApiKey: string;
groqBaseUrl?: string; // override for proxies / self-hosted
};
vision?: { processor: HandProcessor }; // enables camera sign-language input
keyboard?: boolean; // mount KeyboardPlugin (A–Z → sign tokens)
plugins?: IkiraroPlugin<any>[]; // custom plugins appended after defaults
}

interface IkiraroReactClient {
runtime: IkiraroRuntime | null;
useIkiraro: () => UseIkiraroReturn;
useIkiraroPlugin: <T = unknown>(name: string) => T | null;
}

interface UseIkiraroReturn {
isReady: boolean; // true once runtime initialized
error: string | null; // init failure message
snapshot: RuntimeSnapshot; // reactive flat state
translate(text: string, options?: TranslateOptions): void; // LLM → ASL gloss → avatar
translateUnits(units: string[]): void; // deterministic, no LLM
startSpeech(options?: SpeechOptions): void; // open mic
stopSpeech(): void; // stop mic → transcribe → translate
cancel(): void; // abort in-progress work
onTranslated(cb: (envelope: TranslationEnvelope) => void): () => void; // subscribe outside React
}

interface TranslateOptions {
context?: TranslationContext;
}

interface SpeechOptions {
sttModel?: SttModel; // default: "whisper-large-v3"
prompt?: string; // domain hint for transcription
context?: TranslationContext;
}

````

---

## `RuntimeSnapshot`

Flat reactive view of runtime state. All fields update inside React's `startTransition`.

```typescript
interface RuntimeSnapshot {
  // Session lifecycle phase — distinct from internal runtime:status-change
  status: "idle" | "recording" | "translating" | "finished" | "error";
  isTranslating: boolean;
  lastEnvelope: TranslationEnvelope | null;  // pass directly to AvatarViewer
  compositionTokens: IkiraroToken[];          // in-flight token buffer (400 ms debounce)
  compositionText: string;                    // compositionTokens joined as string
  speechStatus: "idle" | "capturing" | "processing" | "error";
  speechLevel: number;  // 0–1 normalized mic amplitude — feed to AudioVisualizer
  error: string | null;
}
````

---

## `createIkiraro(config)` — factory (outside React)

```typescript
async function createIkiraro(config: IkiraroDefaultConfig): Promise<IkiraroRuntime>;

interface IkiraroDefaultConfig {
  sdk: { groqApiKey: string; groqBaseUrl?: string };
  vision?: { processor: HandProcessor };
  keyboard?: boolean;
  plugins?: IkiraroPlugin<any>[];
}
```

### `IkiraroRuntime` methods

```typescript
class IkiraroRuntime {
  translate(text: string, options?: { context?: TranslationContext }): void;
  translateUnits(units: string[]): void;
  startSpeech(options?: {
    sttModel?: SttModel;
    prompt?: string;
    context?: TranslationContext;
  }): void;
  stopSpeech(): void;
  cancel(): void;
  onTranslated(handler: (envelope: TranslationEnvelope) => void): () => void;

  subscribe<K extends keyof EventRegistry>(
    type: K,
    handler: (event: IkiraroEvent<K>) => void,
  ): () => void;
  subscribeAll(handler: (event: IkiraroEvent) => void): () => void;
  dispatch(event: IkiraroEvent): void;
  snapshot(): RuntimeSnapshot;
  getState(): Readonly<IkiraroState>;
  stop(): Promise<void>;
}
```

---

## Core Types

### `TranslationEnvelope`

Top-level output of every translation. Returned by `onTranslated`, stored in `snapshot.lastEnvelope`, passed to `AvatarViewer`.

```typescript
type TranslationEnvelope = {
  mode: CommunicationMode; // "speech" | "text" | "sign-keys" | "camera-fingerspell"
  intake: SpeechIntake | null; // STT metadata — only present for speech mode
  plan: SignPlan; // full signing plan with gloss and clauses
  rendererQueue: FrameItem[]; // pre-computed animation frames for the avatar
  rawInput: string; // original text or joined units string
  normalizedText: string; // cleaned / lowercased, punctuation removed
  intent?: SemanticIntent; // LLM output — only present for text/speech mode
};
```

### `SignPlan`

Intermediate representation between the planner and renderer.

```typescript
type SignPlan = {
  sourceText: string; // input that generated this plan
  normalizedText: string; // cleaned version
  glossText: string; // space-separated ASL gloss, e.g. "HELLO YOU HOW"
  track: "semantic" | "deterministic";
  strategy: "semantic" | "deterministic";
  clauses: SignClause[];
  metadata: {
    confidence: number; // 0–1, from LLM or 1.0 for deterministic
    reviewNeeded: boolean;
    notes: string[];
  };
};
```

### `FrameItem`

Single animation primitive in the renderer queue.

```typescript
type FrameItem = {
  type: "lexeme" | "fingerspell" | "number" | "pause" | "pointing";
  value: string; // pose library key or character
  label: string; // display label (the ASL gloss word)
  sublabel?: string; // e.g. the fingerspelled letters
  duration: number; // ms this frame plays for
  motion?: MotionType; // optional motion path (arc, shake, circle, etc.)
  armTarget?: ArmTarget; // optional per-sign arm position override
  facialExpression?: string;
  coarticulation?: "blend" | "snap" | "none";
};

// coarticulation values:
// "blend" — smooth interpolation between poses (default for lexemes)
// "snap"  — immediate cut, no interpolation (used for fingerspell letter transitions)
// "none"  — hold the previous pose until the frame ends, then cut

### `KinematicPose`

Snapshot of the avatar's arm joints for the physical engine.

```typescript
type KinematicPose = {
  rArm: { x: number; y: number; z: number };
  rFore: { x: number; y: number; z: number };
  rHand: { x: number; y: number; z: number };
  lArm: { x: number; y: number; z: number };
  lFore: { x: number; y: number; z: number };
  lHand: { x: number; y: number; z: number };
};
```

### `SignToken`

Discriminated union
 of gloss token types produced by the planner before expansion into `FrameItem[]`.

```typescript
type LexemeToken = {
  type: "lexeme";
  lexemeId: string;
  durationMs: number;
  emphasis: Emphasis;
  facialExpression?: string;
  coarticulationHint?: Coarticulation;
};
type FingerspellToken = {
  type: "fingerspell";
  text: string;
  durationMs: number;
  emphasis: Emphasis;
  facialExpression?: string;
  coarticulationHint?: Coarticulation;
};
type NumberToken = {
  type: "number";
  value: string;
  durationMs: number;
  emphasis: Emphasis;
  facialExpression?: string;
  coarticulationHint?: Coarticulation;
};
type PointingToken = {
  type: "pointing";
  target: string;
  durationMs: number;
  emphasis: Emphasis;
  facialExpression?: string;
  coarticulationHint?: Coarticulation;
};
type PauseToken = { type: "pause"; durationMs: number };

type SignToken = LexemeToken | FingerspellToken | NumberToken | PointingToken | PauseToken;

type Emphasis = "low" | "normal" | "high";
type Coarticulation = "blend" | "snap" | "none";
```

### `IkiraroToken`

Unified domain object for all conversational input. Produced by vision, keyboard, and speech adapters. Stored in `snapshot.compositionTokens`.

```typescript
type IkiraroToken = {
  id: string;
  value: string;
  type: "sign" | "speech" | "text" | "control";
  source: string; // which plugin produced it ("vision", "keyboard", "speech", etc.)
  timestamp: number;
  confidence: number; // 0–1
  stability: "draft" | "stable" | "committed";
  correlationId?: string; // links a draft token and its committed version
  metadata?: Record<string, unknown>;
};
```

---

## Plugin Authoring

### `IkiraroPlugin<S>`

```typescript
interface IkiraroPlugin<S = unknown> {
  name: string;
  initialState?: S;
  setup(ctx: PluginContext<S>): PluginTeardown | Promise<PluginTeardown>;
  reducer?(state: S, event: IkiraroEvent): S;
}

// PluginTeardown — what setup() may return:
type PluginTeardown = (() => void | Promise<void>) | (() => void | Promise<void>)[];
// Returning void / undefined is also fine (no-op teardown).
```

### `PluginContext<S>`

```typescript
interface PluginContext<S> {
  subscribe<K extends keyof EventRegistry>(
    type: K,
    handler: (event: IkiraroEvent<K>) => void,
  ): () => void;

  emit(event: IkiraroEvent): void;
  dispatch(event: IkiraroEvent): void; // alias for emit

  getPluginState(): S;
  getState(): Readonly<IkiraroState>;
}
```

### `EventRegistry` (partial — full list in runtime types)

```typescript
interface EventRegistry {
  // Core
  "runtime:ready": undefined;
  "runtime:status-change": "idle" | "active" | "processing" | "error";

  // Translation
  "translation:cmd:request": TranslationRequest;
  "translation:started": TranslationRequest;
  "translation:finished": TranslationEnvelope;
  "translation:error": string;

  // Speech
  "speech:cmd:start": undefined;
  "speech:cmd:stop": { sttModel?: SttModel; prompt?: string; context?: TranslationContext };
  "speech:cmd:cancel": undefined;
  "speech:status-change": "idle" | "capturing" | "processing" | "error";
  "speech:level-update": number; // 0–1

  // Session
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
  "session:status-change": "idle" | "recording" | "translating" | "finished" | "error";

  // Vision
  "vision:cmd:start": { videoElement: HTMLVideoElement };
  "vision:cmd:stop": undefined;
  "vision:status-change": "idle" | "starting" | "active" | "error";
  "vision:tracking": CameraTrackingState;

  // Composition
  "input:token": IkiraroToken;
  "composition:update": {
    newTokens?: IkiraroToken[];
    newUnits?: string[];
    allEvents: IkiraroEvent[];
  };
  "composition:cmd:clear": undefined;
  "composition:cleared": undefined;

  // Keyboard
  "keyboard:cmd:press": { unit: string };
}
```

### `IkiraroEvent<K>`

```typescript
// Specific event (payload is narrowed):
type IkiraroEvent<K extends keyof EventRegistry = keyof EventRegistry> = {
  [P in K]: {
    type: P;
    payload: EventRegistry[P];
    timestamp: number;
    source: string;
  };
}[K];

// In reducers: use IkiraroEvent (no K) — switch on event.type narrows payload
// In ctx.subscribe handler: the K is inferred from the event name you subscribed to
```

---

## `useHandTracking()`

Boots a MediaPipe Web Worker and 6-stage surgical classifier. Independent from `useIkiraro`.

```typescript
function useHandTracking(): {
  videoRef: (el: HTMLVideoElement | null) => void; // callback ref — attach to <video>
  tracking: CameraTrackingState;
  isReady: boolean;
  delegate: "GPU" | "CPU" | null;
  fps: number;
  isActive: boolean;
  error: string | null;
  start(): Promise<void>;
  stop(): void;
  clear(): void; // reset linguistic sentence buffer
  manualCorrect(sign: string): void;
};
```

### `CameraTrackingState`

```typescript
interface CameraTrackingState {
  landmarks: NormalizedLandmark[]; // raw MediaPipe landmarks for current frame
  classification: string | null; // classifier's current best-match ASL sign code
  currentWord: string; // word being assembled from letter classifications
  sentence: string[]; // completed words since last clear()
  sentenceText: string; // sentence.join(" ") — pass to translate()
  committedToken: string | null; // most recently committed letter token
}
```

---

## Components

### `<AvatarViewer />`

```typescript
interface AvatarViewerProps {
  envelope: TranslationEnvelope | null; // null → avatar returns to rest position
  modelUrl: string; // path to .glb signer model
  className?: string;
}
```

Powered by React Three Fiber. Internally drives a `RendererDirector` that drains `envelope.rendererQueue` frame by frame, applying coarticulation automatically.

### `<AudioVisualizer />`

```typescript
interface AudioVisualizerProps {
  level: number; // 0–1 amplitude — feed snapshot.speechLevel directly
  count?: number; // bar count, default 20
}
```

### `<AslHandSvg />`

```typescript
interface AslHandSvgProps {
  letter: string; // A–Z
  size?: number; // width/height in px, default 24
  className?: string;
}
```

### `<HandOverlay />`

```typescript
interface HandOverlayProps {
  tracking: CameraTrackingState;
}
```

SVG overlay that renders hand landmark skeleton over a camera feed. Place as `position: absolute` sibling to `<video>`.

### `WebSpeechProvider`

```typescript
type TTSProvider = "browser" | "openai" | "elevenlabs";

interface TTSConfig {
  provider: TTSProvider;
  apiKey?: string;
  voiceId?: string;
  model?: string;
}

class WebSpeechProvider {
  static getInstance(): WebSpeechProvider;
  setConfig(config: Partial<TTSConfig>): void;
  speak(text: string): Promise<void>;
  speakQueue(texts: string[]): Promise<void>;
  cancel(): void;
}
```

Singleton TTS that wraps the native Web Speech API alongside cloud TTS providers (`elevenlabs`, `openai`). When configured with an API key, it streams audio and plays it via the native `AudioContext` for synchronized playback. It queues speech requests and cancels pending ones on new input, keeping audio in sync with the avatar.
