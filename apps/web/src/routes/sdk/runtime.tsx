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

export const Route = createFileRoute("/sdk/runtime")({
  component: RuntimePage,
});

const SNIPPET_CREATE = `import { createIkiraro } from "@ikiraro/sdk";

// Bootstrap the runtime outside of React
const runtime = await createIkiraro({
  sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
});

// Subscribe to a specific event
runtime.subscribe("translation:finished", ({ payload }) => {
  console.log("Done:", payload.envelope.plan.glossText);
});

// Dispatch a translation command
runtime.dispatch({
  type: "session:cmd:start",
  payload: { mode: "text", text: "Hello world" },
  timestamp: Date.now(),
  source: "app",
});

// Read a synchronous snapshot of state
const snapshot = runtime.snapshot();

// Stop everything and release resources
runtime.stop();`;

const SNIPPET_SUBSCRIBE_ALL = `// Listen to every event (useful for debugging and logging)
const unsub = runtime.subscribeAll((event) => {
  console.log(event.type, event.payload);
});

// Clean up
unsub();`;

const SNIPPET_PLUGIN = `import type { IkiraroPlugin } from "@ikiraro/communication";

const analyticsPlugin: IkiraroPlugin = {
  id: "analytics",

  setup(bus) {
    bus.on("translation:finished", ({ payload, timestamp }) => {
      analytics.track("translation_complete", {
        gloss: payload.envelope.plan.glossText,
        durationMs: payload.envelope.plan.durationMs,
        ts: timestamp,
      });
    });

    bus.on("speech:transcribed", ({ payload }) => {
      analytics.track("speech_transcribed", { text: payload.text });
    });
  },

  reducer(state, _event) {
    // Return derived state to merge into the runtime snapshot.
    // Return null/undefined to leave state unchanged.
    return state;
  },

  teardown() {
    // Runs on runtime.stop() — clean up intervals, subscriptions, etc.
  },
};

// Register at creation time
const runtime = await createIkiraro({
  sdk: { groqApiKey: "..." },
  plugins: [analyticsPlugin],
});`;

const SNIPPET_BUILT_IN_PLUGINS = `// The runtime ships with 7 built-in plugins:
//
// CompositionPlugin   — debounces input tokens (400 ms), fuses duplicates
// TranslationPlugin   — drives the LLM planner (Groq or deterministic)
// RendererPlugin      — manages the RendererDirector frame queue
// SpeechPlugin        — wraps the SpeechCaptureAdapter (mic → Whisper)
// VisionPlugin        — bridges useHandTracking events into the runtime
// KeyboardPlugin      — dispatches keyboard shortcut events
// InspectorPlugin     — dev-mode state diffing and performance tracing`;

const SNIPPET_IKIRARO_SDK = `import { IkiraroSDK } from "@ikiraro/sdk";
import { Effect } from "effect";

// Effect-based API for one-off translations without a running runtime
const program = IkiraroSDK.translate("Hello, world!", {
  groqApiKey: import.meta.env.VITE_GROQ_API_KEY,
});

const envelope = await Effect.runPromise(program);
console.log(envelope.plan.glossText); // "HELLO WORLD"`;

function RuntimePage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="Runtime API"
        subtitle="createIkiraro bootstraps the full IkiraroRuntime outside of React. Use this for Node.js scripts, server rendering, or when you need lifecycle control that useIkiraro doesn't expose."
      />

      {/* createIkiraro */}
      <section className="space-y-4">
        <SectionHead id="create-ikiraro" label="createIkiraro" />
        <CodeBlock code={SNIPPET_CREATE} label="createIkiraro" />
        <RefTable>
          <RefTableHead cols={["Method", "Description"]} />
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
            desc="Emit an event into the bus — triggers all matching plugin handlers."
          />
          <RefRow
            name="runtime.snapshot()"
            desc="Synchronously read the current runtime state (no subscription needed)."
          />
          <RefRow
            name="runtime.translate(text, options?)"
            desc="Convenience wrapper — dispatches session:cmd:start for text mode."
          />
          <RefRow
            name="runtime.translateUnits(units)"
            desc="Dispatches session:cmd:start for units mode."
          />
          <RefRow
            name="runtime.startSpeech(options?)"
            desc="Opens the microphone and begins STT capture."
          />
          <RefRow name="runtime.stopSpeech()" desc="Stops mic recording and fires translation." />
          <RefRow name="runtime.cancel()" desc="Aborts any in-progress translation." />
          <RefRow
            name="runtime.stop()"
            desc="Tears down all plugins and releases resources. Call this on cleanup."
          />
        </RefTable>
      </section>

      {/* subscribeAll */}
      <section className="space-y-4">
        <SectionHead id="subscribe-all" label="subscribeAll" />
        <CodeBlock code={SNIPPET_SUBSCRIBE_ALL} label="subscribeAll()" />
      </section>

      {/* Plugins */}
      <section className="space-y-4">
        <SectionHead id="plugins" label="Plugins" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The runtime is an EventBus plus a list of plugins. Each plugin declares a{" "}
          <code className="font-mono text-foreground">setup</code> function (subscribes to events),
          an optional <code className="font-mono text-foreground">reducer</code> (derives snapshot
          state from events), and a <code className="font-mono text-foreground">teardown</code>{" "}
          function (cleanup on stop). Plugins execute in registration order.
        </p>
        <CodeBlock code={SNIPPET_PLUGIN} label="custom plugin" />

        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2">
            Built-in plugins
          </p>
          <CodeBlock code={SNIPPET_BUILT_IN_PLUGINS} label="built-in plugins" />
        </div>

        <RefTable>
          <RefTableHead cols={["Plugin", "Description"]} />
          <RefRow
            name="CompositionPlugin"
            desc="Debounces input tokens (400 ms window, 150 ms dedup). Manages compositionTokens and compositionText in the snapshot."
          />
          <RefRow
            name="TranslationPlugin"
            desc="Routes composition flush events to the correct planner (Groq semantic or deterministic units) and emits translation events."
          />
          <RefRow
            name="RendererPlugin"
            desc="Receives translation:finished, builds the frame queue, and drives RendererDirector."
          />
          <RefRow
            name="SpeechPlugin"
            desc="Wraps SpeechCaptureAdapter — opens mic, streams to Groq Whisper, emits speech events."
          />
          <RefRow
            name="VisionPlugin"
            desc="Bridges useHandTracking committed tokens into composition events."
          />
          <RefRow name="KeyboardPlugin" desc="Dispatches keyboard shortcut events into the bus." />
          <RefRow
            name="InspectorPlugin"
            desc="Dev-mode state diffing and performance tracing. Enabled only in development builds."
          />
        </RefTable>

        <Callout>
          Plugins registered in the <code className="font-mono text-foreground">plugins</code> array
          on <code className="font-mono text-foreground">createIkiraro</code> are appended{" "}
          <em>after</em> the built-in plugins. If you need to intercept before a built-in, use{" "}
          <code className="font-mono text-foreground">runtime.subscribe</code> with{" "}
          <code className="font-mono text-foreground">subscribeAll</code> instead.
        </Callout>
      </section>

      {/* Effect API */}
      <section className="space-y-4">
        <SectionHead id="effect-api" label="IkiraroSDK (Effect API)" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          For one-off translations without a persistent runtime, use the{" "}
          <code className="font-mono text-foreground">IkiraroSDK</code> Effect pipeline directly. It
          creates a runtime, runs one translation, returns the envelope, and cleans up — all in a
          single composable <code className="font-mono text-foreground">Effect</code>.
        </p>
        <CodeBlock code={SNIPPET_IKIRARO_SDK} label="IkiraroSDK" />
      </section>
    </div>
  );
}
