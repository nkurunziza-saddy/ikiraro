# Runtime API

`createIkiraro` bootstraps the full IkiraroRuntime outside of React. Use this for Node.js scripts, server rendering, or when you need lifecycle control that `useIkiraro` doesn't expose.

## createIkiraro

```ts
import { createIkiraro } from "@ikiraro/sdk";

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
await runtime.stop();
```

## subscribeAll

```ts
// Listen to every event (useful for debugging and logging)
const unsub = runtime.subscribeAll((event) => {
  console.log(event.type, event.payload, event.source);
});

// Clean up
unsub();
```

## Plugin authoring

The runtime is an EventBus backed by a plugin list. Each plugin declares a `setup` function (subscribes to events via `ctx.subscribe`) and an optional `reducer` (derives state from events). Teardown is handled by returning a disposer — or an array of disposers — from `setup`. Plugins run in registration order; teardown runs in reverse.

```ts
import type { IkiraroPlugin, PluginContext, IkiraroEvent } from "@ikiraro/sdk";

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
});
```

### Built-in plugins

```ts
// Default plugins mounted by createIkiraro():
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
// InspectorPlugin   — records all events (up to 100) for dev tooling
```

> **Note:** Custom plugins added via `plugins[]` are appended *after* the built-in defaults. Plugin state is available via `runtime.getState().plugins` under the plugin's `name` key.
