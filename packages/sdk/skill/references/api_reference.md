# Ikiraro SDK — API Reference

All types and functions below are exported from `@ikiraro/sdk`.

---

## `createIkiraroClient(config)`

Primary React client factory. Creates and manages a reference-counted `IkiraroRuntime`. Config is read-once when the factory is created.

```typescript
function createIkiraroClient(config: IkiraroDefaultConfig): IkiraroReactClient;

interface IkiraroDefaultConfig {
  sdk: {
    groqApiKey: string;
    groqBaseUrl?: string; // override for proxies / self-hosted
  };
  vision?: { processor: HandProcessor }; // enables camera sign-language input
  keyboard?: boolean; // mount KeyboardPlugin (A–Z → sign tokens)
  plugins?: IkiraroPlugin<any>[]; // custom plugins appended after defaults
}

interface IkiraroReactClient {
  readonly runtime: IkiraroRuntime | null;
  useIkiraro: () => UseIkiraroReturn;
  useIkiraroPlugin: <K extends keyof PluginRegistry>(
    pluginName: K,
  ) => PluginRegistry[K] | undefined;
  start: () => Promise<IkiraroRuntime>; // imperatively start without React
  stop: () => Promise<void>; // imperatively stop
}

interface UseIkiraroReturn {
  isReady: boolean; // true once runtime initialized
  error: string | null; // init failure message
  snapshot: RuntimeSnapshot; // reactive flat state
  translate(text: string, options?: { context?: TranslationContext }): void;
  translateUnits(units: string[]): void; // deterministic, no LLM
  startSpeech(options?: SpeechOptions): void; // open mic
  stopSpeech(): void; // stop mic → transcribe → translate
  cancel(): void; // abort in-progress work
  onTranslated(cb: (envelope: TranslationEnvelope) => void): () => void;
}

interface SpeechOptions {
  sttModel?: SttModel; // default: "whisper-large-v3"
  prompt?: string; // domain hint for transcription
  context?: TranslationContext;
}
```

---

## `RuntimeSnapshot`

Flat reactive view of runtime state. All fields update inside React's `startTransition`.

```typescript
interface RuntimeSnapshot {
  // Session lifecycle phase
  status: "idle" | "recording" | "translating" | "finished" | "error";
  isTranslating: boolean;
  lastEnvelope: TranslationEnvelope | null; // pass directly to AvatarViewer
  compositionTokens: IkiraroToken[]; // in-flight token buffer (400 ms debounce)
  compositionText: string; // compositionTokens joined as string
  speechStatus: "idle" | "capturing" | "processing" | "error";
  speechLevel: number; // 0–1 normalized mic amplitude — feed to AudioVisualizer
  error: string | null;
}
```

---

## `createIkiraro(config)` — factory (outside React)

```typescript
async function createIkiraro(config: IkiraroDefaultConfig): Promise<IkiraroRuntime>;
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

  dispatch(event: IkiraroEvent): void; // low-level event dispatch
  subscribe<K extends keyof EventRegistry>(
    type: K,
    handler: (event: IkiraroEvent<K>) => void,
  ): () => void;
  subscribeAll(handler: (event: IkiraroEvent) => void): () => void;
  snapshot(): RuntimeSnapshot;
  getState(): Readonly<IkiraroState>;
  stop(): Promise<void>;
}
```

---

## `IkiraroSDK` — Effect-based one-shot translations

```typescript
class IkiraroSDK {
  // Effect values — compose with Effect.provide(IkiraroSDK.makeLayer(config))
  static translateText(text: string): Effect<TranslationEnvelope, ...>;
  static translateSpeech(audio: File, model?: SttModel, prompt?: string): Effect<TranslationEnvelope, ...>;

  // Promise wrappers — most common for scripts/tests
  static translateTextAsync(text: string, config: IkiraroConfig): Promise<TranslationEnvelope>;
  static translateSpeechAsync(audio: File, config: IkiraroConfig, model?: SttModel, prompt?: string): Promise<TranslationEnvelope>;

  static makeLayer(config: IkiraroConfig): Layer<...>;
}

interface IkiraroConfig {
  groqApiKey: string;
  groqBaseUrl?: string;
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
  instructions?: MotionInstruction[]; // low-level motion instructions
};
```

### `SignPlan`

Intermediate representation between the planner and renderer.

```typescript
type SignPlan = {
  sourceText: string;
  normalizedText: string;
  glossText: string; // space-separated gloss, e.g. "HELLO YOU HOW"
  track: "semantic" | "deterministic";
  strategy: "semantic" | "deterministic";
  clauses: SignClause[];
  metadata: {
    confidence: number; // 0–1, from LLM or 1.0 for deterministic
    reviewNeeded: boolean;
    notes: string[];
  };
};

type SignClause = {
  intent: string;
  tokens: SignToken[];
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
  motion?: MotionType;
  motionClip?: string;
  armTarget?: ArmTarget;
  facialExpression?: string;
  coarticulation?: CoarticulationMode;
};

// CoarticulationMode values:
// "blend" — smooth interpolation between poses (default for lexemes)
// "snap"  — immediate cut (used for fingerspell letter transitions)
// "none"  — hold previous pose until frame ends, then cut
```

### `MotionType`

```typescript
type MotionType =
  | "none"
  | "shake"
  | "arc"
  | "salute"
  | "forward-push"
  | "outward-sweep"
  | "pull-back"
  | "chest-pat"
  | "two-hand-tap"
  | "music-sweep"
  | "wrist-twist"
  | "tap"
  | "circle"
  | "z-trace"
  | "j-trace"
  | "g-push"
  | "h-slide"
  | "d-arc"
  | "n-dip"
  | "k-push"
  | "wave";
```

### `ArmTarget`

Per-sign arm position override. All fields optional.

```typescript
type ArmTarget = {
  rArmX?: number;
  rArmZ?: number;
  rArmY?: number;
  rForeX?: number;
  rForeZ?: number;
  rForeY?: number;
  rHandX?: number;
  lArmX?: number;
  lArmZ?: number;
  lArmY?: number;
  lForeX?: number;
  lForeZ?: number;
  lForeY?: number;
  lHandX?: number;
};
```

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

Discriminated union of gloss token types produced by the planner.

```typescript
type BaseToken = {
  durationMs: number;
  emphasis: "low" | "normal" | "high";
  facialExpression?: "neutral" | "inquisitive" | "assertive" | "urgent" | "empathetic";
  coarticulationHint?: "blend" | "snap" | "none";
};

type LexemeToken = BaseToken & { type: "lexeme"; lexemeId: string };
type FingerspellToken = BaseToken & { type: "fingerspell"; text: string };
type NumberToken = BaseToken & { type: "number"; value: string };
type PointingToken = BaseToken & { type: "pointing"; target: string };
type PauseToken = { type: "pause"; durationMs: number };

type SignToken = LexemeToken | FingerspellToken | NumberToken | PointingToken | PauseToken;
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

### `TranslationContext`

Optional conversation context passed to `translate()` / `startSpeech()`.

```typescript
type TranslationContext = {
  conversationId?: string;
  previousTurns?: Array<{ role: "hearing" | "signer"; text: string }>;
  locale?: string;
};
```

### `SemanticIntent`

LLM output. Present on `envelope.intent` for text/speech modes.

```typescript
type SemanticIntent = {
  rawGloss: string;
  glossTokens: string[];
  confidence: number;
  model: string;
  promptTokens?: number;
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

type PluginTeardown = void | (() => void | Promise<void>) | Array<() => void | Promise<void>>;
```

### `PluginContext<S>`

```typescript
interface PluginContext<S> {
  emit(event: IkiraroEvent): void; // send an event into the runtime bus
  subscribe<K extends keyof EventRegistry>(
    type: K,
    handler: (event: IkiraroEvent<K>) => void,
  ): () => void;

  getPluginState(): S;
  getState(): Readonly<IkiraroState>;
  config: RuntimeConfig;
}
```

> **Note:** `PluginContext` exposes `emit`, not `dispatch`. There is no `ctx.dispatch` alias.

### `EventRegistry` (complete)

```typescript
interface EventRegistry {
  // Runtime Core
  "runtime:ready": undefined;
  "runtime:status-change": "idle" | "active" | "processing" | "error";

  // Input Layer
  "input:token": IkiraroToken;
  "input:unit": { unit: string; confidence: number; type: string };
  "input:committed": { text: string; type: string };

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
type IkiraroEvent<K extends keyof EventRegistry = keyof EventRegistry> = {
  [P in K]: {
    type: P;
    payload: EventRegistry[P];
    timestamp: number;
    source: string;
  };
}[K];

// In reducers: use IkiraroEvent (no K) — switch on event.type narrows payload
// In ctx.subscribe handler: K is inferred from the subscribed event name
```

### Plugin state types

```typescript
// Access via runtime.getState().plugins or useIkiraroPlugin(name)
interface PluginRegistry {
  session: SessionState;
  composition: CompositionState;
  translation: TranslationState;
  speech: SpeechState;
  inspector?: InspectorState; // only present when InspectorPlugin is mounted
}
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
  manualCorrect(sign: string): void; // inject a correction into the vision buffer
};
```

### `CameraTrackingState`

```typescript
type CameraTrackingState = {
  landmarks: HandLandmarks; // raw MediaPipe landmarks for current frame
  faceLandmarks?: Point3D[];
  poseLandmarks?: Point3D[];
  classification: ClassificationResult | null;
  currentWord: string; // word being assembled from letter classifications
  sentence: string[]; // completed words since last clear()
  sentenceText: string; // sentence.join(" ") — pass to translate()
  committedToken: SignToken | null; // most recently committed sign token
};

interface ClassificationResult {
  sign: string | null;
  confidence: number;
  vector: FeatureVector;
  candidates: Array<{ name: string; score: number }>;
  isTransitioning?: boolean;
  gesture?: "double-letter-slide" | "double-letter-bounce" | "none";
}
```

---

## Accessibility API

### `AccessibilityMode`

```typescript
type AccessibilityMode =
  | "standard" // All modalities on (sign avatar + TTS + visuals)
  | "audio-first" // Avatar suppressed. TTS is primary. For blind users.
  | "visual-first" // TTS suppressed. Avatar + visuals primary. For deaf users.
  | "motor"; // Full audio + sign, but interactions via single-key / switch scanning.
```

### `AccessibilityModeManager`

```typescript
class AccessibilityModeManager {
  static getInstance(): AccessibilityModeManager;
  getMode(): AccessibilityMode;
  setMode(mode: AccessibilityMode): void;
  isAvatarSuppressed(): boolean; // true when mode === "audio-first"
  isTtsSuppressed(): boolean; // true when mode === "visual-first"
  onModeChange(listener: (mode: AccessibilityMode) => void): () => void;
  static reset(): void; // for testing
}

// Shorthand
const accessibilityMode: () => AccessibilityModeManager;
```

### `AudioQueue`

```typescript
class AudioQueue {
  static getInstance(speakFn?: (text: string) => Promise<void>, cancelFn?: () => void): AudioQueue;
  speak(text: string, priority?: AudioPriority): void;
  speakAsync(text: string, priority?: AudioPriority): Promise<void>;
  stop(): void;
  repeat(): void;
  isSpeaking(): boolean;
  getLastMessage(): string | null;
  static reset(): void;
}

type AudioPriority = "critical" | "high" | "normal" | "low";
// critical > high > normal > low
// low is dropped if anything is queued or speaking
// critical interrupts everything
```

### `EarconPlayer`

```typescript
class EarconPlayer {
  static getInstance(): EarconPlayer;
  play(type: EarconType): void; // no-ops when Web Audio API unavailable or in visual-first mode
  static reset(): void;
}

type EarconType =
  | "focus" // soft blip — navigating to an item
  | "select" // click-like — confirming a selection
  | "success" // ascending tones — action completed
  | "error" // descending tones — action failed
  | "navigate" // short swoosh — list navigation
  | "open" // rising ping — opening content
  | "close"; // falling ping — closing content
```

### `AccessibilityShortcutManager`

```typescript
class AccessibilityShortcutManager {
  constructor(options?: AccessibilityShortcutManagerOptions);
  register(spec: ShortcutSpec): () => void; // returns unregister function
  registerMany(specs: ShortcutSpec[]): () => void;
  mount(): void; // attach keydown listener to document
  unmount(): void; // remove listener

  getFocusedIndex(): number | null;
  setFocusedIndex(index: number | null): void;
  onFocusChange(listener: (index: number | null) => void): () => void;

  isHelpVisible(): boolean;
  setHelpVisible(visible: boolean): void;
  onHelpToggle(listener: (visible: boolean) => void): () => void;
}

interface ShortcutSpec {
  key: string; // lowercase key value from KeyboardEvent.key
  label: string; // short label for help panel
  description: string;
  action: () => void;
  doubleTapAction?: () => void; // triggered when key pressed twice within doubleTapMs
  allowInInput?: boolean; // fire even when INPUT/TEXTAREA focused. Default: false.
}

interface AccessibilityShortcutManagerOptions {
  doubleTapMs?: number; // double-tap detection window, default 400
}
```

### `useAccessibilityMode()` hook

```typescript
function useAccessibilityMode(): {
  mode: AccessibilityMode;
  setMode: (mode: AccessibilityMode) => void;
  isAvatarSuppressed: boolean;
  isTtsSuppressed: boolean;
};
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

SVG overlay that renders hand landmark skeleton. Place as `position: absolute` sibling to `<video>`.

### `WebSpeechProvider`

```typescript
class WebSpeechProvider {
  static getInstance(): WebSpeechProvider;
  static isSupported(): boolean;
  setConfig(config: Partial<TTSConfig>): void;
  speak(text: string, options?: SpeakOptions): Promise<void>;
  speakQueue(texts: string[]): Promise<void>;
  cancel(): void;
  getVoices(): SpeechSynthesisVoice[];
}

type TTSProvider = "browser" | "openai" | "elevenlabs";

interface TTSConfig {
  provider: TTSProvider;
  apiKey?: string;
  voiceId?: string;
  model?: string;
}

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  lang?: string;
  targetDurationMs?: number;
}
```

---

## STT Models

| Model                        | Speed  | Best for                  |
| ---------------------------- | ------ | ------------------------- |
| `whisper-large-v3` (default) | Slower | Accuracy, medical/legal   |
| `whisper-large-v3-turbo`     | Faster | Conversational, real-time |

---

## `RendererDirector` (custom renderers)

Implement `SignCanvas` to drive your own 2D canvas, SVG, or external engine.

```typescript
interface SignCanvas {
  setPose(pose: Handshape): void; // Handshape from pose-library, not KinematicPose
  setOverlay(label: string, sublabel?: string): void;
  clear(): void;
  // Optional — implement for richer rendering:
  setMotion?(motion: MotionType, progress: number, armTarget?: ArmTarget): void;
  setExpression?(expression: string): void;
  setMotionClip?(clipUrl: string | null, progress: number): void;
  setSpatialTarget?(target: { x: number; y: number; z: number } | null): void;
  setCoarticulationState?(state: { blendWeight: number; amplitudeScale: number } | null): void;
}

interface PlaybackOptions {
  speed: number; // playback speed multiplier, default 1
  loop: boolean; // whether to loop, default false
}

interface RendererState {
  time: number; // elapsed ms
  frameIndex: number; // current frame index in the queue
  progress: number; // 0–1 progress within the current frame
  isPlaying: boolean;
}

class RendererDirector {
  constructor(canvas: SignCanvas);
  setQueue(queue: FrameItem[]): void; // load a frame queue
  setInstructions(instructions: MotionInstruction[]): void; // load low-level instructions
  setOptions(options: Partial<PlaybackOptions>): void; // configure speed/loop
  play(): void;
  pause(): void;
  reset(): void;
  seek(time: number): void;
  getState(): RendererState; // NOT a property — call getState()
  subscribe(cb: (state: RendererState) => void): () => void; // reactive state updates
  dispose(): void; // cancel animation frame + clear handlers
}
```
