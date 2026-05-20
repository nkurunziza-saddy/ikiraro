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

export const Route = createFileRoute("/docs/components")({
  component: ComponentsPage,
});

const SNIPPET_AVATAR = `import { AvatarViewer } from "@ikiraro/sdk";

// Full-featured — pass the envelope from useIkiraro
<AvatarViewer
  envelope={snapshot.lastEnvelope}   // TranslationEnvelope | null
  modelUrl="/models/avatar.glb"       // path to your .glb signer model
  className="w-full h-[400px]"
/>

// Null resets the avatar to rest position
<AvatarViewer envelope={null} modelUrl="/models/avatar.glb" />`;

const SNIPPET_AVATAR_BLEND = `// Blend modes are set per FrameItem in the SignPlan:
//
// "blend"  — smooth interpolation between poses (default for lexemes)
// "snap"   — immediate cut (used for fingerspell transitions)
// "none"   — no transition, hold the previous pose
//
// The RendererDirector inside AvatarViewer applies these automatically.
// You don't configure this on the component — it comes from the plan.`;

const SNIPPET_AUDIO_VIZ = `import { AudioVisualizer } from "@ikiraro/sdk";

// Renders an animated bar chart driven by real-time mic amplitude
<AudioVisualizer
  level={snapshot.speechLevel}  // 0–1 float from useIkiraro snapshot
  count={20}                    // number of bars (default 20)
/>

// Show it only while recording
{snapshot.speechStatus === "capturing" && (
  <AudioVisualizer level={snapshot.speechLevel} count={24} />
)}`;

const SNIPPET_ASL_HAND = `import { AslHandSvg } from "@ikiraro/sdk";

// Static SVG illustration of an ASL handshape
<AslHandSvg letter="A" size={24} className="text-foreground" />

// Fingerspelling keyboard grid
{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
  <button key={l} onClick={() => setSignUnits((p) => [...p, l])}>
    <AslHandSvg letter={l} size={18} className="text-muted-foreground/60" />
    <span>{l}</span>
  </button>
))}`;

const SNIPPET_WEB_SPEECH = `import { WebSpeechProvider } from "@ikiraro/sdk";

// Singleton TTS — synchronized with avatar playback
const tts = WebSpeechProvider.getInstance();

// Speak when a new envelope arrives
useEffect(() => {
  if (!envelope) return;
  tts.speak(envelope.normalizedText);
}, [envelope]);`;

function ComponentsPage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="UI Components"
        subtitle="All components are re-exported from @ikiraro/components. They accept standard className props and use Tailwind design tokens — they adapt to your theme without configuration."
      />

      {/* AvatarViewer */}
      <section className="space-y-4">
        <SectionHead id="avatar-viewer" label="AvatarViewer" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The primary 3D signing avatar. Built on React Three Fiber — it loads a GLTF model, then
          drives it through the <code className="font-mono text-foreground">RendererDirector</code>{" "}
          frame queue. Each <code className="font-mono text-foreground">FrameItem</code> in the plan
          specifies a pose, duration, and blend mode; the director applies coarticulation between
          poses automatically.
        </p>
        <CodeBlock code={SNIPPET_AVATAR} label="AvatarViewer" />
        <RefTable>
          <RefTableHead cols={["Prop", "Type", "Description"]} />
          <RefRow
            name="envelope"
            type="TranslationEnvelope | null"
            desc="The active translation. Null returns the avatar to its rest position."
          />
          <RefRow
            name="modelUrl"
            type="string"
            desc="URL or path to a .glb model with the required bone rig and morph targets."
          />
          <RefRow
            name="className"
            type="string?"
            desc="Standard className forwarded to the canvas container div."
          />
        </RefTable>
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2">
            Blend modes
          </p>
          <CodeBlock code={SNIPPET_AVATAR_BLEND} label="blend modes" />
        </div>
        <Callout>
          The avatar canvas uses an <code className="font-mono text-foreground">aspect-[4/5]</code>{" "}
          container by default. Ensure the parent has an explicit height or use{" "}
          <code className="font-mono text-foreground">className="w-full h-[400px]"</code> to
          constrain it. The canvas fills the container.
        </Callout>
      </section>

      {/* AudioVisualizer */}
      <section className="space-y-4">
        <SectionHead id="audio-visualizer" label="AudioVisualizer" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          An animated bar chart driven by a real-time audio level (0-1). Designed to be fed directly
          from <code className="font-mono text-foreground">snapshot.speechLevel</code>.
        </p>
        <CodeBlock code={SNIPPET_AUDIO_VIZ} label="AudioVisualizer" />
        <RefTable>
          <RefTableHead cols={["Prop", "Type", "Description"]} />
          <RefRow
            name="level"
            type="number (0-1)"
            desc="Current audio amplitude. Feed snapshot.speechLevel directly."
          />
          <RefRow name="count" type="number?" desc="Number of bars to render. Default 20." />
        </RefTable>
      </section>

      {/* AslHandSvg */}
      <section className="space-y-4">
        <SectionHead id="asl-hand-svg" label="AslHandSvg" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          A static SVG illustration of an ASL handshape for a given letter. Useful for
          fingerspelling keyboard grids and sign reference panels. The SVG paths inherit color from
          the parent via Tailwind's text color utilities.
        </p>
        <CodeBlock code={SNIPPET_ASL_HAND} label="AslHandSvg" />
        <RefTable>
          <RefTableHead cols={["Prop", "Type", "Description"]} />
          <RefRow name="letter" type="string (A-Z)" desc="The ASL letter to illustrate." />
          <RefRow name="size" type="number?" desc="Width and height in pixels. Default 24." />
          <RefRow
            name="className"
            type="string?"
            desc="Tailwind classes — use text color utilities to tint the SVG paths."
          />
        </RefTable>
      </section>

      {/* WebSpeechProvider */}
      <section className="space-y-4">
        <SectionHead id="web-speech-provider" label="WebSpeechProvider" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          A singleton that wraps the Web Speech API for synchronized TTS. It queues speech requests
          and cancels pending ones on new input, keeping audio in sync with the avatar. Construct
          once at module level so you don't create multiple instances.
        </p>
        <CodeBlock code={SNIPPET_WEB_SPEECH} label="WebSpeechProvider" />
        <Callout>
          <strong className="text-foreground">Browser support:</strong>{" "}
          <code className="font-mono text-foreground">WebSpeechProvider</code> uses the{" "}
          <code className="font-mono text-foreground">SpeechSynthesis</code> API. It's available in
          all modern browsers, but voice quality varies by OS. Chrome on desktop generally has the
          best voices.
        </Callout>
      </section>

      {/* Low-level */}
      <section className="space-y-4">
        <SectionHead id="low-level" label="Low-level components" />
        <RefTable>
          <RefTableHead cols={["Export", "Description"]} />
          <RefRow
            name="SignModelGLTF"
            desc="Raw React Three Fiber model component. Use when you need direct access to the R3F scene — e.g. custom lighting or post-processing."
          />
          <RefRow
            name="HandOverlay"
            desc="SVG overlay that renders hand landmark points over a camera feed. Accepts a tracking prop (CameraTrackingState)."
          />
        </RefTable>
      </section>
    </div>
  );
}
