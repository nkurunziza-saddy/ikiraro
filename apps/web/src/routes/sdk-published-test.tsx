import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  CompositionPlugin,
  IkiraroRuntime,
  InspectorPlugin,
  RendererDirector,
  REST_POSE,
  SessionPlugin,
  SignPlayer3D,
  TranslationPlugin,
  WebSpeechProvider,
  articulate,
  buildFrameQueue,
  buildPlanFromUnits,
  createEnvelope,
  useHandTracking,
  type IkiraroEvent,
  type TranslationEnvelope,
} from "@ikiraro/sdk-published";
import { PipelineView } from "@ikiraro/sdk-published/components";
import { STT_MODELS, normalizeText } from "@ikiraro/sdk-published/engine";
import { Button } from "@ikiraro/sdk-published/components";
import { Alert, AlertDescription, AlertTitle } from "@ikiraro/sdk-published/components";
import { Badge } from "@ikiraro/sdk-published/components";
import { Input } from "@ikiraro/sdk-published/components";
import { Textarea } from "@ikiraro/sdk-published/components";

export const Route = createFileRoute("/sdk-published-test")({
  component: PublishedSdkTestPage,
});

const SDK_VERSION = "0.2.2";
const DEMO_UNITS = ["HELLO", "THANK-YOU", "/", "WATER"];

function makeEnvelope(units: string[]): TranslationEnvelope {
  const plan = buildPlanFromUnits(units);
  return createEnvelope(plan, {
    mode: "sign-keys",
    rawInput: units.join(" "),
  });
}

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs">
      <span className="font-bold">{label}</span>
      <span
        className={
          ok
            ? "text-[10px] font-bold uppercase tracking-widest text-emerald-600"
            : "text-[10px] font-bold uppercase tracking-widest text-destructive"
        }
      >
        {ok ? "ok" : "issue"}
      </span>
    </div>
  );
}

function PublishedSdkTestPage() {
  const [input, setInput] = useState(DEMO_UNITS.join(" "));
  const [envelope, setEnvelope] = useState<TranslationEnvelope>(() => makeEnvelope(DEMO_UNITS));
  const [runtime, setRuntime] = useState<IkiraroRuntime | null>(null);
  const [events, setEvents] = useState<IkiraroEvent[]>([]);
  const [runtimeEnvelope, setRuntimeEnvelope] = useState<TranslationEnvelope | null>(null);
  const [ttsStatus, setTtsStatus] = useState(
    WebSpeechProvider.isSupported() ? "ready" : "unsupported",
  );
  const camera = useHandTracking();

  const importSanity = useMemo(
    () => ({
      main:
        typeof SignPlayer3D === "function" &&
        typeof buildPlanFromUnits === "function" &&
        typeof createEnvelope === "function",
      components: typeof PipelineView === "function" && typeof Button === "function",
      engine:
        STT_MODELS.includes("whisper-large-v3") &&
        normalizeText(" Hello  friend ") === "Hello friend",
      renderer: typeof RendererDirector === "function" && Object.keys(REST_POSE).length > 0,
      queue: buildFrameQueue(envelope.plan).length === envelope.rendererQueue.length,
    }),
    [envelope],
  );

  useEffect(() => {
    let active = true;

    const init = async () => {
      const nextRuntime = await articulate({
        plugins: [
          new SessionPlugin(),
          new CompositionPlugin(),
          new TranslationPlugin(),
          new InspectorPlugin(),
        ],
      });

      if (!active) {
        await nextRuntime.stop();
        return;
      }

      const unsubscribeAll = nextRuntime.subscribeAll((event) => {
        setEvents((current) => [event, ...current].slice(0, 12));
      });
      const unsubscribeFinished = nextRuntime.subscribe("translation:finished", (event) => {
        setRuntimeEnvelope(event.payload);
      });

      setRuntime(nextRuntime);

      return async () => {
        unsubscribeAll();
        unsubscribeFinished();
        await nextRuntime.stop();
      };
    };

    let cleanup: (() => Promise<void>) | undefined;
    void init().then((teardown) => {
      cleanup = teardown;
    });

    return () => {
      active = false;
      void cleanup?.();
      camera.stop();
    };
  }, []);

  function parseUnits(value: string) {
    return value.trim().toUpperCase().split(/\s+/).filter(Boolean);
  }

  function handlePlan(event: FormEvent) {
    event.preventDefault();
    const units = parseUnits(input);
    if (units.length === 0) return;
    setEnvelope(makeEnvelope(units));
  }

  function handleRuntimeSignKeys() {
    const units = parseUnits(input);
    if (!runtime || units.length === 0) return;

    runtime.dispatch({
      type: "session:cmd:start",
      payload: { mode: "sign-keys", units },
      timestamp: Date.now(),
      source: "published-sdk-test",
    });
  }

  async function handleSpeak() {
    try {
      setTtsStatus("speaking");
      await WebSpeechProvider.getInstance().speak(envelope.rawInput.replaceAll("/", "pause"));
      setTtsStatus("ready");
    } catch (error) {
      setTtsStatus(error instanceof Error ? error.message : "speech failed");
    }
  }

  const activeEnvelope = runtimeEnvelope ?? envelope;
  const cameraStatus =
    camera.error ?? (camera.isReady ? `ready ${camera.delegate ?? ""}` : "booting");

  return (
    <div className="min-h-full bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">
              Published package
            </Badge>
            <code className="text-xs text-muted-foreground">
              @ikiraro/sdk-published =&gt; @ikiraro/sdk@{SDK_VERSION}
            </code>
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight">
            Published SDK integration page
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            This route imports from the npm package alias, not the local workspace SDK. It checks
            planning, rendering, runtime plugins, component exports, engine subpath exports, TTS,
            and the camera hook/worker path.
          </p>
        </header>

        <section className="grid gap-3 md:grid-cols-5">
          <StatusPill label="main export" ok={importSanity.main} />
          <StatusPill label="components export" ok={importSanity.components} />
          <StatusPill label="engine export" ok={importSanity.engine} />
          <StatusPill label="renderer export" ok={importSanity.renderer} />
          <StatusPill label="queue parity" ok={importSanity.queue} />
        </section>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex min-w-0 flex-col gap-8">
            <form onSubmit={handlePlan} className="rounded-xl border bg-muted/10 p-5">
              <div className="mb-4 flex flex-col gap-1">
                <h2 className="text-lg font-bold">Manual sign/text planning</h2>
                <p className="text-xs text-muted-foreground">
                  Space-separated gloss units. Use <code>/</code> for a pause.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  className="font-mono uppercase"
                />
                <Button type="submit">Build plan</Button>
                <Button type="button" variant="outline" onClick={handleRuntimeSignKeys}>
                  Runtime translate
                </Button>
              </div>
            </form>

            <div className="rounded-xl border bg-background p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Sign player</h2>
                  <p className="text-xs text-muted-foreground">
                    Rendered with <code>SignPlayer3D</code> from the published package.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={handleSpeak}>
                  TTS: {ttsStatus}
                </Button>
              </div>
              <SignPlayer3D envelope={activeEnvelope} />
            </div>

            <div className="rounded-xl border bg-background p-5">
              <h2 className="mb-4 text-lg font-bold">Pipeline view</h2>
              <PipelineView envelope={activeEnvelope} />
            </div>
          </div>

          <aside className="flex flex-col gap-5">
            <Alert>
              <AlertTitle>Camera package path</AlertTitle>
              <AlertDescription>
                Worker status: <span className="font-mono">{cameraStatus}</span>. Start only when
                you want to grant camera access.
              </AlertDescription>
            </Alert>

            <div className="rounded-xl border bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">Camera hook</h2>
                <span className="text-xs text-muted-foreground">{camera.fps} FPS</span>
              </div>
              <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-muted">
                <video
                  ref={camera.videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover scale-x-[-1]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void camera.start()}
                  disabled={camera.isActive || !camera.isReady}
                >
                  Start camera
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={camera.stop}>
                  Stop
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={camera.clear}>
                  Clear
                </Button>
              </div>
              <Textarea
                readOnly
                className="mt-4 min-h-24 font-mono text-xs"
                value={JSON.stringify(camera.tracking.classification?.candidates ?? [], null, 2)}
              />
            </div>

            <div className="rounded-xl border bg-background p-5">
              <h2 className="mb-4 font-bold">Runtime events</h2>
              <div className="flex max-h-80 flex-col gap-2 overflow-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No runtime events yet.</p>
                ) : (
                  events.map((event, index) => (
                    <div key={`${event.timestamp}-${index}`} className="rounded border p-2">
                      <p className="font-mono text-xs font-bold">{event.type}</p>
                      <p className="text-[10px] text-muted-foreground">{event.source}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
