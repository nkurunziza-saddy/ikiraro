---
name: ikiraro
description: "Ikiraro SDK integration guide for sign language translation and 3D rendering. Use when working with @ikiraro/sdk, @ikiraro/runtime, @ikiraro/engine, or @ikiraro/renderer packages. Triggers on: useIkiraro hook usage, useHandTracking, AvatarViewer, ASL/sign language translation, building a text/speech/vision-to-sign pipeline, runtime configuration, plugin authoring, accessibility mode, audio queue, earcons, shortcut manager, or any task involving the Ikiraro monorepo packages."
metadata:
  version: "1.2.0"
  release_date: "2026-05-28"
---

# Ikiraro SDK

Ikiraro bridges AI-driven translation (Groq), deterministic sign planning, and 3D rendering. The SDK (`@ikiraro/sdk`) is a curated facade over three internal packages:

| Package             | Role                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@ikiraro/engine`   | Pure math — no deps. LanguageRegistry, Planners, Compiler, RendererDirector, Kinematic Controller, Trajectory Engine. |
| `@ikiraro/runtime`  | IkiraroRuntime, EventBus, plugins, React hooks, Groq AI services, accessibility system.                               |
| `@ikiraro/renderer` | React UI — AvatarViewer (R3F), AudioVisualizer, AslHandSvg, HandOverlay, WebSpeechProvider.                           |

Install `@ikiraro/sdk` — it re-exports the stable public surface of all three.

---

## Architecture: The "Deep" Engine

The engine follows a **Deep Architecture** pattern:

- **Trajectory Engine:** Decouples sign rhythm (Hold phases) from physical movement.
- **Kinematic Controller:** Uses stateful spring-damper tracking for arm positions.
- **Probabilistic Vision:** Score distribution integration for stable sign detection.

---

## Installation

```bash
bun add @ikiraro/sdk
# required peers
bun add effect three @react-three/fiber @react-three/drei
# optional — only needed if you use useHandTracking / camera sign input
bun add @mediapipe/tasks-vision
```

```bash
# .env
VITE_GROQ_API_KEY=gsk_...
```

Without a Groq key, `DeterministicUnitsPlanner` handles fingerspelling; LLM gloss generation is disabled.

---

## Pattern A — Managed Hook (recommended)

```tsx
// 1. Setup in a shared file (e.g. lib/ikiraro.ts)
import { createIkiraroClient } from "@ikiraro/sdk";

export const ikiraroClient = createIkiraroClient({
  sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
});
export const { useIkiraro, useIkiraroPlugin } = ikiraroClient;

// 2. Consume anywhere
import { AvatarViewer } from "@ikiraro/sdk";

function App() {
  const { snapshot, translate, translateUnits, startSpeech, stopSpeech, isReady } = useIkiraro();

  return (
    <>
      <AvatarViewer
        envelope={snapshot.lastEnvelope}
        modelUrl="/models/avatar.glb"
        className="w-full h-[400px]"
      />
      <input
        disabled={!isReady}
        onKeyDown={(e) => {
          if (e.key === "Enter") translate(e.currentTarget.value);
        }}
      />
      {snapshot.isTranslating && <p>Translating…</p>}
    </>
  );
}
```

**`useIkiraro` full return shape** — see [references/api_reference.md](references/api_reference.md).

`createIkiraroClient` also exposes:

- `ikiraroClient.runtime` — direct access to the underlying `IkiraroRuntime | null`
- `ikiraroClient.start()` — imperatively start the runtime without a React component
- `ikiraroClient.stop()` — imperatively stop the runtime
- `useIkiraroPlugin(pluginName)` — reactive access to a single plugin's state

---

## Pattern B — Hand Tracking (webcam → translate)

```tsx
import { useHandTracking, HandOverlay, AvatarViewer } from "@ikiraro/sdk";
import { useIkiraro } from "@/lib/ikiraro";

function CameraView() {
  const { translate } = useIkiraro();
  const camera = useHandTracking();

  return (
    <div className="relative">
      <video ref={camera.videoRef} autoPlay muted playsInline className="scale-x-[-1]" />
      <HandOverlay tracking={camera.tracking} />
      <button onClick={() => camera.start()}>Start camera</button>
      <button
        onClick={() => {
          translate(camera.tracking.sentenceText);
          camera.clear();
        }}
      >
        Translate
      </button>
      <p>Detected: {camera.tracking.currentWord}</p>
      <p>
        FPS: {camera.fps} — {camera.delegate}
      </p>
    </div>
  );
}
```

`useHandTracking` is independent from `useIkiraro`. Bridge them by passing `tracking.sentenceText` to `translate()`.

---

## Pattern C — Deterministic Signing (no LLM)

```tsx
const { translateUnits } = useIkiraro();

// Fingerspell HELLO — same result every time, no network call
translateUnits(["H", "E", "L", "L", "O"]);

// ASL lexeme codes from the pose library also work
translateUnits(["HELLO", "WORLD"]);
```

`translateUnits` bypasses Groq entirely — identical input always produces identical frames.

---

## Pattern D — One-off translation (no React, no runtime)

```typescript
import { IkiraroSDK } from "@ikiraro/sdk";

// Returns Promise<TranslationEnvelope> — single call, no runtime lifecycle
const envelope = await IkiraroSDK.translateTextAsync("Hello world", {
  groqApiKey: process.env.GROQ_API_KEY,
});
console.log(envelope.plan.glossText); // "HELLO WORLD"

// Speech-to-sign in one call
const envelope = await IkiraroSDK.translateSpeechAsync(audioFile, {
  groqApiKey: process.env.GROQ_API_KEY,
});
```

Use this for server-side scripts or testing outside the browser.

---

## Pattern E — Manual Runtime (outside React)

```typescript
import { createIkiraro } from "@ikiraro/sdk";

const runtime = await createIkiraro({
  sdk: { groqApiKey: "..." },
  keyboard: true, // optional: mount KeyboardPlugin
  plugins: [myPlugin], // optional: custom plugins appended after defaults
});

// Subscribe to a specific event — payload is narrowed by type
runtime.subscribe("translation:finished", ({ payload }) => {
  console.log(payload.plan.glossText);
  console.log(payload.rendererQueue.length, "frames");
});

// Translate
runtime.translate("Hello world");

// Or dispatch low-level commands
runtime.dispatch({
  type: "session:cmd:start",
  payload: { mode: "text", text: "Hello world" },
  timestamp: Date.now(),
  source: "app",
});

// Read synchronous snapshot
const { status, isTranslating, lastEnvelope } = runtime.snapshot();

// Teardown (reverse plugin order)
await runtime.stop();
```

---

## Pattern F — Plugin Authoring

```typescript
import type { IkiraroPlugin, PluginContext, IkiraroEvent } from "@ikiraro/sdk";

interface AnalyticsState {
  translationCount: number;
}

class AnalyticsPlugin implements IkiraroPlugin<AnalyticsState> {
  name = "analytics";
  initialState: AnalyticsState = { translationCount: 0 };

  setup(ctx: PluginContext<AnalyticsState>) {
    // ctx.subscribe is auto-tracked — no manual unsub needed
    ctx.subscribe("translation:finished", ({ payload, timestamp }) => {
      analytics.track("sign_translation", { gloss: payload.plan.glossText, ts: timestamp });
    });

    // Return a disposer (or array of disposers) — called on runtime.stop()
    return () => analytics.flush();
  }

  reducer(state: AnalyticsState, event: IkiraroEvent): AnalyticsState {
    if (event.type === "translation:finished") {
      return { ...state, translationCount: state.translationCount + 1 };
    }
    return state;
  }
}

const runtime = await createIkiraro({
  sdk: { groqApiKey: "..." },
  plugins: [new AnalyticsPlugin()],
});
```

Key rules:

- `ctx.emit(event)` sends an event into the runtime bus. There is no `ctx.dispatch` — use `ctx.emit`.
- `ctx.subscribe()` inside `setup()` is auto-disposed; you don't need to return those unsubscribers.
- Return disposer(s) only for non-ctx cleanup (event listeners, timers, external resources).
- `S` defaults to `unknown` — omit the generic for stateless plugins.
- Plugin state is available at `runtime.getState().plugins[plugin.name]`.

---

## Pattern G — Low-level event access (escape hatch)

```tsx
import { useEffect } from "react";
import { useIkiraro, ikiraroClient } from "@/lib/ikiraro";

function TrackingMonitor() {
  const { isReady } = useIkiraro();

  useEffect(() => {
    if (!isReady) return;
    const runtime = ikiraroClient.runtime;
    if (!runtime) return;

    return runtime.subscribe("vision:tracking", ({ payload }) => {
      console.log("Landmarks:", payload.landmarks);
    });
  }, [isReady]);
}
```

Prefer `onTranslated` and `snapshot.lastEnvelope` for common cases. Use `ikiraroClient.runtime` for raw events not surfaced in the snapshot.

---

## Pattern H — Sign Language Plugins (Multilingual)

```typescript
import { LanguageRegistry, ASLPlugin, RSLPlugin } from "@ikiraro/engine";

// Register available language plugins
LanguageRegistry.register(ASLPlugin);
LanguageRegistry.register(RSLPlugin);

// Set the active language
LanguageRegistry.setActive("rsl");
```

By default, importing `@ikiraro/engine/planning` auto-registers both ASL and RSL and sets ASL as active. Switch languages at runtime by calling `LanguageRegistry.setActive("rsl")` — the engine's next translation will use RSL handshapes and NLP rules.

---

## Pattern I — Accessibility System

The accessibility system is built into `@ikiraro/runtime` and exported from `@ikiraro/sdk`. It provides four independent singletons: a mode manager, a priority audio queue, an earcon player, and a keyboard shortcut manager.

### `useAccessibilityMode()` — React hook

```tsx
import { useAccessibilityMode } from "@ikiraro/sdk";

function AccessibilityToggle() {
  const { mode, setMode, isAvatarSuppressed, isTtsSuppressed } = useAccessibilityMode();

  return (
    <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
      <option value="standard">Standard (all modalities)</option>
      <option value="audio-first">Audio-first (avatar suppressed)</option>
      <option value="visual-first">Visual-first (TTS suppressed)</option>
      <option value="motor">Motor (single-key / switch scanning)</option>
    </select>
  );
}
```

Mode is persisted to `localStorage` under the key `ikiraro:accessibility-mode`.

### `AccessibilityModeManager` — singleton

```typescript
import { accessibilityMode } from "@ikiraro/sdk";

const manager = accessibilityMode(); // same as AccessibilityModeManager.getInstance()
manager.getMode(); // "standard" | "audio-first" | "visual-first" | "motor"
manager.setMode("audio-first");
manager.isAvatarSuppressed(); // true when mode === "audio-first"
manager.isTtsSuppressed(); // true when mode === "visual-first"

const unsub = manager.onModeChange((mode) => console.log("Mode changed:", mode));
unsub(); // cleanup
```

### `AudioQueue` — priority TTS queue

```typescript
import { AudioQueue } from "@ikiraro/sdk";
import { WebSpeechProvider } from "@ikiraro/sdk";

const tts = WebSpeechProvider.getInstance();

// Initialize once — provide speak/cancel implementations
const queue = AudioQueue.getInstance(
  (text) => tts.speak(text),
  () => tts.cancel(),
);

// Fire-and-forget
queue.speak("Hello world", "normal"); // priority: critical > high > normal > low
queue.speak("SYSTEM ALERT", "critical"); // interrupts everything immediately

// Awaitable — resolves when this specific message finishes
await queue.speakAsync("Processing complete", "high");

// Utilities
queue.stop(); // cancel current + clear queue
queue.repeat(); // repeat last spoken message at "high" priority
queue.isSpeaking(); // boolean
queue.getLastMessage(); // string | null
```

Priority rules:

- `low` — dropped if anything else is queued or speaking.
- `normal` — plays in order, waits its turn.
- `high` — interrupts `normal`/`low`, skips lower-priority queued items.
- `critical` — interrupts everything immediately.

### `EarconPlayer` — synthesized audio cues

```typescript
import { EarconPlayer } from "@ikiraro/sdk";

const earcons = EarconPlayer.getInstance();
earcons.play("focus"); // soft blip — navigating to an item
earcons.play("select"); // click — confirming a selection
earcons.play("success"); // ascending tones — action completed
earcons.play("error"); // descending tones — action failed
earcons.play("navigate"); // short swoosh — list navigation
earcons.play("open"); // rising ping — opening content
earcons.play("close"); // falling ping — closing content
```

All tones are generated via Web Audio API — no audio files required. Earcons are suppressed automatically in `visual-first` mode.

### `AccessibilityShortcutManager` — keyboard shortcuts with double-tap

```typescript
import { AccessibilityShortcutManager } from "@ikiraro/sdk";

const shortcuts = new AccessibilityShortcutManager({ doubleTapMs: 400 });

// Register shortcuts
const unsub = shortcuts.register({
  key: "f",
  label: "Read",
  description: "Read current item aloud",
  action: () => queue.speak(currentLabel),
  doubleTapAction: () => queue.speak(fullDescription), // triggered on double-tap
});

shortcuts.registerMany([
  { key: "h", label: "Home", description: "Go to home", action: goHome },
  { key: "s", label: "Sign", description: "Start signing", action: startSign },
]);

shortcuts.mount(); // attach keydown listener to document

// Focus tracking (for screenreader-style navigation)
shortcuts.setFocusedIndex(2);
shortcuts.onFocusChange((idx) => updateHighlight(idx));

// Help panel
shortcuts.setHelpVisible(true);
shortcuts.onHelpToggle((visible) => setHelpOpen(visible));

// Cleanup
unsub();
shortcuts.unmount();
```

---

## Built-in plugins

| Plugin              | Default?      | Description                                                          |
| ------------------- | ------------- | -------------------------------------------------------------------- |
| `SessionPlugin`     | yes           | Orchestrates session lifecycle (idle→recording→translating→finished) |
| `CompositionPlugin` | yes           | Debounces input tokens (400 ms window, 150 ms dedup)                 |
| `TranslationPlugin` | yes           | Routes to GroqSemanticPlanner or DeterministicUnitsPlanner           |
| `SpeechPlugin`      | yes           | MediaRecorder → Groq Whisper → translation:cmd:request               |
| `VisionPlugin`      | vision config | Bridges camera hand-tracking events into the runtime bus             |
| `KeyboardPlugin`    | keyboard:true | Captures A–Z keypresses as sign tokens                               |
| `InspectorPlugin`   | manual        | Records all events (up to 100) for dev tooling                       |

---

## Avatar model requirements

See [references/model_specs.md](references/model_specs.md) for bone naming conventions, rig requirements, and optimization targets.

---

## Deep references

| Topic                          | File                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| Full API types — hook, runtime | [references/api_reference.md](references/api_reference.md) |
| Avatar model bone specs        | [references/model_specs.md](references/model_specs.md)     |

---

## Best practices

- `useIkiraro` is safe to use anywhere — the global client boots the runtime on first mount and tears it down when the last component unmounts (500ms debounce).
- Pre-load the model: `import { preloadAvatarModel } from "@ikiraro/sdk"; preloadAvatarModel("/models/avatar.glb")`.
- Use `snapshot.speechLevel` (0–1) to drive a visual meter during recording.
- `useHandTracking` boots the MediaPipe worker on mount — place it high in the tree so the worker is warm before the user clicks "Start Camera."
- `snapshot.status` tracks the **session** lifecycle phase (`"idle" | "recording" | "translating" | "finished" | "error"`). This is distinct from `runtime:status-change` which tracks the runtime lifecycle (`"idle" | "active" | "processing" | "error"`).
- Plugin state is available under `runtime.getState().plugins[name]` — typed via the `PluginRegistry` type.
- `AudioQueue.getInstance()` must be called with `speakFn`/`cancelFn` on first initialization. Subsequent calls with no args return the existing instance.
