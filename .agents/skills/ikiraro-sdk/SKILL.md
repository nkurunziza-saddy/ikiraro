---
name: ikiraro-sdk
description: "Ikiraro SDK integration guide for sign language translation and 3D rendering. Use when working with @ikiraro/sdk, @ikiraro/runtime, @ikiraro/engine, or @ikiraro/renderer packages. Triggers on: useIkiraro hook usage, useHandTracking, AvatarViewer, ASL/sign language translation, building a text/speech/vision-to-sign pipeline, runtime configuration, plugin authoring, or any task involving the Ikiraro monorepo packages."
metadata:
  version: "1.0.3"
  release_date: "2026-05-20"
---

# Ikiraro SDK

Ikiraro bridges AI-driven translation (Groq), deterministic sign planning, and 3D rendering. The SDK is a facade over three packages:

| Package             | Role                                                 |
| ------------------- | ---------------------------------------------------- |
| `@ikiraro/runtime`  | Runtime, hooks, plugins, Groq AI services            |
| `@ikiraro/renderer` | React UI — AvatarViewer, AudioVisualizer, AslHandSvg |
| `@ikiraro/engine`   | Pure math — pose library, planners, RendererDirector |

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
import { useIkiraro, AvatarViewer } from "@ikiraro/sdk";

function App() {
  const { snapshot, translate, translateUnits, startSpeech, stopSpeech, isReady } = useIkiraro({
    sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
  });

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

**`useIkiraro` full return** — see [references/api_reference.md](references/api_reference.md).

---

## Pattern B — Hand Tracking (webcam)

```tsx
import { useHandTracking, HandOverlay, AvatarViewer } from "@ikiraro/sdk";
import { useIkiraro } from "@ikiraro/sdk";

function CameraView() {
  const { translateUnits } = useIkiraro({ sdk: { groqApiKey: "..." } });
  const camera = useHandTracking();

  return (
    <div className="relative">
      <video ref={camera.videoRef} autoPlay muted playsInline />
      <HandOverlay tracking={camera.tracking} />
      <button onClick={() => camera.start()}>Start camera</button>
      {camera.tracking.committedToken && (
        <button onClick={() => translateUnits([camera.tracking.committedToken!.value])}>
          Sign it
        </button>
      )}
    </div>
  );
}
```

---

## Pattern C — Deterministic Signing (no LLM)

```tsx
const { translateUnits } = useIkiraro({ sdk: { groqApiKey: "..." } });

// Fingerspell HELLO without any network call
translateUnits(["H", "E", "L", "L", "O"]);
```

`translateUnits` is always called from the hook — it is not a standalone export.

---

## Pattern D — One-off translation (no runtime)

```typescript
import { translate } from "@ikiraro/sdk";

// Returns Promise<TranslationEnvelope> — no runtime lifecycle needed
const envelope = await translate("Hello world", {
  groqApiKey: process.env.GROQ_API_KEY,
});
console.log(envelope.plan.glossText); // "HELLO WORLD"
```

## Pattern E — Manual Runtime (outside React)

```typescript
import { createIkiraro } from "@ikiraro/sdk";

const runtime = await createIkiraro({ sdk: { groqApiKey: "..." } });

runtime.subscribe("translation:finished", (e) => {
  console.log(e.payload); // TranslationEnvelope
});

runtime.dispatch({
  type: "session:cmd:start",
  payload: { mode: "text", text: "Hello world" },
  timestamp: Date.now(),
  source: "app",
});
```

---

## Avatar model requirements

See [references/model_specs.md](references/model_specs.md) for bone naming conventions, rig requirements, and optimization targets.

---

## Deep references

| Topic                            | File                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| Hook API, types, RuntimeSnapshot | [references/api_reference.md](references/api_reference.md) |
| Avatar model bone specs          | [references/model_specs.md](references/model_specs.md)     |
| All 34 runtime events            | `docs/event-system.md`                                     |
| Input → motion data flow         | `docs/data-flow.md`                                        |
| Plugin authoring                 | `docs/packages/runtime.md`                                 |

---

## Best practices

- Mount `useIkiraro` at a high level — avoid re-creating the runtime on route changes.
- Pre-load the model: `import { useGLTF } from "@react-three/drei"; useGLTF.preload("/models/avatar.glb")`.
- Use `snapshot.speechLevel` (0–1) to drive a visual meter during recording.
- `useHandTracking` boots the MediaPipe worker on mount — place it high in the tree so the worker is warm before the user clicks "Start Camera."
