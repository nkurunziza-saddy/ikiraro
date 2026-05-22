import { createFileRoute } from "@tanstack/react-router";
import {
  CodeBlock,
  PageTitle,
  SectionHead,
  RefTable,
  RefTableHead,
  RefRow,
  Callout,
} from "@/components/docs/primitives";
export const Route = createFileRoute("/docs/hooks")({
  component: HooksPage,
});
const SNIPPET_SETUP = `// 1. Create the global client in a shared file (e.g., lib/ikiraro.ts)
import { createIkiraroClient } from "@ikiraro/sdk";
export const ikiraroClient = createIkiraroClient({
  sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
  keyboard: true,
});
export const { useIkiraro, useIkiraroPlugin } = ikiraroClient;`;
const SNIPPET_BASIC = `// 2. Consume it anywhere in your app without a Provider
import { useIkiraro } from "@/lib/ikiraro";
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
} = useIkiraro();`;
const SNIPPET_TRANSLATE = `const { translate } = useIkiraro();
// Translate any English sentence to ASL Gloss via Groq Llama
translate("Hello, how are you today?");
// With optional conversation context to bias the LLM
translate("Where does it hurt?", {
  context: {
    locale: "en-US",
    previousTurns: [{ role: "hearing", text: "Hi there" }],
  },
});`;
const SNIPPET_TRANSLATE_UNITS = `const { translateUnits } = useIkiraro();
// Fingerspell "HELLO" — deterministic, no LLM needed
translateUnits(["H", "E", "L", "L", "O"]);
// ASL lexeme codes from the pose library also work
translateUnits(["HELLO", "WORLD"]);`;
const SNIPPET_SPEECH = `const { startSpeech, stopSpeech, snapshot } = useIkiraro();
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
});`;
const SNIPPET_CANCEL = `const { cancel, snapshot } = useIkiraro();
// Abort any in-progress capture or translation
cancel();
<button onClick={cancel} disabled={!snapshot.isTranslating}>
  Cancel
</button>`;
const SNIPPET_ON_TRANSLATED = `const { onTranslated, isReady } = useIkiraro();
useEffect(() => {
  if (!isReady) return;
  const unsub = onTranslated((envelope) => {
    // Runs outside React render — safe for side effects
    console.log("Gloss:", envelope.plan.glossText);
    myTTS.speak(envelope.normalizedText);
  });
  return unsub;
}, [isReady, onTranslated]);`;
const SNIPPET_COMPOSITION = `const { snapshot } = useIkiraro();
// CompositionPlugin debounces tokens with a 400 ms window
console.log(snapshot.compositionTokens); // IkiraroToken[] — in-flight buffer
console.log(snapshot.compositionText);   // joined string for live preview`;
const SNIPPET_PLUGIN = `import { useIkiraroPlugin } from "@/lib/ikiraro";
function MyVisionWidget() {
  // Subscribe specifically to the vision plugin state without re-rendering on speech events
  const visionState = useIkiraroPlugin("vision");
  if (!visionState?.isTracking) return null;
  return <div>Tracking Hand: {visionState.handedness}</div>;
}`;
function HooksPage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="React Bindings"
        subtitle="Ikiraro uses a Provider-less factory pattern. You configure the client once globally, and then use its bound hooks anywhere in your app. The hardware lifecycle (WebGL, Camera) is managed automatically via reference counting."
      />

      <section className="space-y-4">
        <SectionHead id="setup" label="Setup & Basic Usage" />
        <CodeBlock code={SNIPPET_SETUP} label="lib/ikiraro.ts" />
        <CodeBlock code={SNIPPET_BASIC} label="MyComponent.tsx" />
      </section>

      <section className="space-y-4">
        <SectionHead id="config" label="Configuration (createIkiraroClient)" />
        <RefTable>
          <RefTableHead cols={["Option", "Type", "Description"]} />
          <RefRow
            name="sdk.groqApiKey"
            type="string"
            desc="Groq API key. Without it, only DeterministicUnitsPlanner (translateUnits) works — LLM gloss generation is disabled."
          />
          <RefRow
            name="sdk.groqBaseUrl"
            type="string?"
            desc="Override the Groq API base URL. Useful for proxies or self-hosted endpoints."
          />
          <RefRow
            name="vision"
            type="{ processor: HandProcessor }?"
            desc="Enables camera sign-language input. Pass a WorkerHandProcessor instance."
          />
          <RefRow
            name="keyboard"
            type="boolean?"
            desc="Mount KeyboardPlugin — captures physical key presses as sign tokens. Default false."
          />
          <RefRow
            name="plugins"
            type="IkiraroPlugin[]?"
            desc="Additional plugins appended after the defaults. Use for analytics, logging, or custom input adapters."
          />
        </RefTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="returns" label="useIkiraro Returns" />
        <RefTable>
          <RefTableHead cols={["Field", "Type", "Description"]} />
          <RefRow
            name="isReady"
            type="boolean"
            desc="True once the runtime has fully initialized and is accepting commands."
          />
          <RefRow
            name="error"
            type="string | null"
            desc="Set when initialization fails (e.g. invalid or missing API key)."
          />
          <RefRow
            name="snapshot"
            type="RuntimeSnapshot"
            desc="Reactive flat state — updates inside React's transition system. See Snapshot below."
          />
          <RefRow
            name="translate"
            type="(text, options?) => void"
            desc="Translate English text to ASL Gloss via Groq Llama, then animate."
          />
          <RefRow
            name="translateUnits"
            type="(units: string[]) => void"
            desc="Deterministic fingerspelling — no LLM. Same result for same input every time."
          />
          <RefRow
            name="startSpeech"
            type="(options?) => void"
            desc="Open the microphone. Call stopSpeech() to transcribe and translate."
          />
          <RefRow
            name="stopSpeech"
            type="() => void"
            desc="Stop recording and fire translation automatically."
          />
          <RefRow
            name="cancel"
            type="() => void"
            desc="Abort any in-progress capture or translation. Clears the isTranslating flag."
          />
          <RefRow
            name="onTranslated"
            type="(handler) => () => void"
            desc="Subscribe to completed translations outside React state. Returns unsubscribe fn. Must be called after isReady."
          />
        </RefTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="translate" label="translate" />
        <CodeBlock code={SNIPPET_TRANSLATE} label="translate()" />
      </section>

      <section className="space-y-4">
        <SectionHead id="translate-units" label="translateUnits" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Bypasses the LLM entirely. Each string in the array is looked up directly in the ASL pose
          library — the result is always the same for the same input, making it suitable for
          production captions and accessibility overlays.
        </p>
        <CodeBlock code={SNIPPET_TRANSLATE_UNITS} label="translateUnits()" />
      </section>

      <section className="space-y-4">
        <SectionHead id="speech" label="startSpeech / stopSpeech" />
        <CodeBlock code={SNIPPET_SPEECH} label="speech" />
        <Callout>
          <strong className="text-foreground">startSpeech options:</strong>{" "}
          <code className="font-mono text-foreground">sttModel</code> picks the Whisper variant
          (default <code className="font-mono text-foreground">"whisper-large-v3"</code>).{" "}
          <code className="font-mono text-foreground">prompt</code> biases transcription toward a
          domain. <code className="font-mono text-foreground">context</code> passes conversation
          history to the gloss generation LLM.
        </Callout>
      </section>

      <section className="space-y-4">
        <SectionHead id="cancel" label="cancel" />
        <CodeBlock code={SNIPPET_CANCEL} label="cancel()" />
      </section>

      <section className="space-y-4">
        <SectionHead id="on-translated" label="onTranslated" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Fires after every completed translation — text, speech, or units. Runs outside React's
          render cycle, so it's safe for TTS, analytics, or logging side effects. Must be called
          after <code className="font-mono text-foreground">isReady</code> is true; the returned
          function unsubscribes.
        </p>
        <CodeBlock code={SNIPPET_ON_TRANSLATED} label="onTranslated()" />
      </section>

      <section className="space-y-4">
        <SectionHead id="snapshot" label="Snapshot" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          A flat, reactive view of the runtime state. Subscribe to changes implicitly by calling{" "}
          <code className="font-mono text-foreground">useIkiraro()</code>.
        </p>
        <RefTable>
          <RefTableHead cols={["Field", "Type", "Description"]} />
          <RefRow
            name="snapshot.lastEnvelope"
            type="TranslationEnvelope | null"
            desc="Latest signed translation — pass directly to AvatarViewer. Null until the first translation completes."
          />
          <RefRow
            name="snapshot.status"
            type='"idle" | "recording" | "translating" | "finished" | "error"'
            desc="Session lifecycle phase. Updates as the user moves through capture → translation → playback."
          />
          <RefRow
            name="snapshot.isTranslating"
            type="boolean"
            desc="True while the LLM / deterministic pipeline is running."
          />
          <RefRow
            name="snapshot.compositionTokens"
            type="IkiraroToken[]"
            desc="In-flight token buffer from CompositionPlugin (400 ms debounce window)."
          />
          <RefRow
            name="snapshot.compositionText"
            type="string"
            desc="compositionTokens joined as a string — useful for live preview UIs."
          />
          <RefRow
            name="snapshot.speechStatus"
            type='"idle" | "capturing" | "processing" | "error"'
            desc="Mic capture state — use to show recording indicators and meters."
          />
          <RefRow
            name="snapshot.speechLevel"
            type="number (0–1)"
            desc="Real-time mic amplitude — feed directly to AudioVisualizer."
          />
          <RefRow
            name="snapshot.error"
            type="string | null"
            desc="Last translation error message. Null until an error occurs; cleared on next successful translation."
          />
        </RefTable>
        <CodeBlock code={SNIPPET_COMPOSITION} label="compositionTokens" />
      </section>

      <section className="space-y-4">
        <SectionHead id="use-plugin" label="useIkiraroPlugin" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Subscribe to the state of a specific plugin. This is more performant than{" "}
          <code className="font-mono text-foreground">useIkiraro</code> if you only care about one
          slice of state (e.g. vision or inspector), because it won't re-render your component on
          unrelated events like speech volume changes.
        </p>
        <CodeBlock code={SNIPPET_PLUGIN} label="useIkiraroPlugin()" />
      </section>
    </div>
  );
}
