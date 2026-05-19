# Event System

The Ikiraro runtime communicates entirely through a typed event bus. No plugin holds a direct reference to another plugin. Every interaction is expressed as a typed event dispatched on `EventBus`.

---

## EventBus

`packages/communication/src/runtime/event-bus.ts`

```typescript
class EventBus {
  emit<K extends keyof EventRegistry>(event: IkiraroEvent<K>): void;
  on<K extends keyof EventRegistry>(type: K, handler): () => void; // returns unsubscribe
  onAll(handler: (event: IkiraroEvent<any>) => void): () => void;
}
```

`IkiraroRuntime` composes one `EventBus`. Its public `dispatch`, `subscribe`, and `subscribeAll` methods delegate to the bus. Plugins receive a `PluginContext` whose `emit` and `subscribe` methods are wired to the same bus.

`dispatch` does three things in order:

1. Updates `IkiraroState` core fields (status, activeTracks).
2. Runs each plugin's `reducer(state, event)` to update per-plugin state.
3. Calls `bus.emit(event)` to notify subscribers.

---

## Event Envelope

Every event has the same envelope:

```typescript
interface IkiraroEvent<K extends keyof EventRegistry> {
  type: K; // event name, key into EventRegistry
  payload: EventRegistry[K]; // payload type is inferred from the name
  timestamp: number; // Date.now() at emit time
  source: string; // name of the emitting plugin or "ui" / "core"
}
```

---

## EventRegistry — All 34 Events

The complete registry of event names and their payload types, grouped by domain:

### Runtime Core

| Event                   | Payload                                         | Who emits                                  | Who listens                  |
| ----------------------- | ----------------------------------------------- | ------------------------------------------ | ---------------------------- |
| `runtime:ready`         | `undefined`                                     | `IkiraroRuntime` (after all plugins setup) | UI hooks                     |
| `runtime:status-change` | `"idle" \| "active" \| "processing" \| "error"` | any plugin                                 | UI hooks, runtime core state |

### Input Layer

| Event             | Payload                                              | Who emits                           | Who listens         |
| ----------------- | ---------------------------------------------------- | ----------------------------------- | ------------------- |
| `input:token`     | `IkiraroToken`                                       | `VisionPlugin`, `CompositionPlugin` | `CompositionPlugin` |
| `input:unit`      | `{ unit: string; confidence: number; type: string }` | keyboard plugin                     | `CompositionPlugin` |
| `input:committed` | `{ text: string; type: string }`                     | any input plugin                    | `TranslationPlugin` |

### Vision Plugin

| Event                  | Payload                                       | Who emits          | Who listens              |
| ---------------------- | --------------------------------------------- | ------------------ | ------------------------ |
| `vision:status-change` | `"idle" \| "starting" \| "active" \| "error"` | `VisionPlugin`     | UI (`useHandTracking`)   |
| `vision:tracking`      | `CameraTrackingState`                         | `VisionPlugin`     | UI for overlay rendering |
| `vision:cmd:start`     | `{ videoElement: HTMLVideoElement }`          | UI / SessionPlugin | `VisionPlugin`           |
| `vision:cmd:stop`      | `undefined`                                   | UI / SessionPlugin | `VisionPlugin`           |

### Composition Plugin

| Event                   | Payload                                | Who emits           | Who listens         |
| ----------------------- | -------------------------------------- | ------------------- | ------------------- |
| `composition:update`    | `{ newTokens?, newUnits?, allEvents }` | `CompositionPlugin` | UI, `SessionPlugin` |
| `composition:cleared`   | `undefined`                            | `CompositionPlugin` | UI                  |
| `composition:cmd:clear` | `undefined`                            | UI                  | `CompositionPlugin` |

### Translation Plugin

| Event                     | Payload               | Who emits                           | Who listens                        |
| ------------------------- | --------------------- | ----------------------------------- | ---------------------------------- |
| `translation:cmd:request` | `TranslationRequest`  | `SessionPlugin`, `SpeechPlugin`, UI | `TranslationPlugin`                |
| `translation:started`     | `TranslationRequest`  | `TranslationPlugin`                 | `SessionPlugin`, UI                |
| `translation:finished`    | `TranslationEnvelope` | `TranslationPlugin`                 | `SessionPlugin`, UI via `onCommit` |
| `translation:error`       | `string`              | `TranslationPlugin`, `SpeechPlugin` | `SessionPlugin`, UI                |

### Speech Plugin

| Event                  | Payload                            | Who emits       | Who listens           |
| ---------------------- | ---------------------------------- | --------------- | --------------------- |
| `speech:status-change` | `CaptureStatus`                    | `SpeechPlugin`  | `SessionPlugin`, UI   |
| `speech:level-update`  | `number` (0–1)                     | `SpeechPlugin`  | UI (audio visualizer) |
| `speech:cmd:start`     | `undefined`                        | `SessionPlugin` | `SpeechPlugin`        |
| `speech:cmd:stop`      | `{ sttModel?, prompt?, context? }` | `SessionPlugin` | `SpeechPlugin`        |
| `speech:cmd:cancel`    | `undefined`                        | `SessionPlugin` | `SpeechPlugin`        |

### Session Plugin

| Event                   | Payload                                                 | Who emits       | Who listens     |
| ----------------------- | ------------------------------------------------------- | --------------- | --------------- |
| `session:status-change` | `SessionStatus`                                         | `SessionPlugin` | UI              |
| `session:cmd:start`     | `{ mode, text?, units?, sttModel?, prompt?, context? }` | UI              | `SessionPlugin` |
| `session:cmd:stop`      | `undefined`                                             | UI              | `SessionPlugin` |
| `session:cmd:cancel`    | `undefined`                                             | UI              | `SessionPlugin` |

### Keyboard Plugin

| Event                | Payload            | Who emits   | Who listens      |
| -------------------- | ------------------ | ----------- | ---------------- |
| `keyboard:cmd:press` | `{ unit: string }` | UI keyboard | `KeyboardPlugin` |

---

## Plugin Anatomy

Every plugin implements `IkiraroPlugin<S>`:

```typescript
interface IkiraroPlugin<S = any> {
  name: string;
  initialState?: S;
  setup(ctx: PluginContext<S>): PluginTeardown | Promise<PluginTeardown>;
  reducer?(state: S, event: IkiraroEvent): S;
  teardown?(): void | Promise<void>;
}
```

**`setup(ctx)`** — Called once when the runtime starts. Returns cleanup functions (unsubscribe handlers, timer ids). Use `ctx.subscribe()` to attach listeners and `ctx.emit()` to send events. `ctx.getPluginState()` reads the plugin's own reducer state.

**`reducer(state, event)`** — Pure function called synchronously on every event, before subscribers are notified. Updates the plugin's local state slice. Must return a new state object (no mutation).

**`teardown()`** — Called when the runtime stops. Runs after all setup teardowns.

---

## Plugin Execution Order

For each dispatched event, the runtime:

1. Runs `updateInternalState(event)` — updates `IkiraroState.status`.
2. Iterates plugins in registration order, calling each `reducer(pluginState, event)`.
3. Calls `bus.emit(event)` — fires all typed subscribers and wildcard subscribers.

Plugin registration order (from `createIkiraro` factory):

```
SessionPlugin → CompositionPlugin → TranslationPlugin → SpeechPlugin → [VisionPlugin]
```

This means `SessionPlugin.reducer` always runs before `TranslationPlugin.reducer`. Subscribers fire after all reducers.

---

## Subscribing to Events (from outside the runtime)

The `IkiraroRuntime` exposes its bus publicly:

```typescript
// Typed subscription
const unsub = runtime.subscribe("translation:finished", (event) => {
  console.log(event.payload); // TranslationEnvelope
});

// Wildcard subscription
const unsubAll = runtime.subscribeAll((event) => {
  console.log(event.type, event.payload);
});

// Emit from outside (e.g., UI)
runtime.dispatch({
  type: "session:cmd:start",
  payload: { mode: "text", text: "Hello" },
  timestamp: Date.now(),
  source: "ui",
});
```

`useCommunicationSession` uses `subscribeAll` for broad state sync and specific typed subscriptions for high-frequency events like `speech:level-update`.

---

## CompositionPlugin: Token Fusion

`CompositionPlugin` collects all `input:token` events, waits 400ms after the last one, then runs `TimeWindowTokenFusionPolicy.fuse()`:

```
Sort events by timestamp
For each event:
  If previous token has same value + type AND timestamp delta < 150ms → skip (duplicate)
  Else → keep
→ composition:update { newTokens, allEvents }
```

This prevents camera-based sign detections (which fire at ~30fps) from producing duplicate tokens for a single held handshape.

---

## InspectorPlugin

`InspectorPlugin` subscribes to all events (`subscribeAll`) and maintains a rolling history of the last N events. Used by the `SensaInspector` dev component to display the event stream in real time. Its state (`InspectorState`) holds:

```typescript
interface InspectorState {
  events: IkiraroEvent[];
}
```

It has no side effects and no commands — it is a pure observer.

---

## `TranslationRequest` Type

The payload sent to `translation:cmd:request` and `translation:started`:

```typescript
type TranslationRequest = {
  mode: CommunicationMode; // "speech" | "text" | "sign-keys" | "camera-fingerspell"
  text?: string; // for "text" mode
  audio?: Blob; // for "speech" mode (raw recording)
  units?: string[]; // for "sign-keys" mode
  sttModel?: SttModel; // "whisper-large-v3" | "whisper-large-v3-turbo"
  prompt?: string; // Whisper transcription hint
  context?: TranslationContext; // conversation history for contextual gloss
};
```

`TranslationPlugin` uses `planner.canPlan(request)` to select the right planner:

- `mode === "sign-keys"` → `DeterministicUnitsPlanner` (no network)
- `mode === "text" || "speech"` → `GroqSemanticPlanner` (requires API key)
