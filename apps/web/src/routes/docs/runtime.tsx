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
export const Route = createFileRoute("/docs/runtime")({
  component: RuntimePage,
});
const SNIPPET_CREATE = `import { createIkiraro } from "@ikiraro/sdk";
// Bootstrap the runtime outside of React
const runtime = await createIkiraro({
  sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
  keyboard: true,         // optional: mount KeyboardPlugin
  plugins: [myPlugin],   // optional: custom plugins appended after defaults
});
// Subscribe to a specific event — fully typed payload
runtime.subscribe("translation:finished", ({ payload }) => {
  console.log("Gloss:", payload.plan.glossText);
  console.log("Queue:", payload.rendererQueue.length, "frames");
});
// Dispatch a translation command
runtime.translate("Hello world");
// Or dispatch low-level events directly
runtime.dispatch({
  type: "session:cmd:start",
  payload: { mode: "text", text: "Hello world" },
  timestamp: Date.now(),
  source: "app",
});
// Read a synchronous snapshot of state
const { status, isTranslating, lastEnvelope } = runtime.snapshot();
// Stop everything and release resources (reverse teardown order)
await runtime.stop();`;
const SNIPPET_SUBSCRIBE_ALL = `// Listen to every event (useful for debugging and logging)
const unsub = runtime.subscribeAll((event) => {
  console.log(event.type, event.payload, event.source);
});
// Clean up
unsub();`;
const SNIPPET_PLUGIN = `import type { IkiraroPlugin, PluginContext, IkiraroEvent } from "@ikiraro/sdk";
interface AnalyticsState {
  translationCount: number;
}
class AnalyticsPlugin implements IkiraroPlugin<AnalyticsState> {
  name = "analytics";
  initialState: AnalyticsState = { translationCount: 0 };
  setup(ctx: PluginContext<AnalyticsState>) {
    // Subscribe using ctx.subscribe — returns an unsubscribe fn automatically tracked by the runtime
    ctx.subscribe("translation:finished", ({ payload, timestamp }) => {
      analytics.track("translation_complete", {
        mode: payload.mode,
        gloss: payload.plan.glossText,
        ts: timestamp,
      });
    });
    ctx.subscribe("speech:status-change", ({ payload }) => {
      if (payload === "capturing") analytics.track("speech_started");
    });
    // Return a disposer — called on runtime.stop() in reverse registration order
    return () => analytics.flush();
  }
  reducer(state: AnalyticsState, event: IkiraroEvent): AnalyticsState {
    if (event.type === "translation:finished") {
      return { ...state, translationCount: state.translationCount + 1 };
    }
    return state;
  }
}
// Register at creation time
const runtime = await createIkiraro({
  sdk: { groqApiKey: "..." },
  plugins: [new AnalyticsPlugin()],
});`;
const SNIPPET_BUILT_IN_PLUGINS = `// Default plugins mounted by createIkiraro():
//
// SessionPlugin     — orchestrates the session lifecycle (idle → recording → translating → finished)
// CompositionPlugin — debounces & deduplicates input tokens (400 ms window, 150 ms dedup)
// TranslationPlugin — routes requests to GroqSemanticPlanner or DeterministicUnitsPlanner
// SpeechPlugin      — mic capture via MediaRecorder → Groq Whisper → translation:cmd:request
//
// Optional — mount via config:
// VisionPlugin      — bridges camera hand-tracking events into the runtime bus
// KeyboardPlugin    — captures physical key presses as sign tokens
//
// Advanced — add manually via plugins[]:
// InspectorPlugin   — records all events (up to 100) for dev tooling`;
function RuntimePage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="Runtime API"
        subtitle="createIkiraro bootstraps the full IkiraroRuntime outside of React. Use this for Node.js scripts, server rendering, or when you need lifecycle control that useIkiraro doesn't expose."
      />

      <section className="space-y-4">
        <SectionHead id="create-ikiraro" label="createIkiraro" />
        <CodeBlock code={SNIPPET_CREATE} label="createIkiraro" />
        <RefTable>
          <RefTableHead cols={["Method", "Description"]} />
          <RefRow
            name="runtime.translate(text, options?)"
            desc="Convenience wrapper — dispatches session:cmd:start for text mode."
          />
          <RefRow
            name="runtime.translateUnits(units)"
            desc="Dispatches session:cmd:start for sign-keys mode (deterministic, no LLM)."
          />
          <RefRow
            name="runtime.startSpeech(options?)"
            desc="Opens the microphone and begins capture. Call stopSpeech() to transcribe."
          />
          <RefRow name="runtime.stopSpeech()" desc="Stops mic recording and fires translation." />
          <RefRow name="runtime.cancel()" desc="Aborts any in-progress capture or translation." />
          <RefRow
            name="runtime.subscribe(type, handler)"
            desc="Listen to a specific event type. Returns an unsubscribe function."
          />
          <RefRow
            name="runtime.subscribeAll(handler)"
            desc="Listen to every event in the bus. Useful for debugging."
          />
          <RefRow
            name="runtime.dispatch(event)"
            desc="Emit a typed event into the bus — triggers reducers then plugin handlers."
          />
          <RefRow
            name="runtime.snapshot()"
            desc="Synchronously read the current runtime state (no subscription needed)."
          />
          <RefRow
            name="runtime.onTranslated(handler)"
            desc="Shorthand subscribe to translation:finished. Returns an unsubscribe function."
          />
          <RefRow
            name="runtime.stop()"
            desc="Tears down all plugins in reverse registration order and releases resources."
          />
        </RefTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="subscribe-all" label="subscribeAll" />
        <CodeBlock code={SNIPPET_SUBSCRIBE_ALL} label="subscribeAll()" />
      </section>

      <section className="space-y-4">
        <SectionHead id="plugins" label="Plugin authoring" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The runtime is an EventBus backed by a plugin list. Each plugin declares a{" "}
          <code className="font-mono text-foreground">setup</code> function (subscribes to events
          via <code className="font-mono text-foreground">ctx.subscribe</code>) and an optional{" "}
          <code className="font-mono text-foreground">reducer</code> (derives state from events).
          Teardown is handled by returning a disposer — or an array of disposers — from{" "}
          <code className="font-mono text-foreground">setup</code>. Plugins run in registration
          order; teardown runs in reverse.
        </p>
        <CodeBlock code={SNIPPET_PLUGIN} label="custom plugin" />
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2">
            Built-in plugins
          </p>
          <CodeBlock code={SNIPPET_BUILT_IN_PLUGINS} label="built-in plugins" />
        </div>
        <RefTable>
          <RefTableHead cols={["Plugin", "Default", "Description"]} />
          <RefRow
            name="SessionPlugin"
            type="yes"
            desc="Orchestrates the high-level session lifecycle. Coordinates SpeechPlugin and TranslationPlugin based on the active communication mode."
          />
          <RefRow
            name="CompositionPlugin"
            type="yes"
            desc="Debounces input tokens (400 ms window, 150 ms dedup). Manages compositionTokens and compositionText in the snapshot."
          />
          <RefRow
            name="TranslationPlugin"
            type="yes"
            desc="Routes translation requests to the correct planner: GroqSemanticPlanner for text/speech, DeterministicUnitsPlanner for sign-keys."
          />
          <RefRow
            name="SpeechPlugin"
            type="yes"
            desc="Wraps SpeechCaptureAdapter — opens mic, streams audio, emits the Blob to TranslationPlugin via translation:cmd:request."
          />
          <RefRow
            name="VisionPlugin"
            type="vision config"
            desc="Bridges camera hand-tracking events into the runtime bus. Mount by passing vision.processor to createIkiraro."
          />
          <RefRow
            name="KeyboardPlugin"
            type="keyboard: true"
            desc="Captures physical key presses (A–Z) as sign tokens. Also handles virtual keyboard:cmd:press events."
          />
          <RefRow
            name="InspectorPlugin"
            type="manual"
            desc="Records all events (up to 100) in its state for dev tooling. Add via plugins[] — not mounted by default."
          />
        </RefTable>
        <Callout>
          Custom plugins added via <code className="font-mono text-foreground">plugins[]</code> are
          appended <em>after</em> the built-in defaults. Plugin state is available via{" "}
          <code className="font-mono text-foreground">runtime.getState().plugins</code> under the
          plugin's <code className="font-mono text-foreground">name</code> key.
        </Callout>
      </section>
    </div>
  );
}
