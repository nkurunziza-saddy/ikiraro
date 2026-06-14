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
    groqApiKey: process.env.VITE_GROQ_API_KEY
  },
  keyboard: true // Optional: Enable keyboard input
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
