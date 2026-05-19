# @ikiraro/communication

The communication package is the runtime orchestration layer. It wires all input sources (speech, camera, keyboard) to the translation backend, manages session lifecycle, and provides React hooks for UI integration.

**Package name**: `@ikiraro/communication`

---

## Public API

```typescript
import {
  createIkiraro, // factory function — creates and starts the runtime
  IkiraroRuntime, // runtime class
  EventBus, // standalone typed pub/sub bus
  IkiraroPlugin, // plugin interface
  EventRegistry, // type map of all 34 events
  IkiraroEvent, // event envelope
  WorkerHandProcessor, // Web Worker bridge for hand tracking
  useIkiraro, // React hook for runtime state
  useHandTracking, // React hook for vision system
  IkiraroSDK, // Effect-based AI pipeline (text/speech → sign plan)
  RendererDirector, // re-exported from engine/planning
} from "@ikiraro/communication";
```

---

## Runtime (`src/runtime/`)

### `core.ts` — `IkiraroRuntime`

The nucleus of the system. Composes `EventBus` with plugin lifecycle management.

```typescript
class IkiraroRuntime {
  async start(): Promise<void>;
  async stop(): Promise<void>;
  dispatch<K extends keyof EventRegistry>(event: IkiraroEvent<K>): void;
  subscribe<K extends keyof EventRegistry>(type: K, handler): () => void;
  subscribeAll(handler: (event: IkiraroEvent<any>) => void): () => void;
  getState(): IkiraroState;
}
```

**`start()`**:

1. Iterates plugins in registration order.
2. Pre-populates plugin state slots in `IkiraroState.plugins`.
3. Constructs `PluginContext` for each plugin (wraps `bus.emit` and `bus.on`).
4. Calls `plugin.setup(ctx)` — collects teardown functions.
5. Dispatches `runtime:ready`.

**`stop()`**:

1. Calls all teardown functions in reverse order.
2. Calls `plugin.teardown()` for each plugin.

**`dispatch(event)`** runs in this order:

1. `updateInternalState(event)` — updates `state.status` from `runtime:status-change`.
2. Runs each plugin's `reducer(pluginState, event)` synchronously.
3. `bus.emit(event)` — fires typed and wildcard subscribers.

**`IkiraroState`**:

```typescript
interface IkiraroState {
  status: "idle" | "active" | "processing" | "error";
  activeTracks: string[];
  plugins: PluginRegistry; // { session, composition, translation, inspector, speech }
}
```

### `event-bus.ts` — `EventBus`

Standalone pub/sub with typed subscriptions. The bus itself has no knowledge of plugins or state.

```typescript
class EventBus {
  emit<K extends keyof EventRegistry>(event: IkiraroEvent<K>): void;
  on<K extends keyof EventRegistry>(type: K, handler: (event: IkiraroEvent<K>) => void): () => void;
  onAll(handler: (event: IkiraroEvent<any>) => void): () => void;
}
```

`on` returns an unsubscribe function. `IkiraroRuntime.subscribe` wraps this. Handlers for the same event type are stored in a `Set` — order is not guaranteed.

### `factory.ts` — `createIkiraro`

High-level factory. Creates the default plugin set and starts the runtime:

```typescript
async function createIkiraro(config: IkiraroDefaultConfig): Promise<IkiraroRuntime>;

interface IkiraroDefaultConfig {
  sdk: IkiraroConfig; // { groqApiKey, groqBaseUrl? }
  baseUrl?: string;
  vision?: { processor: HandProcessor };
}
```

Default plugin order: `SessionPlugin → CompositionPlugin → TranslationPlugin → SpeechPlugin → [VisionPlugin]`.

`VisionPlugin` is only added if `config.vision.processor` is provided.

### `types.ts`

The complete type surface of the runtime:

- `EventRegistry` — map of 34 event names → payload types (see [`../event-system.md`](../event-system.md))
- `IkiraroEvent<K>` — typed event envelope
- `PluginContext<S>` — API available inside `plugin.setup()`
- `IkiraroPlugin<S>` — plugin interface
- `PluginRegistry` — typed map of plugin name → plugin state
- `RuntimeConfig` — configuration passed to `IkiraroRuntime`
- `TranslationRequest` — payload for `translation:cmd:request`

---

## Plugins (`src/runtime/plugins/`)

### `session.ts` — `SessionPlugin`

**Role**: High-level session orchestrator. Coordinates Speech, Translation, and Composition.

**State**:

```typescript
interface SessionState {
  status: "idle" | "recording" | "translating" | "finished" | "error";
  mode?: CommunicationMode;
  lastEnvelope?: TranslationEnvelope;
  error?: string;
  sttModel: SttModel;
  translationContext?: TranslationContext;
  prompt?: string;
}
```

**Listens to**: `session:cmd:start`, `session:cmd:stop`, `session:cmd:cancel`, `translation:started`, `translation:finished`, `translation:error`, `speech:status-change`.

**Emits**: `speech:cmd:start`, `speech:cmd:stop`, `speech:cmd:cancel`, `translation:cmd:request`, `session:status-change`.

**`handleStart(ctx, mode, options)`**:

- `"speech"` → `speech:cmd:start`
- `"text"` → `translation:cmd:request { mode, text }`
- `"sign-keys"` → `translation:cmd:request { mode, units }`

**`handleStop(ctx)`**: if currently recording → `speech:cmd:stop { sttModel, prompt }`.

**`handleCancel(ctx)`**: if recording → `speech:cmd:cancel`.

### `composition.ts` — `CompositionPlugin`

**Role**: Token fusion layer. Collects input tokens from all sources, deduplicates within a time window, and emits merged composition updates.

**State**:

```typescript
interface CompositionState {
  tokens: IkiraroToken[];
  text: string; // tokens joined by space
  isDrafting: boolean;
}
```

**Listens to**: `input:token`, `composition:cmd:clear`.

**Emits**: `composition:update`, `composition:cleared`.

**Fusion mechanism**:

- Incoming `input:token` events are buffered in `eventBuffer`.
- `clearTimeout` + `setTimeout(400ms)` — waits for a 400ms quiet period.
- `TimeWindowTokenFusionPolicy.fuse(events)`:
  - Sorts events by timestamp.
  - Deduplicates: skips a token if the previous token has the same value + type and timestamp delta < 150ms.
- Emits `composition:update { newTokens, allEvents }`.

### `translation.ts` — `TranslationPlugin`

**Role**: Owns the translation lifecycle. Selects the appropriate planner and runs it.

**State**:

```typescript
interface TranslationState {
  lastEnvelope?: TranslationEnvelope;
  isTranslating: boolean;
  error?: string;
}
```

**Listens to**: `translation:cmd:request`.

**Emits**: `translation:started`, `translation:finished`, `translation:error`.

**Planner selection**: `planners.find(p => p.canPlan(request))`. Planners are ordered: `[DeterministicUnitsPlanner, GroqSemanticPlanner]`.

### `speech.ts` — `SpeechPlugin`

**Role**: Wraps `SpeechCaptureAdapter` (Web Audio API + MediaRecorder) as a plugin.

**State**:

```typescript
interface SpeechState {
  status: CaptureStatus; // "idle" | "capturing" | "error"
  level: number; // 0–1 normalized audio level
}
```

**Listens to**: `speech:cmd:start`, `speech:cmd:stop`, `speech:cmd:cancel`.

**Emits**: `speech:status-change`, `speech:level-update`, `translation:cmd:request` (after stop).

**Flow on stop**: `adapter.stop()` → returns `Blob` → emits `translation:cmd:request { mode: "speech", audio: Blob, ... }`.

### `vision.ts` — `VisionPlugin`

**Role**: Adapts `VisionSystem` events onto the runtime bus.

**Listens to**: `vision:cmd:start`, `vision:cmd:stop`.

**Emits**:

- `vision:status-change` — mirrors `VisionSystem`'s `status-change`.
- `vision:tracking` — mirrors `tracking-update` events.
- `input:token { stability: "stable" }` — on `sign-detected`.
- `input:token { stability: "committed" }` — on `word-committed` (converts `SignToken` to `IkiraroToken`).

**Token conversion** (`word-committed` → `IkiraroToken`):

```typescript
const value =
  token.type === "fingerspell"
    ? token.text
    : token.type === "lexeme"
      ? token.lexemeId
      : token.type === "number"
        ? token.value
        : token.type === "pointing"
          ? token.target
          : "";
```

### `inspector.ts` — `InspectorPlugin`

**Role**: Observer plugin that records all events for the dev inspector.

**State**: `{ events: IkiraroEvent[] }` — rolling event history.

Uses `subscribeAll` to capture every event type. No side effects.

### `keyboard.ts` — `KeyboardPlugin`

**Role**: Converts `keyboard:cmd:press` events into `input:unit` tokens.

**Listens to**: `keyboard:cmd:press { unit }`.

**Emits**: `input:unit { unit, confidence: 1.0, type: "sign" }`.

---

## Translation Planners (`src/runtime/translation-planner.ts`)

### Interface

```typescript
interface TranslationPlanner {
  canPlan(request: TranslationRequest): boolean;
  plan(request: TranslationRequest): Promise<TranslationEnvelope>;
}
```

### `DeterministicUnitsPlanner`

- `canPlan`: `request.mode === "sign-keys"`.
- `plan`: calls `buildPlanFromUnits(request.units)` then `createEnvelope(plan, { mode: "sign-keys" })`.
- No network call. Always synchronous (wrapped in async for interface compatibility).

### `GroqSemanticPlanner`

- `canPlan`: `request.mode === "text" || "speech"`.
- `plan`: runs `IkiraroSDK.translateText` or `IkiraroSDK.translateSpeech` via `ManagedRuntime.runPromise`.
- Creates an Effect `ManagedRuntime` from `IkiraroSDK.makeLayer(config)` — manages the Groq service layer lifecycle.

### `createTranslationPlanners(config?)`

Returns `[DeterministicUnitsPlanner]` always. Appends `GroqSemanticPlanner` if `config` (with `groqApiKey`) is provided.

---

## Token Fusion Policy (`src/runtime/token-fusion-policy.ts`)

### Interface

```typescript
interface TokenFusionPolicy {
  fuse(events: readonly IkiraroEvent<"input:token">[]): TokenFusionResult;
}
```

### `TimeWindowTokenFusionPolicy`

Constructor: `new TimeWindowTokenFusionPolicy(fusionWindowMs = 150)`.

Algorithm:

1. Sort events by timestamp.
2. For each event: if the previous token has the same `.value` and `.type`, and the time delta is less than `fusionWindowMs`, skip it (duplicate).
3. Return `{ newTokens, allEvents }`.

---

## Vision System (`src/runtime/vision-system.ts`)

**Role**: Framework-agnostic class that manages the webcam and drives `HandProcessor`. It sits between the `WorkerHandProcessor` (vision concern) and the `VisionPlugin` (runtime concern).

```typescript
class VisionSystem {
  constructor(processor: HandProcessor);
  async start(videoElement: HTMLVideoElement): Promise<void>;
  stop(): void;
  reset(): void;
  manualCorrect(sign: string): void;
  get status(): VisionStatus;
  on<K extends keyof VisionEventMap>(event: K, handler): void;
  off<K extends keyof VisionEventMap>(event: K, handler): void;
}
```

**Frame loop**: prefers `requestVideoFrameCallback` (available in Chrome/Edge), falls back to `requestAnimationFrame`. On each frame:

1. Checks `videoElement.readyState >= HAVE_CURRENT_DATA`.
2. Skips if `videoElement.currentTime` hasn't changed (duplicate frame).
3. Creates `ImageBitmap` from the video element.
4. Calls `processor.process(bitmap, timestamp)` — transfers bitmap to worker.

**Concurrency guard**: `busy` flag prevents sending a new frame while the worker is still processing the previous one. At 30fps video and 30fps inference, this is a no-op, but it prevents pile-up at lower frame rates.

---

## Capture (`src/capture/`)

### `speech-capture.ts` — `SpeechCaptureAdapter`

Wraps `navigator.mediaDevices.getUserMedia({ audio: true })` + `MediaRecorder`:

- `start()`: requests mic, creates `MediaRecorder`, sets up Web Audio `AnalyserNode` for level metering.
- `stop()`: resolves with a `Blob` when `MediaRecorder.onstop` fires.
- `reset()`: cancels recording and cleanup without producing a blob.

Level metering: `AnalyserNode.getByteFrequencyData(dataArray)` every rAF tick → average normalized to [0, 1].

Supports mime type detection (`getSupportedAudioRecordingMimeType`) — prefers `audio/webm;codecs=opus`, falls back to `audio/mp4`, `audio/ogg`.

### `worker-hand-processor.ts` — `WorkerHandProcessor`

Implements `HandProcessor` interface. Creates a `hand-landmarker.worker.ts` instance and bridges messages:

```typescript
class WorkerHandProcessor implements HandProcessor {
  init(): Promise<void>; // posts { type: "init" }, resolves on "ready" message
  process(bitmap, timestamp): void; // posts { type: "detect", imageBitmap, frameId }
  reset(): void; // posts { type: "reset" }
  correct(sign): void; // posts { type: "correct", sign }
  dispose(): void; // posts { type: "dispose" }, terminates worker
  onResult(cb): void; // register handler for CameraTrackingState
  onError(cb): void;
  onReady(cb): void; // fires with "GPU" | "CPU" delegate
}
```

`imageBitmap` is transferred (zero-copy) to the worker. The worker closes it after use.

---

## AI Services (`src/services/groq/`)

### `client.ts`

Creates a `Groq` Effect `Context.Tag` and `makeGroqLayer(config)` which provides it:

```typescript
interface GroqClient {
  apiKey: string;
  baseUrl?: string;
}
const Groq = Context.GenericTag<GroqClient>("@ikiraro/communication/Groq");
```

### `stt.ts` — `SttGroqLive`

Effect `Layer` implementing `SttService`. Calls Groq Whisper API:

```
POST /openai/v1/audio/transcriptions
form-data: file, model, language=en, response_format=verbose_json,
           timestamp_granularities[]=word, timestamp_granularities[]=segment
```

Returns `SpeechIntake` with full word-level timing.

### `gloss.ts` — `GlossGroqLive`

Effect `Layer` implementing `GlossService`. Calls Groq LLM (default: `llama-3.3-70b-versatile`):

```
POST /openai/v1/chat/completions
body: { model, messages: [system_prompt, user_text], response_format: { type: "json_object" }, temperature: 0.1 }
```

System prompt instructs the model to produce ASL Gloss with rules:

- UPPERCASE for glosses
- `PTR:SELF/YOU/THAT` for pointing
- `"/"` for pauses
- `"FS:WORD"` for unknown words
- Output only valid JSON: `{ gloss: string, confidence: number }`

Validates response against `GLOSS_OUTPUT_SCHEMA` (Effect Schema).

---

## `sdk.ts` — `IkiraroSDK`

The Effect-based translation pipeline:

```typescript
class IkiraroSDK {
  static translateText(text: string): Effect<TranslationEnvelope, Error>;
  static translateSpeech(audio: File, model?, prompt?): Effect<TranslationEnvelope, Error>;
  static makeLayer(config: IkiraroConfig): Layer;
}
```

**`translateText`**:

1. `GlossService.generate(text)` → `SemanticIntent`
2. `buildPlanFromGloss(intent)` → `SignPlan`
3. `createEnvelope(plan, { mode: "text" })` → `TranslationEnvelope`

**`translateSpeech`**:

1. `SttService.transcribe(audio, model, prompt)` → `SpeechIntake`
2. `GlossService.generate(intake.text)` → `SemanticIntent`
3. `buildPlanFromGloss(intent, intake)` → `SignPlan` (speech-synchronized timing)
4. `createEnvelope(plan, { mode: "speech", intake })` → `TranslationEnvelope`

**`makeLayer`**: composes `SttGroqLive + GlossGroqLive` provided with a `makeGroqLayer(config)`.

---

## React Hooks (`src/react/`)

### `use-ikiraro.ts` — `useIkiraro(runtime)`

```typescript
function useIkiraro(runtime: IkiraroRuntime | null): IkiraroState | null;
```

Subscribes to all runtime events via `subscribeAll` and returns the latest `IkiraroState`. Re-renders on every event (lightweight — state is a shallow object).

### `use-hand-tracking.ts` — `useHandTracking()`

```typescript
function useHandTracking(): {
  videoRef: (el: HTMLVideoElement | null) => void;
  tracking: CameraTrackingState;
  isReady: boolean;
  delegate: "GPU" | "CPU" | null;
  fps: number;
  isActive: boolean;
  error: string | null;
  clear(): void;
  manualCorrect(sign: string): void;
  start(): Promise<void>;
  stop(): void;
};
```

Creates singleton `WorkerHandProcessor` + `VisionSystem`. Boots the worker immediately on mount (pre-loads MediaPipe model so the camera starts instantly when the user clicks "Start Camera").

Tracking updates use `startTransition` to keep UI responsive at high frame rates.

`clear()` resets both the local React state and the pipeline inside the worker.
