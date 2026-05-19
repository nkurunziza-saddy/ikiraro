# @ikiraro/sdk

The Ikiraro SDK is the primary entry point for developers building sign language translation and rendering applications. It provides a unified, high-level API by aggregating the core capabilities of the Ikiraro ecosystem:

- **Runtime & Communication** (`@ikiraro/communication`): Managed translation sessions, speech/text capture, and plugin system.
- **Rendering Components** (`@ikiraro/components`): 3D avatar viewers, audio visualizers, and UI primitives.
- **Translation Engine** (`@ikiraro/engine`): Deterministic planning, pose library, and AI-driven gloss generation.

---

## Installation

```bash
npm install @ikiraro/sdk
# or
bun add @ikiraro/sdk
```

## Quick Start

The easiest way to use Ikiraro is through the `useIkiraro` hook, which manages the runtime lifecycle and provides a reactive state snapshot.

```tsx
import { useIkiraro, AvatarViewer } from "@ikiraro/sdk";

function App() {
  const { snapshot, translate, isReady } = useIkiraro({
    sdk: { groqApiKey: "your-api-key" },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Render the 3D Avatar */}
      <AvatarViewer
        envelope={snapshot.lastEnvelope}
        modelUrl="/avatar.glb"
        className="w-full h-[400px]"
      />

      {/* 2. Trigger translation */}
      <input
        placeholder="Type something to sign…"
        disabled={!isReady}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            translate(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />

      {/* 3. Observe status */}
      <p>Status: {snapshot.status}</p>
    </div>
  );
}
```

---

## Key Exports

### Communication & Runtime

- `createIkiraro`: Factory to bootstrap the runtime.
- `useIkiraro`: React hook for easy integration.
- `IkiraroSDK`: Effect-based API for one-off translations.
- `useHandTracking`: Hook for camera-based sign recognition.

### Rendering

- `AvatarViewer`: The primary 3D component for displaying sign language.
- `SignModelGLTF`: Low-level 3D model component (uses `@react-three/fiber`).
- `WebSpeechProvider`: Singleton for Text-to-Speech synchronization.

### Engine Primitives

- `buildPlanFromGloss`: Convert ASL Gloss to a temporal sign plan.
- `buildPlanFromUnits`: Create a deterministic plan from individual sign units.
- `createEnvelope`: Package a plan with input metadata for rendering.
- `RendererDirector`: Orchestrates the animation frame queue.

---

## Advanced Usage

### Manual Runtime Control

If you need control outside of React, you can use the factory directly:

```typescript
import { createIkiraro } from "@ikiraro/sdk";

const runtime = await createIkiraro({
  sdk: { groqApiKey: "..." },
});

runtime.subscribe("translation:finished", (event) => {
  console.log("Translation complete:", event.payload);
});

runtime.dispatch({
  type: "session:cmd:start",
  payload: { mode: "text", text: "Hello world" },
  timestamp: Date.now(),
  source: "app",
});
```

### Deterministic Signing

For fixed phrases or fingerspelling where you don't want AI variance:

```typescript
import { translateUnits } from "@ikiraro/sdk";

// These units correspond to specific poses in the Ikiraro library
translateUnits(["H", "E", "L", "L", "O"]);
```

---

## Package Architecture

The SDK is a "facade" package. It does not contain its own logic but rather re-exports selected stable APIs from internal packages. This ensures that external consumers have a clean, versioned interface while allowing the internal engine to evolve rapidly.

- **Main entry**: `@ikiraro/sdk`
- **Components subpath**: `@ikiraro/sdk/components`
- **Engine subpath**: `@ikiraro/sdk/engine`
