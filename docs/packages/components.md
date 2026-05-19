# @ikiraro/components

The components package is the React UI layer of the Ikiraro SDK. It provides the 3D sign player, hand tracking overlay, audio visualizer, TTS controls, and a full set of Shadcn UI primitives.

**Package name**: `@ikiraro/components`

**Exports**:

- `.` → `src/index.ts` — all components and utilities
- `./ui/*` → individual Shadcn components (tree-shakeable)
- `./web-speech` → `WebSpeechProvider` singleton

---

## Sign Rendering

### `SignPlayer3D` (`src/sign-player-3d.tsx`)

The primary sign output component. Renders a 3D hand model animated by `RendererDirector`.

```typescript
function SignPlayer3D(props: {
  envelope: TranslationEnvelope | null;
  modelUrl?: string; // GLTF model URL for realistic hand
  autoPlay?: boolean;
  loop?: boolean;
}): JSX.Element;
```

When `envelope` changes:

1. Calls `director.setQueue(envelope.rendererQueue)`.
2. If `autoPlay` (default true) → `director.play()`.

Internally creates a React Three Fiber `<Canvas>` with a three-point lighting rig and renders either:

- `<SignModelGLTF>` — if `modelUrl` is provided (realistic GLTF hand model).
- `<SignModelProcedural>` — procedurally generated 3D hand using cylinder geometry (no external asset required).

Both models implement `SignCanvas` by reading the handshape prop and updating joint rotations. `RendererDirector` drives them by calling `setPose(handshape)` on each tick.

**Playback controls**: exposes `PlaybackControls` child component with play/pause, progress bar, and speed selector.

### `SignModelGLTF` (`src/sign-model-gltf.tsx`)

Loads a GLTF hand model and applies `Handshape` joint angles using the model's bone hierarchy. Requires a skinned mesh with named bones matching the Ikiraro convention (wrist, index_proximal, etc.).

### `SignModelProcedural` (`src/sign-model-procedural.tsx`)

Builds a hand from `CylinderGeometry` primitives — no external model required. Joints are positioned based on the `Handshape` angles directly. Less realistic but always available.

### `PlaybackControls` (`src/playback-controls.tsx`)

```typescript
function PlaybackControls(props: { director: RendererDirector }): JSX.Element;
```

Renders play/pause button, progress slider, and speed selector (0.5×, 1×, 1.5×, 2×). Subscribes to `RendererState` via `director.subscribe(cb)`.

---

## Vision Display

### `HandOverlay` (`src/hand-overlay.tsx`)

SVG overlay that renders MediaPipe hand landmarks on top of the camera feed.

```typescript
function HandOverlay(props: { tracking: CameraTrackingState }): JSX.Element;
```

Draws:

- 21 landmark dots (scaled by palm size for visibility).
- Hand connections (21 bones) as SVG lines.
- Mirrors x-coordinates (`1 - x`) to compensate for the mirrored video feed.

Requires `CameraTrackingState.landmarks` (image landmarks in [0,1]).

### `ASLHandSVG` (`src/asl-hand-svg.tsx`)

Static SVG illustration of an ASL hand sign — used in the sign keyboard for letter reference.

---

## Translation View

### `PipelineView` (`src/pipeline-view.tsx`)

Displays the full translation output in a structured layout:

```typescript
function PipelineView(props: {
  envelope: TranslationEnvelope | null;
  modelUrl?: string;
}): JSX.Element;
```

Sections:

- Source text and gloss text side by side.
- Track, strategy, confidence stats.
- `SignPlayer3D` for visual execution.
- Renderer steps — a chip for each `FrameItem` label.
- Planner notes (from `plan.metadata.notes`).

Shows "Waiting for Input" when `envelope` is null.

---

## Audio

### `AudioVisualizer` (`src/audio-visualizer.tsx`)

```typescript
function AudioVisualizer(props: { level: number; isActive: boolean }): JSX.Element;
```

Real-time audio level bar (0–1 normalized). Renders a vertical bar that fills proportionally to `level`. Used in `SpeechComposer` to show mic activity.

### `TtsControls` (`src/tts-controls.tsx`)

```typescript
function TtsControls(props: { text: string; label?: string }): JSX.Element;
```

"Speak" button that calls `WebSpeechProvider.getInstance().speak(text)` on click.

---

## Text-to-Speech (`src/web-speech.ts`)

`WebSpeechProvider` — singleton wrapper over the browser `SpeechSynthesis` API:

```typescript
class WebSpeechProvider {
  static getInstance(): WebSpeechProvider;
  static isSupported(): boolean;
  speak(text: string, options?: SpeakOptions): Promise<void>;
  speakQueue(texts: string[], options?: SpeakOptions): Promise<void>;
  cancel(): void;
  isSpeaking(): boolean;
  getVoices(): SpeechSynthesisVoice[];
  dispose(): void;
}

interface SpeakOptions {
  rate?: number; // default 1.0
  pitch?: number; // default 1.0
  volume?: number; // default 1.0
  voiceName?: string;
  lang?: string; // default "en-US"
}
```

Used in `CameraPanel` to speak committed fingerspelled words via TTS (accessibility feature — lets a Deaf user's fingerspelling be heard by the hearing partner in real time).

---

## Loader (`src/loader.tsx`)

```typescript
function Loader(props: { message?: string }): JSX.Element;
```

Full-screen loading indicator with optional message. Used while MediaPipe loads.

---

## Shadcn UI Components (`src/ui/`)

A full set of 20+ Shadcn/UI components, exported at `@ikiraro/components/ui/<name>`:

| Component                          | Import                                 |
| ---------------------------------- | -------------------------------------- |
| `Button`                           | `@ikiraro/components/ui/button`        |
| `Input`, `Textarea`                | `@ikiraro/components/ui/input`         |
| `Select`                           | `@ikiraro/components/ui/select`        |
| `Switch`, `Checkbox`, `RadioGroup` | `@ikiraro/components/ui/switch` etc.   |
| `Alert`                            | `@ikiraro/components/ui/alert`         |
| `Badge`                            | `@ikiraro/components/ui/badge`         |
| `Avatar`                           | `@ikiraro/components/ui/avatar`        |
| `Accordion`, `Collapsible`         | `@ikiraro/components/ui/accordion`     |
| `DropdownMenu`, `Popover`          | `@ikiraro/components/ui/dropdown-menu` |
| `Drawer`                           | `@ikiraro/components/ui/drawer`        |
| `Tabs`                             | `@ikiraro/components/ui/tabs`          |
| `Tooltip`                          | `@ikiraro/components/ui/tooltip`       |
| `Separator`                        | `@ikiraro/components/ui/separator`     |
| `Skeleton`                         | `@ikiraro/components/ui/skeleton`      |
| `Spinner`                          | `@ikiraro/components/ui/spinner`       |
| `Sonner` (toast)                   | `@ikiraro/components/ui/sonner`        |
| `Toggle`, `ToggleGroup`            | `@ikiraro/components/ui/toggle`        |
| `Label`                            | `@ikiraro/components/ui/label`         |
| `Empty`                            | `@ikiraro/components/ui/empty`         |

All components use Tailwind CSS classes. None introduce custom CSS.

---

## Component Index (`src/index.ts`)

Components available at `@ikiraro/components` (flat import):

```typescript
// Sign rendering
export { SignPlayer3D } from "./sign-player-3d";
export { SignModelGLTF } from "./sign-model-gltf";
export { SignModelProcedural } from "./sign-model-procedural";
export { PlaybackControls } from "./playback-controls";

// Vision
export { HandOverlay } from "./hand-overlay";
export { ASLHandSVG } from "./asl-hand-svg";

// Translation view
export { PipelineView } from "./pipeline-view";

// Audio
export { AudioVisualizer } from "./audio-visualizer";
export { TtsControls } from "./tts-controls";
export { WebSpeechProvider } from "./web-speech";

// UI utilities
export { Loader } from "./loader";
export { Button } from "./ui/button"; // and other ui/* components
```

---

## Dependencies

| Dependency                | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `@react-three/fiber`      | React renderer for Three.js                     |
| `@react-three/drei`       | Three.js helpers (OrbitControls, useGLTF, etc.) |
| `framer-motion`           | Animation for UI transitions                    |
| `sonner`                  | Toast notification system                       |
| `lucide-react`            | Icon set                                        |
| `cmdk`                    | Command menu primitive                          |
| `vaul`                    | Drawer primitive                                |
| `@base-ui/react`          | Accessible UI primitives                        |
| `tailwind-merge` + `clsx` | Conditional Tailwind class merging              |
