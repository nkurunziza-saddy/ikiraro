# Ikiraro SDK — API Reference

## `useIkiraro(config)`

Primary React hook. Manages the full runtime lifecycle (create → subscribe → cleanup).

```typescript
function useIkiraro(config: { sdk: { groqApiKey: string; groqBaseUrl?: string } }): {
  isReady: boolean;
  error: string | null;
  snapshot: RuntimeSnapshot;
  translate(text: string): void;
  translateUnits(units: string[]): void;
  startSpeech(): void;
  stopSpeech(): void;
  cancel(): void;
  onTranslated(cb: (envelope: TranslationEnvelope) => void): () => void;
  runtime: IkiraroRuntime | null;
};
```

### `RuntimeSnapshot`

```typescript
interface RuntimeSnapshot {
  status: "idle" | "active" | "processing" | "error";
  isTranslating: boolean;
  lastEnvelope: TranslationEnvelope | null;
  compositionTokens: IkiraroToken[];
  compositionText: string;
  speechStatus: "idle" | "capturing" | "error";
  speechLevel: number; // 0–1 normalized audio level
  error: string | null;
}
```

---

## `useHandTracking()`

Creates a singleton `WorkerHandProcessor` + `VisionSystem`. Boots the MediaPipe worker immediately on mount.

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
  clear(): void;
  manualCorrect(sign: string): void;
};
```

### `CameraTrackingState`

```typescript
interface CameraTrackingState {
  landmarks: NormalizedLandmark[][] | null;
  classification: SignClassification | null;
  currentWord: string; // letter being held
  sentence: IkiraroToken[]; // committed tokens this session
  sentenceText: string; // joined display string
  committedToken: SignToken | null; // most recently committed word
}
```

---

## Core Types

### `TranslationEnvelope`

```typescript
interface TranslationEnvelope {
  id: string;
  inputText: string; // original user input
  normalizedText: string; // cleaned / normalized form
  plan: SignPlan;
  createdAt: number; // unix ms
}
```

### `SignPlan`

```typescript
interface SignPlan {
  glossText: string; // ASL gloss string, e.g. "HELLO HOW YOU"
  frames: FrameItem[];
  durationMs: number;
}
```

### `FrameItem` (discriminated union)

```typescript
type FrameItem =
  | { type: "pose"; poseId: string; durationMs: number; blendMode: BlendMode }
  | { type: "pause"; durationMs: number }
  | { type: "spell"; letter: string; durationMs: number };

type BlendMode = "cut" | "ease" | "coarticulate";
```

---

## Components

### `<AvatarViewer />`

```typescript
interface AvatarViewerProps {
  envelope: TranslationEnvelope | null;
  modelUrl: string; // path to .glb, e.g. "/models/avatar.glb"
  className?: string;
}
```

Requires a React Three Fiber canvas context. The component creates its own `<Canvas>` internally.

### `<HandOverlay tracking={CameraTrackingState} />`

Renders landmark skeleton over a `<video>` element. Place as a sibling with `position: absolute`.

### `<AudioVisualizer level={number} count={number} />`

Renders a waveform bar chart from a normalized 0–1 audio level.

### `<AslHandSvg letter={string} size={number} className={string} />`

Renders an SVG hand shape for one ASL fingerspelling letter (A–Z).

### `WebSpeechProvider.getInstance()`

Singleton for TTS. Call `tts.speak(text: string): Promise<void>`.

---

## `createIkiraro(config)` — factory (outside React)

```typescript
async function createIkiraro(config: IkiraroDefaultConfig): Promise<IkiraroRuntime>;

interface IkiraroDefaultConfig {
  sdk: { groqApiKey: string; groqBaseUrl?: string };
  baseUrl?: string;
  vision?: { processor: HandProcessor };
}
```

### `IkiraroRuntime` methods

```typescript
runtime.start(): Promise<void>
runtime.stop(): Promise<void>
runtime.dispatch(event: IkiraroEvent<K>): void
runtime.subscribe(type: K, handler): () => void   // returns unsubscribe
runtime.subscribeAll(handler): () => void
runtime.getState(): IkiraroState
```

---

## Engine primitives

```typescript
import { buildPlanFromGloss, buildPlanFromUnits, createEnvelope } from "@ikiraro/sdk/engine";

// Text/speech path
const plan = buildPlanFromGloss(semanticIntent);

// Deterministic fingerspelling path
const plan = buildPlanFromUnits(["H", "E", "L", "L", "O"]);

// Package into envelope
const envelope = createEnvelope(plan, { mode: "text" });
```
