# React Bindings

Ikiraro uses a Provider-less factory pattern. You configure the client once globally, and then use its bound hooks anywhere in your app. The hardware lifecycle (WebGL, Camera) is managed automatically via reference counting.

## Setup & Basic Usage

```ts
// 1. Create the global client in a shared file (e.g., lib/ikiraro.ts)
import { createIkiraroClient } from "@ikiraro/sdk";

export const ikiraroClient = createIkiraroClient({
  sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
  keyboard: true,
});

export const { useIkiraro, useIkiraroPlugin } = ikiraroClient;
```

```tsx
// 2. Consume it anywhere in your app without a Provider
import { useIkiraro } from "@/lib/ikiraro";

function MyComponent() {
  const {
    isReady,
    snapshot,
    translate,
    translateUnits,
    startSpeech,
    stopSpeech,
    cancel,
    onTranslated,
    error,
  } = useIkiraro();

  // ...
}
```

## Configuration (createIkiraroClient)

- `sdk.groqApiKey`: Groq API key. Without it, only DeterministicUnitsPlanner (translateUnits) works.
- `sdk.groqBaseUrl`: Override the Groq API base URL.
- `vision`: Enables camera sign-language input. Pass a `WorkerHandProcessor` instance.
- `keyboard`: Mount KeyboardPlugin — captures physical key presses as sign tokens.
- `plugins`: Additional plugins appended after the defaults.

## translate

Translate English text to ASL Gloss via Groq Llama, then animate.

```ts
const { translate } = useIkiraro();

// Translate any English sentence to ASL Gloss via Groq Llama
translate("Hello, how are you today?");

// With optional conversation context to bias the LLM
translate("Where does it hurt?", {
  context: {
    locale: "en-US",
    previousTurns: [{ role: "hearing", text: "Hi there" }],
  },
});
```

## translateUnits

Bypasses the LLM entirely. Each string in the array is looked up directly in the ASL pose library — the result is always the same for the same input, making it suitable for production captions and accessibility overlays.

```ts
const { translateUnits } = useIkiraro();

// Fingerspell "HELLO" — deterministic, no LLM needed
translateUnits(["H", "E", "L", "L", "O"]);

// ASL lexeme codes from the pose library also work
translateUnits(["HELLO", "WORLD"]);
```

## startSpeech / stopSpeech

```ts
const { startSpeech, stopSpeech, snapshot } = useIkiraro();

// Start mic recording — Groq Whisper transcribes after stopSpeech()
startSpeech();

// Drive a real-time audio meter while recording
console.log(snapshot.speechLevel);  // 0–1 float
console.log(snapshot.speechStatus); // "capturing"

// Stop and fire translation automatically
stopSpeech();

// Optional: pick a specific Whisper model + hint the transcript domain
startSpeech({
  sttModel: "whisper-large-v3",
  prompt: "Medical terminology",
});
```

## cancel

```tsx
const { cancel, snapshot } = useIkiraro();

// Abort any in-progress capture or translation
cancel();

<button onClick={cancel} disabled={!snapshot.isTranslating}>
  Cancel
</button>
```

## onTranslated

Fires after every completed translation — text, speech, or units. Runs outside React's render cycle, so it's safe for TTS, analytics, or logging side effects.

```ts
const { onTranslated, isReady } = useIkiraro();

useEffect(() => {
  if (!isReady) return;
  
  const unsub = onTranslated((envelope) => {
    // Runs outside React render — safe for side effects
    console.log("Gloss:", envelope.plan.glossText);
    myTTS.speak(envelope.rawInput);
  });
  
  return unsub;
}, [isReady, onTranslated]);
```

## Snapshot

A flat, reactive view of the runtime state. Subscribe to changes implicitly by calling `useIkiraro()`.

- `snapshot.lastEnvelope`: Latest signed translation — pass directly to AvatarViewer. Null until the first translation completes.
- `snapshot.status`: Session lifecycle phase ("idle" | "recording" | "translating" | "finished" | "error").
- `snapshot.isTranslating`: True while the LLM / deterministic pipeline is running.
- `snapshot.compositionTokens`: In-flight token buffer from CompositionPlugin (400 ms debounce window).
- `snapshot.compositionText`: compositionTokens joined as a string — useful for live preview UIs.
- `snapshot.speechStatus`: Mic capture state ("idle" | "capturing" | "processing" | "error").
- `snapshot.speechLevel`: Real-time mic amplitude (0-1).
- `snapshot.error`: Last translation error message.

```ts
const { snapshot } = useIkiraro();

// CompositionPlugin debounces tokens with a 400 ms window
console.log(snapshot.compositionTokens); // IkiraroToken[] — in-flight buffer
console.log(snapshot.compositionText);   // joined string for live preview
```

## useIkiraroPlugin

Subscribe to the state of a specific plugin. This is more performant than `useIkiraro` if you only care about one slice of state.

```tsx
import { useIkiraroPlugin } from "@/lib/ikiraro";

function MyVisionWidget() {
  // Subscribe specifically to the vision plugin state without re-rendering on speech events
  const visionState = useIkiraroPlugin("vision");
  
  if (!visionState?.isTracking) return null;
  return <div>Tracking Hand: {visionState.handedness}</div>;
}
```
