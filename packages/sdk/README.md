# @ikiraro/sdk

Sign language translation and rendering SDK — convert text or speech to ASL signing, powered by Groq and rendered through a 3D avatar or custom canvas.

## Install

```bash
npm install @ikiraro/sdk
# peer dependencies
npm install react react-dom three effect
# optional — for camera / hand-tracking input
npm install @mediapipe/tasks-vision
```

```bash
# .env
VITE_GROQ_API_KEY=gsk_...
```

## Quick start

```tsx
// lib/ikiraro.ts — initialize once globally
import { createIkiraroClient } from "@ikiraro/sdk";

export const ikiraroClient = createIkiraroClient({
  sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
});
export const { useIkiraro } = ikiraroClient;
```

```tsx
// App.tsx — consume anywhere
import { AvatarViewer } from "@ikiraro/sdk";
import { useIkiraro } from "@/lib/ikiraro";

function SigningApp() {
  const { snapshot, translate, startSpeech, stopSpeech, isReady } = useIkiraro();

  return (
    <>
      <AvatarViewer
        envelope={snapshot.lastEnvelope}
        modelUrl="/models/avatar.glb"
        className="w-full h-[400px]"
      />
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter") translate(e.currentTarget.value);
        }}
        placeholder="Type to sign…"
        disabled={!isReady}
      />
    </>
  );
}
```

## `createIkiraroClient(config)` — React client factory

Creates and manages a reference-counted `IkiraroRuntime`. Config is read-once at creation.

```ts
const ikiraroClient = createIkiraroClient({
  sdk: {
    groqApiKey: string,   // required
    groqBaseUrl?: string, // optional — proxy or self-hosted Groq endpoint
  },
  vision?: {
    processor: HandProcessor, // optional — enable hand-tracking plugin
  },
  keyboard?: boolean,         // optional — mount KeyboardPlugin (A–Z → sign tokens)
  plugins?: IkiraroPlugin[],  // optional — custom plugins appended after defaults
});
```

The client exposes:

```ts
ikiraroClient.useIkiraro(); // React hook — mounts/unmounts reference automatically
ikiraroClient.useIkiraroPlugin(name); // React hook — typed access to a single plugin's state
ikiraroClient.runtime; // IkiraroRuntime | null — direct access
ikiraroClient.start(); // Promise<IkiraroRuntime> — imperatively start
ikiraroClient.stop(); // Promise<void> — imperatively stop
```

## `useIkiraro()` — hook

```ts
const {
  isReady, // boolean — true once the runtime is initialized
  error, // string | null — set if initialization fails
  snapshot, // RuntimeSnapshot — reactive flat state
  translate, // (text, options?) => void
  translateUnits, // (units: string[]) => void — for sign keyboard input
  startSpeech, // (options?) => void — begin mic capture
  stopSpeech, // () => void — stop and transcribe
  cancel, // () => void — cancel in-progress capture or translation
  onTranslated, // (handler) => () => void — imperative subscription
} = useIkiraro();
```

### `RuntimeSnapshot`

All runtime state in a single flat object — no nested plugin paths.

```ts
snapshot.status; // "idle" | "recording" | "translating" | "finished" | "error"
snapshot.isTranslating; // boolean
snapshot.lastEnvelope; // TranslationEnvelope | null — the latest signed translation
snapshot.speechStatus; // "idle" | "capturing" | "processing" | "error"
snapshot.speechLevel; // number — mic input level (0–1) for visualizers
snapshot.compositionTokens; // IkiraroToken[] — live token stream from all inputs
snapshot.compositionText; // string — joined token text
snapshot.error; // string | null — last translation error
```

### Reacting to results

```tsx
// Via React state (recommended)
const { snapshot } = useIkiraro();

useEffect(() => {
  if (!snapshot.lastEnvelope) return;
  console.log(snapshot.lastEnvelope.plan.glossText);
}, [snapshot.lastEnvelope]);

// Via imperative subscription (for non-React callbacks)
const { onTranslated, isReady } = useIkiraro();

useEffect(() => {
  if (!isReady) return;
  return onTranslated((envelope) => {
    myAnalytics.track("translation", envelope);
  });
}, [isReady, onTranslated]);
```

## `AvatarViewer` — 3D signing avatar

Drop-in component that renders a GLTF avatar driven by a `TranslationEnvelope`.

```tsx
import { AvatarViewer } from "@ikiraro/sdk";

<AvatarViewer
  envelope={snapshot.lastEnvelope} // null → rest pose
  modelUrl="/models/avatar.glb"
  className="w-full h-[500px]"
/>;
```

| Prop        | Type                          | Description                                          |
| ----------- | ----------------------------- | ---------------------------------------------------- |
| `envelope`  | `TranslationEnvelope \| null` | Drives the animation — pass `null` to show rest pose |
| `modelUrl`  | `string`                      | URL of a Mixamo-compatible GLTF/GLB avatar           |
| `className` | `string?`                     | CSS class applied to the `<canvas>`                  |

## Speech input

```tsx
const { startSpeech, stopSpeech, cancel, snapshot } = useIkiraro();

<button onClick={() => startSpeech()}>Record</button>

// Domain hint for Whisper transcription
<button onClick={() => startSpeech({ sttModel: "whisper-large-v3-turbo", prompt: "medical" })}>
  Record (medical)
</button>

// Live level meter while capturing
<AudioVisualizer level={snapshot.speechLevel} />

<button onClick={stopSpeech} disabled={snapshot.speechStatus !== "capturing"}>Done</button>
<button onClick={cancel}>Cancel</button>
```

## Deterministic signing (no LLM)

```tsx
const { translateUnits } = useIkiraro();

// Fingerspell — identical result every time, no network call
translateUnits(["H", "E", "L", "L", "O"]);

// Lexeme codes from the pose library also work
translateUnits(["HELLO", "WORLD"]);
```

## Camera hand-tracking

```tsx
import { useHandTracking, HandOverlay } from "@ikiraro/sdk";

const { videoRef, tracking, isReady, start, stop, fps, delegate } = useHandTracking();

<video ref={videoRef} autoPlay muted playsInline />
<HandOverlay tracking={tracking} />
```

`tracking` exposes `currentWord`, `sentenceText`, and `committedToken` as the classifier recognizes signs in real time. Bridge to `useIkiraro` by passing `tracking.sentenceText` to `translate()`.

## Accessibility system

```tsx
import {
  useAccessibilityMode,
  AudioQueue,
  EarconPlayer,
  AccessibilityShortcutManager,
  WebSpeechProvider,
} from "@ikiraro/sdk";

// Reactive mode hook
const { mode, setMode, isAvatarSuppressed, isTtsSuppressed } = useAccessibilityMode();
// modes: "standard" | "audio-first" | "visual-first" | "motor"
// persisted to localStorage

// Priority TTS queue  (critical > high > normal > low)
const tts = WebSpeechProvider.getInstance();
const queue = AudioQueue.getInstance(
  (text) => tts.speak(text),
  () => tts.cancel(),
);
queue.speak("Hello", "normal");
await queue.speakAsync("Done", "high");

// Synthesized audio cues — no audio files required
EarconPlayer.getInstance().play("success"); // "focus"|"select"|"success"|"error"|"navigate"|"open"|"close"

// Keyboard shortcuts with double-tap detection
const shortcuts = new AccessibilityShortcutManager({ doubleTapMs: 400 });
shortcuts.register({ key: "f", label: "Read", description: "Read aloud", action: readAloud });
shortcuts.mount();
```

## Without React — `createIkiraro`

```ts
import { createIkiraro } from "@ikiraro/sdk";

const runtime = await createIkiraro({ sdk: { groqApiKey: "..." } });

const unsub = runtime.onTranslated((envelope) => {
  renderSigns(envelope.rendererQueue);
});

runtime.translate("Hello, how are you?");

unsub();
await runtime.stop();
```

## Custom renderer — `RendererDirector`

Implement `SignCanvas` to drive your own 2D canvas, SVG, or external engine.

```ts
import { RendererDirector } from "@ikiraro/sdk/engine";
import type { SignCanvas } from "@ikiraro/sdk/engine";

const myCanvas: SignCanvas = {
  setPose(pose) {
    /* pose is Handshape from pose-library — update your renderer */
  },
  setOverlay(label, sublabel) {
    document.title = label;
  },
  setMotion(motion, progress, armTarget) {
    /* animate */
  }, // optional method
  clear() {
    /* reset */
  },
};

const director = new RendererDirector(myCanvas);
director.setOptions({ loop: false, speed: 1 });

runtime.onTranslated((envelope) => {
  director.setQueue(envelope.rendererQueue);
  director.play();
});

// Reactive state updates
director.subscribe(({ isPlaying, frameIndex, progress }) => {
  // isPlaying, frameIndex, progress, time — NOT currentFrame/totalFrames/currentLabel
});
```

## One-shot translation (server-side / scripts)

```ts
import { IkiraroSDK } from "@ikiraro/sdk";

const envelope = await IkiraroSDK.translateTextAsync("Hello world", {
  groqApiKey: process.env.GROQ_API_KEY,
});
console.log(envelope.plan.glossText); // "HELLO WORLD"
```

## Exports

| Import path               | Contents                                                                     |
| ------------------------- | ---------------------------------------------------------------------------- |
| `@ikiraro/sdk`            | Runtime, hooks, accessibility system, planning primitives, core components   |
| `@ikiraro/sdk/components` | Re-exports all `@ikiraro/renderer` components                                |
| `@ikiraro/sdk/engine`     | Engine internals — pose library, frame queue, `RendererDirector`, math utils |

## STT models

| Model                        | Speed  | Best for                  |
| ---------------------------- | ------ | ------------------------- |
| `whisper-large-v3` (default) | Slower | Accuracy, medical/legal   |
| `whisper-large-v3-turbo`     | Faster | Conversational, real-time |

## Peer dependencies

| Package                   | Version   | Required?                  |
| ------------------------- | --------- | -------------------------- |
| `react`                   | ≥ 18      | yes                        |
| `react-dom`               | ≥ 18      | yes                        |
| `three`                   | ≥ 0.170.0 | yes                        |
| `effect`                  | ≥ 3.0.0   | yes                        |
| `@react-three/fiber`      | ≥ 9.0.0   | yes (for AvatarViewer)     |
| `@react-three/drei`       | ≥ 9.0.0   | yes (for AvatarViewer)     |
| `@mediapipe/tasks-vision` | 0.10.35   | only for `useHandTracking` |

## License

MIT
