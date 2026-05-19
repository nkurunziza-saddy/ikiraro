import { createFileRoute } from "@tanstack/react-router";
import {
  CodeBlock,
  PageTitle,
  SectionHead,
  EventTable,
  EventRow,
  Callout,
} from "@/components/docs/primitives";

export const Route = createFileRoute("/sdk/events")({
  component: EventsPage,
});

const SNIPPET_SUBSCRIBE = `import { createIkiraro } from "@ikiraro/sdk";

const runtime = await createIkiraro({ sdk: { groqApiKey: "..." } });

// Subscribe to a specific event — handler receives the full IkiraroEvent envelope
runtime.subscribe("translation:finished", (event) => {
  // event.type      — "translation:finished"
  // event.payload   — typed to the event's payload shape
  // event.timestamp — unix ms when the event was dispatched
  // event.source    — which plugin or caller dispatched it
  console.log(event.payload.envelope.plan.glossText);
});

// Dispatch an event into the bus
runtime.dispatch({
  type: "session:cmd:start",
  payload: { mode: "text", text: "Hello" },
  timestamp: Date.now(),
  source: "app",
});`;

const SNIPPET_SUBSCRIBE_HOOK = `// Inside a React component — use the runtime escape hatch
const { runtime, isReady } = useIkiraro({ sdk: { ... } });

useEffect(() => {
  if (!isReady || !runtime) return;

  const unsub = runtime.subscribe("translation:finished", ({ payload }) => {
    console.log("Envelope:", payload.envelope);
  });

  return unsub;
}, [runtime, isReady]);`;

function EventsPage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="Event Reference"
        subtitle="All communication between plugins flows through a typed EventBus. 34 events are registered across 8 groups. Every event has the shape { type, payload, timestamp, source }."
      />

      {/* Subscribing */}
      <section className="space-y-4">
        <SectionHead id="subscribing" label="Subscribing" />
        <CodeBlock code={SNIPPET_SUBSCRIBE} label="runtime.subscribe()" />
        <CodeBlock code={SNIPPET_SUBSCRIBE_HOOK} label="inside useIkiraro" />
        <Callout>
          Handlers registered via{" "}
          <code className="font-mono text-foreground">runtime.subscribe</code> fire synchronously in
          the order they were registered. If you need async handling, launch your async work inside
          the handler but don't await it — the EventBus is synchronous by design.
        </Callout>
      </section>

      {/* Translation events */}
      <section className="space-y-4">
        <SectionHead id="translation" label="Translation" />
        <EventTable>
          <EventRow
            name="translation:requested"
            desc="Text, units, or speech submitted to the planner. payload: { text, units, mode }."
          />
          <EventRow
            name="translation:started"
            desc="Planner began processing. Marks the start of isTranslating = true."
          />
          <EventRow
            name="translation:finished"
            desc="Envelope ready. payload: { envelope: TranslationEnvelope }."
          />
          <EventRow name="translation:failed" desc="Planner threw. payload: { error: string }." />
          <EventRow
            name="translation:cancelled"
            desc="In-flight translation was aborted via cancel()."
          />
        </EventTable>
      </section>

      {/* Speech events */}
      <section className="space-y-4">
        <SectionHead id="speech" label="Speech" />
        <EventTable>
          <EventRow
            name="speech:capture:started"
            desc="Microphone stream opened. speechStatus transitions to 'capturing'."
          />
          <EventRow
            name="speech:capture:stopped"
            desc="Recording stopped. STT processing begins. speechStatus → 'processing'."
          />
          <EventRow
            name="speech:level:update"
            desc="Real-time amplitude. payload: { level: number } (0–1). Fires every ~50 ms."
          />
          <EventRow
            name="speech:transcribed"
            desc="Whisper returned a transcript. payload: { text: string }."
          />
          <EventRow
            name="speech:failed"
            desc="STT or mic access error. payload: { error: string }."
          />
        </EventTable>
      </section>

      {/* Vision events */}
      <section className="space-y-4">
        <SectionHead id="vision" label="Vision" />
        <EventTable>
          <EventRow
            name="vision:frame"
            desc="Raw MediaPipe result for the current camera frame. payload: { landmarks, classification }."
          />
          <EventRow
            name="vision:sign:detected"
            desc="Temporal smoother committed a sign classification. payload: { sign: string, confidence: number }."
          />
          <EventRow
            name="vision:word:committed"
            desc="Linguistic buffer committed a full word. payload: { word: string }."
          />
          <EventRow
            name="vision:sentence:committed"
            desc="A full sentence was committed. payload: { text: string }."
          />
        </EventTable>
      </section>

      {/* Composition events */}
      <section className="space-y-4">
        <SectionHead id="composition" label="Composition" />
        <EventTable>
          <EventRow
            name="composition:token:added"
            desc="A new token entered the 400 ms debounce window. payload: { token: CompositionToken }."
          />
          <EventRow
            name="composition:flushed"
            desc="Debounce fired — tokens are ready for translation. payload: { tokens: CompositionToken[] }."
          />
        </EventTable>
      </section>

      {/* Renderer events */}
      <section className="space-y-4">
        <SectionHead id="renderer" label="Renderer" />
        <EventTable>
          <EventRow
            name="renderer:frame:started"
            desc="RendererDirector began a new FrameItem. payload: { frame: FrameItem }."
          />
          <EventRow
            name="renderer:frame:finished"
            desc="A FrameItem completed. payload: { frame: FrameItem }."
          />
          <EventRow
            name="renderer:queue:empty"
            desc="All FrameItems in the plan have been consumed — animation complete."
          />
        </EventTable>
      </section>

      {/* Session events */}
      <section className="space-y-4">
        <SectionHead id="session" label="Session" />
        <EventTable>
          <EventRow
            name="session:cmd:start"
            desc="Command to start a translation. payload: { mode, text?, units? }. Dispatched by translate() and translateUnits()."
          />
          <EventRow name="session:cmd:stop" desc="Command to stop the current session." />
          <EventRow
            name="session:cmd:cancel"
            desc="Command to abort in-flight work. Dispatched by cancel()."
          />
        </EventTable>
      </section>

      {/* Runtime events */}
      <section className="space-y-4">
        <SectionHead id="runtime" label="Runtime Core" />
        <EventTable>
          <EventRow
            name="runtime:ready"
            desc="All plugins initialized — runtime is accepting commands."
          />
          <EventRow name="runtime:error" desc="Unrecoverable error. payload: { error: string }." />
          <EventRow
            name="runtime:stopped"
            desc="runtime.stop() completed — all plugins torn down."
          />
        </EventTable>
      </section>

      {/* Keyboard events */}
      <section className="space-y-4">
        <SectionHead id="keyboard" label="Keyboard" />
        <EventTable>
          <EventRow
            name="keyboard:shortcut"
            desc="A registered keyboard shortcut was triggered. payload: { key: string, modifiers: string[] }."
          />
        </EventTable>
      </section>
    </div>
  );
}
