---
name: ikiraro
description: "Ikiraro SDK integration guide for sign language translation and 3D rendering. Use when working with @ikiraro/sdk, @ikiraro/runtime, @ikiraro/engine, or @ikiraro/renderer packages. Triggers on: useIkiraro hook usage, useHandTracking, AvatarViewer, ASL/sign language translation, building a text/speech/vision-to-sign pipeline, runtime configuration, plugin authoring, or any task involving the Ikiraro monorepo packages."
metadata:
  version: "1.1.0"
  release_date: "2026-05-22"
---

# Ikiraro SDK

Ikiraro bridges AI-driven translation (Groq), deterministic sign planning, and 3D rendering. The SDK (`@ikiraro/sdk`) is a curated facade over three internal packages:

| `@ikiraro/engine`   | Pure math — no deps. LanguageRegistry, Planners, Compiler, RendererDirector, **Kinematic Controller, Trajectory Engine**. |
| `@ikiraro/runtime`  | IkiraroRuntime, EventBus, plugins, React hooks, Groq AI services.            |
| `@ikiraro/renderer` | React UI — AvatarViewer (R3F), AudioVisualizer, AslHandSvg, HandOverlay, WebSpeechProvider |

Install `@ikiraro/sdk` — it re-exports the stable public surface of all three.

---

## Architecture: The "Deep" Engine

The engine follows a **Deep Architecture** pattern, providing high-leverage abstractions:

- **Trajectory Engine:** Decouples sign rhythm (Hold phases) from physical movement.
- **Kinematic Controller:** Uses stateful spring-damper tracking for arm positions.
- **Probabilistic Vision:** Uses score distribution integration for stable sign detection.

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
export const { useIkiraro } = ikiraroClient;

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

---

## Pattern B — Hand Tracking (webcam → translate)

```tsx
import { useHandTracking, HandOverlay, AvatarViewer } from "@ikiraro/sdk";
import { useIkiraro } from "@/lib/ikiraro"; // Import your global hook

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

- `teardown()` does **not** exist — put all cleanup in the `setup()` return value.
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

Prefer `onTranslated` and the typed helpers for common cases. Use `ikiraroClient.runtime` for events not surfaced in the snapshot.

---

## Built-in plugins

| Plugin              | Default?       | Description                                                          |
| ------------------- | -------------- | -------------------------------------------------------------------- |
| `SessionPlugin`     | yes            | Orchestrates session lifecycle (idle→recording→translating→finished) |
| `CompositionPlugin` | yes            | Debounces input tokens (400 ms window, 150 ms dedup)                 |
| `TranslationPlugin` | yes            | Routes to GroqSemanticPlanner or DeterministicUnitsPlanner           |
| `SpeechPlugin`      | yes            | MediaRecorder → Groq Whisper → translation:cmd:request               |
| `VisionPlugin`      | vision config  | Bridges camera hand-tracking events into the runtime bus             |
| `KeyboardPlugin`    | keyboard: true | Captures A–Z keypresses as sign tokens                               |
| `InspectorPlugin`   | manual         | Records all events (up to 100) for dev tooling                       |

---

## Pattern H — Sign Language Plugins (Multilingual)

The engine now supports dynamic sign language switching via the `LanguageRegistry` and `SignLanguagePlugin` interface.

```typescript
import { LanguageRegistry, ASLPlugin, RSLPlugin } from "@ikiraro/engine";

// 1. Register available language plugins
LanguageRegistry.register(ASLPlugin);
LanguageRegistry.register(RSLPlugin);

// 2. Set the active language
LanguageRegistry.setActive("rsl");
```

**Note for Web/React usage:**
By default, importing `@ikiraro/engine/planning` auto-registers both ASL and RSL and sets ASL as active. If you need to switch languages in the UI, simply call `LanguageRegistry.setActive("rsl")` and the engine's next translation will automatically use RSL handshapes, NLP rules, and fingerspelling semantics.

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

- `useIkiraro` is safe to use anywhere — the global client automatically boots the runtime on the first mount and gracefully tears it down when the last component unmounts (with a 500ms debounce).
- Pre-load the model: `import { preloadAvatarModel } from "@ikiraro/sdk"; preloadAvatarModel("/models/avatar.glb")`.
- Use `snapshot.speechLevel` (0–1) to drive a visual meter during recording.
- `useHandTracking` boots the MediaPipe worker on mount — place it high in the tree so the worker is warm before the user clicks "Start Camera."
- `snapshot.status` tracks the **session** lifecycle phase (`"idle" | "recording" | "translating" | "finished" | "error"`). This is distinct from the internal `runtime:status-change` event which tracks the runtime lifecycle.
- Plugin state is available under `runtime.getState().plugins[name]` — typed if you use the `PluginRegistry` type.
