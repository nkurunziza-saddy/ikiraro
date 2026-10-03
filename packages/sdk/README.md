# @ikiraro/sdk

The official SDK for the Ikiraro sign language platform. This package provides the primary entry point for React applications, encapsulating the entire translation and animation pipeline.

## Installation

```bash
npm install @ikiraro/sdk
# Required peers
npm install effect three @react-three/fiber @react-three/drei
# Optional (for camera tracking)
npm install @mediapipe/tasks-vision
```

### Install the Agent Skill

If you are working with an AI coding assistant (like Claude or Gemini), install the SDK skill to give the agent context about the codebase:

```bash
npx ikiraro-sdk
```

## Integration entries

| Import                    | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `@ikiraro/sdk`            | Existing React facade and hooks                                 |
| `@ikiraro/sdk/core`       | Runtime and translation planners without React or WebGL imports |
| `@ikiraro/sdk/engine`     | Sign planning, frames, kinematics, and output adapters          |
| `@ikiraro/sdk/vision`     | Landmark recognition and buffering without a camera dependency  |
| `@ikiraro/sdk/components` | Browser presentation components                                 |

Deterministic signing works without credentials:

```ts
import { createIkiraro } from "@ikiraro/sdk/core";

const runtime = await createIkiraro();
const unsubscribe = runtime.onTranslated((envelope) => {
  // Send rendererQueue to your renderer or device adapter.
  console.log(envelope.rendererQueue);
});
runtime.translateUnits(["HELLO", "A", "B"]);
// When finished: unsubscribe(); await runtime.stop();
```

Supply `sdk: { groqApiKey }` for the built-in semantic provider, or supply
`planners: [{ canPlan(request), async plan(request) }]` for your own provider.
Custom planners take precedence; their optional `dispose()` is called on shutdown.
Text/speech requests without a matching provider produce a translation error.

For a native render loop, construct `new RendererDirector(canvas, null)`, set
its queue, call `play()`, and call `advance(elapsedMilliseconds)` each tick.
The default constructor retains browser animation-frame scheduling. A custom
`PlaybackClock` is also accepted. `SignCanvas.setLeftPose` optionally receives
independent left-hand shapes; existing single-hand adapters remain compatible.

`AvatarViewer` fills its parent without requiring Tailwind CSS. Give the parent
a height, or pass `style={{ height: 480 }}` to the viewer.

The bundled recognizer is a template-based fingerspelling baseline. It does
not recognize continuous ASL conversations. Its scores are similarities, not
calibrated probabilities. Sustained holds produce one letter; explicit movement
followed by a stable pose can release a repeated letter.

## Core Components

- **`IkiraroRuntime`**: The main class for non-React environments.
- **`createIkiraroClient`**: The factory for React hooks and state management.
- **`AvatarViewer`**: The high-performance 3D component for sign rendering.

## Usage

### 1. Initialize the Client

```tsx
import { createIkiraroClient } from "@ikiraro/sdk";

export const { useIkiraro, useIkiraroPlugin } = createIkiraroClient({
  sdk: {
    groqApiKey: process.env.VITE_GROQ_API_KEY,
  },
  keyboard: true, // Optional: Enable keyboard input
});
```

### 2. Connect the Camera

```tsx
import { useHandTracking } from "@ikiraro/sdk";

function CameraView() {
  const { start, stop, status } = useHandTracking();
  // ...
}
```

### 3. Render the Avatar

```tsx
import { AvatarViewer } from "@ikiraro/sdk";

function Avatar() {
  const { snapshot } = useIkiraro();
  return <AvatarViewer envelope={snapshot.lastEnvelope} modelUrl="/avatar.glb" />;
}
```

## Professional Features

### Orientation-Invariant Recognition

Our `SignAllRecognizer` uses Procrustes alignment to ensure accurate matching regardless of the user's hand angle relative to the camera.

### SOTA Latency Reduction

By using velocity-based plateau detection, the SDK identifies and commits signs the instant they are formed, bypassing traditional timeout-based delays.

## Documentation

For full API reference and advanced guides, visit [the docs folder](https://github.com/nkurunziza-saddy/ikiraro/tree/main/docs).
