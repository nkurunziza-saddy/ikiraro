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

export const Route = createFileRoute("/sdk/hooks")({
  component: HooksPage,
});

const SNIPPET_BASIC = `import { useIkiraro } from "@ikiraro/sdk";

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
  runtime,  // escape hatch — prefer the helpers above
} = useIkiraro({
  sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
});`;

const SNIPPET_TRANSLATE = `const { translate } = useIkiraro({ sdk: { groqApiKey: "..." } });

// Translate any English sentence to ASL Gloss via Groq Llama
translate("Hello, how are you today?");

// With optional context to bias the LLM toward a domain
translate("Where does it hurt?", { context: { domain: "medical" } });`;

const SNIPPET_TRANSLATE_UNITS = `const { translateUnits } = useIkiraro({ sdk: { groqApiKey: "..." } });

// Fingerspell "HELLO" — deterministic, no LLM needed
translateUnits(["H", "E", "L", "L", "O"]);

// ASL lexeme codes from the pose library also work
translateUnits(["HELLO", "WORLD"]);`;

const SNIPPET_SPEECH = `const { startSpeech, stopSpeech, snapshot } = useIkiraro({ sdk: { ... } });

// Start mic recording — Groq Whisper transcribes after stopSpeech()
startSpeech();

// Drive a real-time audio meter
console.log(snapshot.speechLevel); // 0–1 float
console.log(snapshot.speechStatus); // "capturing"

// Stop and fire translation automatically
stopSpeech();

// Optional: pick a specific Whisper model
startSpeech({ sttModel: "whisper-large-v3" });`;

const SNIPPET_CANCEL = `const { cancel, snapshot } = useIkiraro({ sdk: { ... } });

// Abort any in-progress translation
cancel();

<button onClick={cancel} disabled={!snapshot.isTranslating}>
  Cancel
</button>`;

const SNIPPET_ON_TRANSLATED = `const { onTranslated, isReady } = useIkiraro({ sdk: { ... } });

useEffect(() => {
  if (!isReady) return;
  const unsub = onTranslated((envelope) => {
    // Runs outside React render — safe for side effects
    console.log("Gloss:", envelope.plan.glossText);
    myTTSEngine.speak(envelope.normalizedText);
  });
  return unsub; // returns the unsubscribe fn
}, [isReady, onTranslated]);`;

const SNIPPET_COMPOSITION = `const { snapshot } = useIkiraro({ sdk: { ... } });

// While the user types — CompositionPlugin debounces 400 ms
console.log(snapshot.compositionTokens); // in-flight token buffer
console.log(snapshot.compositionText);   // joined string`;

function HooksPage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="useIkiraro"
        subtitle="The primary React hook. Creates and manages an IkiraroRuntime for the lifetime of the component. Teardown is automatic. Config is read only on mount — changes after mount are intentionally ignored."
      />

      {/* Signature */}
      <section className="space-y-4">
        <SectionHead id="signature" label="Signature" />
        <CodeBlock code={SNIPPET_BASIC} label="useIkiraro" />
      </section>

      {/* Config */}
      <section className="space-y-4">
        <SectionHead id="config" label="Configuration" />
        <RefTable>
          <RefTableHead cols={["Option", "Type", "Description"]} />
          <RefRow
            name="sdk.groqApiKey"
            type="string?"
            desc="Groq API key. Without it, the runtime falls back to DeterministicUnitsPlanner (no LLM)."
          />
          <RefRow
            name="plugins.composition.debounceMs"
            type="number?"
            desc="Token debounce window in ms. Default 400."
          />
        </RefTable>
      </section>

      {/* Returns */}
      <section className="space-y-4">
        <SectionHead id="returns" label="Returns" />
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
            desc="Open the microphone and begin Whisper transcription."
          />
          <RefRow
            name="stopSpeech"
            type="() => void"
            desc="Stop recording and fire translation automatically."
          />
          <RefRow
            name="cancel"
            type="() => void"
            desc="Abort any in-progress translation. Clears the isTranslating flag."
          />
          <RefRow
            name="onTranslated"
            type="(handler) => () => void"
            desc="Subscribe to completed translations outside React state. Returns unsubscribe fn. Must be called after isReady."
          />
          <RefRow
            name="runtime"
            type="IkiraroRuntime | null"
            desc="Escape hatch for direct EventBus and plugin access. Prefer the helpers above."
          />
        </RefTable>
      </section>

      {/* translate */}
      <section className="space-y-4">
        <SectionHead id="translate" label="translate" />
        <CodeBlock code={SNIPPET_TRANSLATE} label="translate()" />
      </section>

      {/* translateUnits */}
      <section className="space-y-4">
        <SectionHead id="translate-units" label="translateUnits" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Bypasses the LLM entirely. Each string in the array is looked up directly in the ASL pose
          library — the result is always the same for the same input, making it suitable for
          production captions and accessibility overlays.
        </p>
        <CodeBlock code={SNIPPET_TRANSLATE_UNITS} label="translateUnits()" />
      </section>

      {/* Speech */}
      <section className="space-y-4">
        <SectionHead id="speech" label="startSpeech / stopSpeech" />
        <CodeBlock code={SNIPPET_SPEECH} label="speech" />
        <Callout>
          <strong className="text-foreground">startSpeech options:</strong>{" "}
          <code className="font-mono text-foreground">sttModel</code> picks the Whisper variant
          (default <code className="font-mono text-foreground">"whisper-large-v3-turbo"</code>).{" "}
          <code className="font-mono text-foreground">prompt</code> biases transcription toward a
          domain. <code className="font-mono text-foreground">context</code> is forwarded to the
          gloss generation LLM.
        </Callout>
      </section>

      {/* cancel */}
      <section className="space-y-4">
        <SectionHead id="cancel" label="cancel" />
        <CodeBlock code={SNIPPET_CANCEL} label="cancel()" />
      </section>

      {/* onTranslated */}
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

      {/* Snapshot */}
      <section className="space-y-4">
        <SectionHead id="snapshot" label="Snapshot" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          A flat, reactive view of the runtime state. All fields update inside React's transition
          system via <code className="font-mono text-foreground">startTransition</code> — renders
          are non-blocking. Subscribe to changes with{" "}
          <code className="font-mono text-foreground">useEffect</code>.
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
            type='"idle" | "recording" | "translating" | …'
            desc="High-level session status string."
          />
          <RefRow
            name="snapshot.isTranslating"
            type="boolean"
            desc="True while the LLM / renderer pipeline is running."
          />
          <RefRow
            name="snapshot.compositionTokens"
            type="CompositionToken[]"
            desc="In-flight token buffer from CompositionPlugin (400 ms debounce window)."
          />
          <RefRow
            name="snapshot.compositionText"
            type="string"
            desc="compositionTokens joined as a string — useful for live preview UIs."
          />
          <RefRow
            name="snapshot.speechStatus"
            type='"idle" | "capturing" | "processing"'
            desc="Mic capture state — use to show recording indicators and meters."
          />
          <RefRow
            name="snapshot.speechLevel"
            type="number (0–1)"
            desc="Real-time mic amplitude — feed to AudioVisualizer."
          />
          <RefRow
            name="snapshot.error"
            type="string | null"
            desc="Last translation error. Cleared on the next successful translation."
          />
        </RefTable>
        <CodeBlock code={SNIPPET_COMPOSITION} label="compositionTokens" />
      </section>
    </div>
  );
}
