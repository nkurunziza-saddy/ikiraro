# Ikiraro Bridge

**Ikiraro** (*/ˌi-ki-ˈra-ro/*, Kinyarwanda for *bridge*) is an open-source TypeScript SDK that renders American Sign Language through a 3D avatar — directly in the browser. No server round-trips. No dependencies beyond a WebGL context.

The SDK exposes a complete pipeline from input to motion: text, voice, and camera all feed a single translation engine that produces frame-perfect ASL animation. The avatar is a rigged GLTF mesh driven by dual-spring kinematics for natural human cadence — stiff enough to hit precise sign poses, loose enough to flow between them.

---

## Why Ikiraro

Sign language accessibility has historically required either pre-recorded video clips or server-side avatar rendering services. Both approaches fail at the intersection of dynamism and latency: pre-recorded video cannot handle arbitrary text, and server rendering adds round-trip cost that makes real-time conversation impractical.

Ikiraro moves the entire pipeline into the browser using WebAssembly for ML inference, WebGL for rendering, and the Web Speech API for voice capture. A deaf user on a slow connection gets the same fidelity as one on fiber. The SDK is composable enough to embed in any web application — a video call, a public kiosk, a healthcare portal — without infrastructure changes.

---

## Packages

The SDK is split into four focused packages. Each can be used independently; `@ikiraro/sdk` wires them together.

| Package | Role | Key exports |
|---|---|---|
| `@ikiraro/sdk` | Public API · recommended entry point | `createIkiraroClient`, `useIkiraro` |
| `@ikiraro/engine` | ML inference · sign recognition | `SignAllRecognizer`, `LinguisticBuffer`, `FrameBuilder` |
| `@ikiraro/runtime` | Orchestration · plugin lifecycle | `IkiraroRuntime`, `AudioQueue`, `useAccessibilityMode` |
| `@ikiraro/renderer` | WebGL avatar · visual output | `AvatarViewer`, `HandOverlay`, `AudioVisualizer` |

---

## Installation

```bash
# Full pipeline (recommended)
bun add @ikiraro/sdk @ikiraro/renderer @ikiraro/runtime

# Engine only (for custom rendering or server-side use)
bun add @ikiraro/engine

# npm / pnpm also work
npm install @ikiraro/sdk
pnpm add @ikiraro/sdk
```

---

## Quick Start

### React

```tsx
import { createIkiraroClient } from "@ikiraro/sdk";
import { AvatarViewer } from "@ikiraro/renderer";

const { useIkiraro } = createIkiraroClient({
  sdk: { groqApiKey: "gsk_…" },
});

export function SignApp() {
  const { snapshot, translate, startSpeech, stopSpeech } = useIkiraro();

  return (
    <div>
      {/* 3D avatar — animates automatically when envelope updates */}
      <AvatarViewer
        envelope={snapshot.lastEnvelope}
        modelUrl="/models/avatar.glb"
        style={{ width: "100%", height: "400px" }}
      />

      {/* Text input */}
      <button onClick={() => translate("Hello, how are you?")}>
        Sign it
      </button>

      {/* Voice input */}
      <button
        onMouseDown={startSpeech}
        onMouseUp={stopSpeech}
      >
        Hold to speak
      </button>

      {/* Current sign */}
      <p>{snapshot.lastEnvelope?.normalizedText ?? "Idle"}</p>
    </div>
  );
}
```

### With hand tracking (vision input)

```tsx
import { useHandTracking } from "@ikiraro/runtime/hand-tracking";
import { HandOverlay } from "@ikiraro/renderer";

function VisionInput() {
  const { videoRef, tracking, isActive, start, stop } = useHandTracking();

  return (
    <div style={{ position: "relative" }}>
      <video ref={videoRef} autoPlay playsInline muted />
      <HandOverlay tracking={tracking} />

      <p>Current sign: {tracking.classification?.sign ?? "—"}</p>
      <p>Confidence: {Math.round((tracking.classification?.confidence ?? 0) * 100)}%</p>
      <p>Sentence: {tracking.sentenceText}</p>

      <button onClick={isActive ? stop : () => void start()}>
        {isActive ? "Stop camera" : "Start camera"}
      </button>
    </div>
  );
}
```

---

## How the Pipeline Works

```
Input layer             Translation            Planning              Rendering
────────────────        ───────────────        ──────────────        ──────────────
Text string        →
Voice (Speech API  →    LLM gloss         →    LinguisticBuffer →    FrameBuilder  →  AvatarViewer
  or Whisper)           notation               phonetic              animation        WebGL 3D
Camera (MediaPipe  →    SignAllRecognizer  →    segmentation          envelopes        spring
  landmarks)            centroid match         plateau detect                         physics
```

### Stage 1 — Input

Three input channels feed the pipeline:

- **Text**: A plain string passed to `translate(text)`. Tokenized immediately.
- **Voice**: Web Speech API (via `startSpeech()`) or a Whisper model. The speech transcript is piped to the same translation step as text.
- **Camera**: MediaPipe Hands extracts 21 3D landmarks per hand at up to 30 fps. Landmark streams are processed by the engine's `SignAllRecognizer`.

### Stage 2 — Translation

English text is converted to ASL **gloss notation** — a stripped linguistic representation that removes English morphology and applies ASL grammar rules.

Examples:
```
English → ASL Gloss
"I am going to the store"  →  STORE GO I
"Did you eat?"             →  EAT FINISH YOU?
"I love you"               →  I LOVE YOU
```

Gloss reordering follows topic-comment structure, applies NMM (non-manual markers) tokens for questions, and handles temporal aspect for verbs. The translation is performed by a small LLM prompt (Groq by default) but the client is configurable — any function that returns gloss given English works.

### Stage 3 — Lexeme planning

The `LinguisticBuffer` receives the gloss stream and:

1. Groups tokens into phonetic windows using a sliding temporal buffer.
2. Identifies sign boundaries using **velocity-based plateau detection** — a research-informed algorithm that finds the deceleration and hold phase between signs. This reduces pipeline latency by approximately 250 ms compared to frame-counting approaches.
3. Emits `LexemeEnvelope` objects: normalized sign tokens with timing metadata.

### Stage 4 — Frame building

`FrameBuilder` converts lexeme envelopes into animation envelopes:

1. Looks up each sign in the motion library (a set of pre-authored keyframe sequences).
2. Applies **coarticulation** — the spatial blending of the hand trajectory between the exit pose of sign *n* and the entry pose of sign *n+1*. Without coarticulation, signed sentences look mechanical; with it, they approximate natural Deaf fluency.
3. Computes transition curves using a `cubic-bezier(0.34, 1.02, 0.64, 1)` easing — slightly springy on arrival, matching the motor signature of human sign production.
4. Emits the final `AnimationEnvelope` consumed by the renderer.

### Stage 5 — Rendering

`AvatarViewer` drives a rigged GLTF avatar:

- **Dual-spring kinematics**: Each joint runs two parallel spring systems. The *reach spring* (high stiffness, low damping) handles large-amplitude motion like shoulder abduction and elbow extension. The *shape spring* (lower stiffness, higher damping) handles fine fingershape precision. The two layers are summed before application, producing motion that feels both accurate and natural.
- **60 fps target**: The animation loop runs via `requestAnimationFrame` and skips frames under load rather than queuing, preventing the avatar from falling behind the audio stream.
- **GLTF standard**: Any rigged avatar exported as `.glb` with the standard human skeleton works. The default model ships with the renderer package.

---

## Architecture Deep-Dive

### `SignAllRecognizer`

The vision engine uses **orientation-invariant Procrustes alignment** to normalize hand landmarks before matching:

1. Translate landmarks so the wrist is at the origin.
2. Scale so the middle finger MCP joint is at unit distance.
3. Apply an SVD-based rotation to align the palm normal with the canonical orientation.
4. Compute cosine similarity against ~200 ASL sign centroids (derived from research-grade mocap datasets).

This makes recognition invariant to signer handedness, camera angle, and arm position — critical for real-world use where the camera is not ideally positioned.

### `LinguisticBuffer`

The buffer implements a **three-phase phonological window**:

```
Preparation → Stroke → Hold → Retraction
              └─ sign duration ─┘
```

The velocity plateau (near-zero velocity during the hold phase) is detected using a weighted moving average of landmark velocity. The buffer fires a sign detection event at the start of the hold phase rather than the end, eliminating the retraction delay from the user experience.

### `FrameBuilder` and coarticulation

Coarticulation in Ikiraro is implemented as **spatial path interpolation** between sign exit and sign entry poses. For each pair of adjacent signs:

1. Compute the dominant hand's exit vector (velocity direction at the end of sign *n*).
2. Compute the entry vector (velocity direction at the start of sign *n+1*).
3. Generate a cubic Bézier path that transitions smoothly between the two, respecting the "path holds" that characterize natural ASL production.

The transition duration is computed from the linguistic distance between signs — longer for phonologically dissimilar pairs — with a minimum of 80 ms and a maximum of 220 ms.

---

## API Reference

### `createIkiraroClient(config)`

Creates a client instance with a bound `useIkiraro` hook.

```ts
const { useIkiraro } = createIkiraroClient({
  sdk: {
    groqApiKey: string;       // required for LLM translation
    model?: string;           // default: "llama-3.1-8b-instant"
  };
  runtime?: {
    accessibilityMode?: "standard" | "audio-first" | "visual-first";
    plugins?: IkiraroPlugin[];
  };
});
```

### `useIkiraro()`

```ts
const {
  snapshot,       // IkiraroSnapshot — reactive state
  translate,      // (text: string) => void
  startSpeech,    // () => void
  stopSpeech,     // () => void
  onTranslated,   // (cb: (envelope: AnimationEnvelope) => void) => () => void
} = useIkiraro();
```

**`snapshot` shape:**

```ts
interface IkiraroSnapshot {
  lastEnvelope:    AnimationEnvelope | null;
  isTranslating:   boolean;
  speechStatus:    "idle" | "capturing" | "processing";
  speechLevel:     number;          // 0–1 audio amplitude
  error:           string | null;
}
```

### `AvatarViewer`

```tsx
<AvatarViewer
  envelope={snapshot.lastEnvelope}   // AnimationEnvelope | null | undefined
  modelUrl="/models/avatar.glb"       // path to .glb file
  className="w-full h-full"
/>
```

### `useHandTracking()`

```ts
const {
  videoRef,      // RefObject<HTMLVideoElement> — attach to <video>
  tracking,      // HandTrackingState
  isActive,      // boolean
  fps,           // number
  delegate,      // "GPU" | "CPU" | null
  start,         // () => Promise<void>
  stop,          // () => void
} = useHandTracking();
```

**`tracking` shape:**

```ts
interface HandTrackingState {
  landmarks:      NormalizedLandmark[][] | null;
  classification: { sign: string; confidence: number } | null;
  currentWord:    string;
  sentenceText:   string;
}
```

### `AudioQueue`

```ts
const queue = AudioQueue.getInstance(
  (text) => tts.speak(text),   // speak function
  () => tts.cancel(),           // cancel function
);

queue.speak(text, "normal");    // priority: "critical" | "normal" | "low"
queue.cancel();
queue.clear();
```

### `useAccessibilityMode()`

```ts
const { mode, setMode } = useAccessibilityMode();
// mode: "standard" | "audio-first" | "visual-first"
```

---

## Plugin System

Every input and output adapter in Ikiraro is a plugin. You can add new ones or replace built-ins without touching the core pipeline.

```ts
import type { IkiraroPlugin } from "@ikiraro/runtime";

const transcriptPlugin: IkiraroPlugin = {
  name: "transcript-overlay",
  onTranslated(envelope, runtime) {
    document.getElementById("transcript")!.textContent =
      envelope.normalizedText;
  },
};

const { useIkiraro } = createIkiraroClient({
  sdk: { groqApiKey: "gsk_…" },
  runtime: { plugins: [transcriptPlugin] },
});
```

**Plugin lifecycle hooks:**

| Hook | When it fires |
|---|---|
| `onMount(runtime)` | Plugin registered |
| `onTranslated(envelope, runtime)` | Each completed translation |
| `onSpeechStart(runtime)` | Voice capture begins |
| `onSpeechEnd(transcript, runtime)` | Voice capture ends |
| `onError(error, runtime)` | Any pipeline error |
| `onUnmount(runtime)` | Plugin removed |

---

## Accessibility Modes

The runtime ships three modes that control which plugins activate and what sensory output is produced:

| Mode | Description |
|---|---|
| `standard` | All inputs and outputs active. Default. |
| `audio-first` | Prioritizes audio cues; avatar animation is secondary. For users who rely primarily on audio feedback. |
| `visual-first` | No audio output. For deaf users for whom audio prompts would be intrusive or meaningless. |

Mode is set at initialization or changed at runtime via `setMode()`. It gates the audio queue, earcon system, and any plugins that check `runtime.accessibilityMode`.

---

## Development

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- Node.js ≥ 20 (for tooling)

### Setup

```bash
git clone https://github.com/nkurunziza-saddy/ikiraro
cd ikiraro
bun install
```

### Running the web app

```bash
cd apps/web
bun dev
```

### Running tests

```bash
# Engine unit tests (Vitest)
cd packages/engine
bun test

# Type check all packages
bun run check-types
```

### Monorepo structure

```
ikiraro/
├── apps/
│   └── web/                    # Marketing site + playground (TanStack Start)
├── packages/
│   ├── engine/                 # ML inference, sign recognition, planning
│   │   └── src/
│   │       ├── planning/       # FrameBuilder, coarticulation, trajectories
│   │       └── vision/         # SignAllRecognizer, LinguisticBuffer, pipeline
│   ├── runtime/                # IkiraroRuntime, plugins, audio, accessibility
│   ├── renderer/               # AvatarViewer, HandOverlay, Three.js integration
│   └── sdk/                    # Public API, createIkiraroClient, useIkiraro
└── README.md
```

---

## Contributing

Contributions are welcome. Before opening a pull request:

1. Check the open issues for existing discussion on your topic.
2. For substantial changes, open an issue first to discuss approach.
3. Run `bun test` and `bun run check-types` before pushing.
4. Keep pull requests focused — one concern per PR.

The areas most in need of contribution:

- **More sign coverage**: The current centroid library covers ~200 common ASL signs. Expanding it requires mocap data and validation against native signers.
- **Non-ASL languages**: The architecture supports other sign languages; the bottleneck is linguistic data and gloss translation models.
- **Avatar quality**: The default GLTF avatar is functional but not expressive. Contributions of higher-quality rigs are welcome.

---

## License

MIT — see [LICENSE](./LICENSE).

---

*ikiraro — bridge.*
