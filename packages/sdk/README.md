# @ikiraro/sdk

Sign language translation and rendering SDK — convert text or speech to ASL signing, powered by Groq and rendered through a 3D avatar or custom canvas.

## Install

```bash
npm install @ikiraro/sdk
# peer dependencies
npm install react react-dom three effect
```

## Quick start

```tsx
import { useIkiraro, AvatarViewer } from "@ikiraro/sdk";

function SigningApp() {
  const { snapshot, translate, startSpeech, stopSpeech, isReady } = useIkiraro({
    sdk: { groqApiKey: "your-groq-api-key" },
  });

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

## `useIkiraro(config)` — React hook

The primary entry point. Accepts a config object and manages the full runtime lifecycle internally.

```ts
const {
  isReady, // boolean — true once the runtime is initialized
  error, // string | null — set if initialization fails
  snapshot, // RuntimeSnapshot — reactive flat state
  translate, // (text, options?) => void
  translateUnits, // (units: string[]) => void — for sign keyboard input
  startSpeech, // (options?) => void — begin mic capture
  stopSpeech, // () => void — stop and transcribe
  cancel, // () => void — cancel in-progress capture
  onTranslated, // (handler) => () => void — imperative subscription
  runtime, // IkiraroRuntime | null — escape hatch
} = useIkiraro({ sdk: { groqApiKey: "..." } });
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
const { snapshot } = useIkiraro(config);

useEffect(() => {
  if (!snapshot.lastEnvelope) return;
  console.log(snapshot.lastEnvelope.plan.glossText);
}, [snapshot.lastEnvelope]);

// Via imperative subscription (for non-React callbacks)
const { onTranslated, isReady } = useIkiraro(config);

useEffect(() => {
  if (!isReady) return;
  return onTranslated((envelope) => {
    myAnalytics.track("translation", envelope);
  });
}, [isReady, onTranslated]);
```

## `AvatarViewer` — 3D signing avatar

Drop-in React component that renders a GLTF avatar and drives it from a `TranslationEnvelope`.

```tsx
import { AvatarViewer } from "@ikiraro/sdk";
// or: import { AvatarViewer } from "@ikiraro/sdk/components";

<AvatarViewer
  envelope={snapshot.lastEnvelope}
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
const { startSpeech, stopSpeech, cancel, snapshot } = useIkiraro(config);

// Start recording
<button onClick={() => startSpeech()}>Record</button>

// Optionally pass a Whisper model and domain hint
<button onClick={() => startSpeech({ sttModel: "whisper-large-v3", prompt: "medical" })}>
  Record (medical)
</button>

// Show a live level meter while capturing
<AudioVisualizer level={snapshot.speechLevel} />

// Submit the recording for transcription → signing
<button onClick={stopSpeech} disabled={snapshot.speechStatus !== "capturing"}>Done</button>

// Cancel without submitting
<button onClick={cancel}>Cancel</button>
```

## Sign keyboard (fingerspelling)

```tsx
const { translateUnits } = useIkiraro(config);

// Build a unit array from individual ASL letters
const [units, setUnits] = useState<string[]>([]);

<button onClick={() => translateUnits(units)}>Sign</button>;
```

## Camera hand-tracking

```tsx
import { useHandTracking } from "@ikiraro/sdk";

const { videoRef, tracking, isReady, start, stop, fps } = useHandTracking();

<video ref={videoRef} autoPlay muted playsInline />
<HandOverlay tracking={tracking} />
```

`tracking` exposes `currentWord`, `sentenceText`, and `committedToken` as the classifier recognizes signs in real time.

## Without React — `createIkiraro`

```ts
import { createIkiraro } from "@ikiraro/sdk";

const runtime = await createIkiraro({ sdk: { groqApiKey: "..." } });

// Subscribe to results
const unsub = runtime.onTranslated((envelope) => {
  renderSigns(envelope.rendererQueue);
});

// Translate
runtime.translate("Hello, how are you?");

// Clean up
unsub();
runtime.stop();
```

## Custom renderer — `RendererDirector`

If you want to drive your own 2D canvas, SVG, or external engine instead of `AvatarViewer`, implement the `SignCanvas` interface and connect a `RendererDirector`.

```ts
import { RendererDirector, buildFrameQueue } from "@ikiraro/sdk/engine";
import type { SignCanvas } from "@ikiraro/sdk/engine";

const myCanvas: SignCanvas = {
  setPose(pose) {
    /* update your renderer */
  },
  setOverlay(label) {
    document.title = label;
  },
  setMotion(motion, progress) {
    /* animate */
  },
  clear() {
    /* reset */
  },
};

const director = new RendererDirector(myCanvas);

runtime.onTranslated((envelope) => {
  director.setQueue(envelope.rendererQueue);
  director.play();
});
```

## Configuration

```ts
createIkiraro({
  sdk: {
    groqApiKey: string,   // required — get one at console.groq.com
    groqBaseUrl?: string, // optional — proxy or self-hosted Groq endpoint
  },
  vision?: {
    processor: HandProcessor, // optional — enable hand-tracking plugin
  },
})
```

### STT models

| Model                        | Speed  | Best for                  |
| ---------------------------- | ------ | ------------------------- |
| `whisper-large-v3` (default) | Slower | Accuracy, medical/legal   |
| `whisper-large-v3-turbo`     | Faster | Conversational, real-time |

## Exports

| Import path               | Contents                                                         |
| ------------------------- | ---------------------------------------------------------------- |
| `@ikiraro/sdk`            | Runtime, hooks, planning primitives, core components             |
| `@ikiraro/sdk/components` | Full component library including all shadcn/ui primitives        |
| `@ikiraro/sdk/engine`     | Engine internals — pose library, frame queue, `RendererDirector` |

## Peer dependencies

| Package     | Version   |
| ----------- | --------- |
| `react`     | ≥ 18      |
| `react-dom` | ≥ 18      |
| `three`     | ≥ 0.170.0 |
| `effect`    | ≥ 3.0.0   |

## License

MIT
