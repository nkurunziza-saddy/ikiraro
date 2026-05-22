import { createFileRoute } from "@tanstack/react-router";
import {
  CodeBlock,
  PageTitle,
  SectionHead,
  EventTable,
  EventRow,
  Callout,
} from "@/components/docs/primitives";
export const Route = createFileRoute("/docs/events")({
  component: EventsPage,
});
const SNIPPET_SUBSCRIBE = `import { createIkiraro } from "@ikiraro/sdk";
const runtime = await createIkiraro({ sdk: { groqApiKey: "..." } });
// Subscribe to a specific event — payload is narrowed to that event's type
runtime.subscribe("translation:finished", (event) => {
  // event.type      — "translation:finished"
  // event.payload   — TranslationEnvelope (narrowed automatically)
  // event.timestamp — unix ms when the event was dispatched
  // event.source    — which plugin dispatched it ("translation", "sdk", etc.)
  console.log(event.payload.plan.glossText);
  console.log(event.payload.rendererQueue.length, "frames");
});
// Dispatch a command into the bus
runtime.dispatch({
  type: "session:cmd:start",
  payload: { mode: "text", text: "Hello" },
  timestamp: Date.now(),
  source: "app",
});`;
const SNIPPET_SUBSCRIBE_HOOK = `// Inside a React component — use ikiraroClient for low-level event access
import { ikiraroClient, useIkiraro } from "@/lib/ikiraro";
const { isReady } = useIkiraro();
useEffect(() => {
  if (!isReady) return;
  const runtime = ikiraroClient.runtime;
  if (!runtime) return;
  const unsub = runtime.subscribe("translation:finished", ({ payload }) => {
    console.log("Gloss:", payload.plan.glossText);
  });
  return unsub;
}, [isReady]);`;
function EventsPage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="Event Reference"
        subtitle="All communication between plugins flows through a typed EventBus. Every event has the shape { type, payload, timestamp, source }. Switching on event.type narrows the payload type automatically."
      />

      <section className="space-y-4">
        <SectionHead id="subscribing" label="Subscribing" />
        <CodeBlock code={SNIPPET_SUBSCRIBE} label="runtime.subscribe()" />
        <CodeBlock code={SNIPPET_SUBSCRIBE_HOOK} label="inside useIkiraro" />
        <Callout>
          Handlers registered via{" "}
          <code className="font-mono text-foreground">runtime.subscribe</code> fire synchronously in
          registration order. If you need async handling, launch the async work inside the handler
          without awaiting — the EventBus is synchronous by design.
        </Callout>
      </section>

      <section className="space-y-4">
        <SectionHead id="translation" label="Translation" />
        <EventTable>
          <EventRow
            name="translation:cmd:request"
            desc="Command to begin a translation. payload: TranslationRequest { mode, text?, audio?, units?, sttModel?, context? }. Dispatched by SessionPlugin."
          />
          <EventRow
            name="translation:started"
            desc="Planner began processing. payload: TranslationRequest (same as the request). Sets isTranslating = true."
          />
          <EventRow
            name="translation:finished"
            desc="Translation complete. payload: TranslationEnvelope — pass directly to AvatarViewer or snapshot.lastEnvelope."
          />
          <EventRow
            name="translation:error"
            desc="Planner threw or STT failed. payload: string (error message). Sets snapshot.error."
          />
        </EventTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="speech" label="Speech" />
        <EventTable>
          <EventRow
            name="speech:cmd:start"
            desc="Command to open the microphone. Dispatched by SessionPlugin when mode = 'speech'. payload: undefined."
          />
          <EventRow
            name="speech:cmd:stop"
            desc="Command to stop recording and submit. payload: { sttModel?, prompt?, context? }."
          />
          <EventRow
            name="speech:cmd:cancel"
            desc="Command to abandon the current recording without translating. payload: undefined."
          />
          <EventRow
            name="speech:status-change"
            desc='Mic lifecycle update. payload: "idle" | "capturing" | "processing" | "error". Updates snapshot.speechStatus.'
          />
          <EventRow
            name="speech:level-update"
            desc="Real-time amplitude. payload: number (0–1 normalized). Fires every animation frame while capturing. Updates snapshot.speechLevel."
          />
        </EventTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="session" label="Session" />
        <EventTable>
          <EventRow
            name="session:cmd:start"
            desc="Start a session. payload: { mode, text?, units?, sttModel?, prompt?, context? }. Dispatched by runtime.translate(), translateUnits(), startSpeech()."
          />
          <EventRow
            name="session:cmd:stop"
            desc="Stop the current session (end speech recording and translate). payload: undefined."
          />
          <EventRow
            name="session:cmd:cancel"
            desc="Abort in-flight work without committing. payload: undefined."
          />
          <EventRow
            name="session:status-change"
            desc='Session phase transition. payload: "idle" | "recording" | "translating" | "finished" | "error". Updates snapshot.status.'
          />
        </EventTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="vision" label="Vision" />
        <EventTable>
          <EventRow
            name="vision:cmd:start"
            desc="Command to start camera tracking. payload: { videoElement: HTMLVideoElement }."
          />
          <EventRow
            name="vision:cmd:stop"
            desc="Command to stop camera tracking. payload: undefined."
          />
          <EventRow
            name="vision:status-change"
            desc='Tracking pipeline status. payload: "idle" | "starting" | "active" | "error".'
          />
          <EventRow
            name="vision:tracking"
            desc="High-frequency frame data. payload: CameraTrackingState { landmarks, classification, currentWord, sentence, sentenceText, committedToken }."
          />
        </EventTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="composition" label="Composition" />
        <EventTable>
          <EventRow
            name="input:token"
            desc="A token entered the system from any input source (vision, keyboard, speech). payload: IkiraroToken { id, value, type, source, timestamp, confidence, stability }."
          />
          <EventRow
            name="composition:update"
            desc="CompositionPlugin flushed its 400 ms debounce window. payload: { newTokens?, newUnits?, allEvents }."
          />
          <EventRow
            name="composition:cmd:clear"
            desc="Command to clear the composition buffer. payload: undefined."
          />
          <EventRow
            name="composition:cleared"
            desc="Composition buffer was cleared. payload: undefined."
          />
        </EventTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="keyboard" label="Keyboard" />
        <EventTable>
          <EventRow
            name="keyboard:cmd:press"
            desc="Dispatch a virtual key press from code (e.g. an on-screen ASL keyboard). payload: { unit: string }. Physical keypresses emit input:token directly."
          />
        </EventTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="runtime" label="Runtime Core" />
        <EventTable>
          <EventRow
            name="runtime:ready"
            desc="All plugins have initialized — runtime is accepting commands. payload: undefined."
          />
          <EventRow
            name="runtime:status-change"
            desc='Internal runtime lifecycle transition. payload: "idle" | "active" | "processing" | "error". Distinct from session status in the snapshot.'
          />
        </EventTable>
      </section>
    </div>
  );
}
