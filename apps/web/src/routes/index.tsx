import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const INSTALL_ROWS = [
  {
    icon: "sdk",
    cmd: "bun add @ikiraro/sdk",
    note: "recommended entry point",
  },
  {
    icon: "renderer",
    cmd: "bun add @ikiraro/renderer",
    note: "3D avatar + camera overlay",
  },
  {
    icon: "runtime",
    cmd: "bun add @ikiraro/runtime",
    note: "orchestration + plugins",
  },
  {
    icon: "engine",
    cmd: "bun add @ikiraro/engine",
    note: "ML inference + sign recognition",
  },
] as const;

const PIPELINE_STEPS = [
  {
    num: "01",
    title: "Input",
    body: "Text is passed directly. Voice is transcribed via the Web Speech API. Camera feed is processed by MediaPipe to extract 21 hand landmarks per frame at up to 30 fps.",
  },
  {
    num: "02",
    title: "Translation",
    body: 'English is converted to ASL gloss notation — a stripped linguistic representation of sign language. "I will go to the store" becomes STORE GO-WILL I. The engine applies grammatical reordering rules for natural ASL structure.',
  },
  {
    num: "03",
    title: "Lexeme planning",
    body: "The LinguisticBuffer groups gloss tokens into phonetic windows and resolves sign boundaries. Plateau detection identifies the hold phase that defines each sign's temporal extent, reducing perceived latency by ~250 ms.",
  },
  {
    num: "04",
    title: "Frame building",
    body: "FrameBuilder converts the lexeme plan into an animation envelope: a precise sequence of pose targets, transition curves, and timing data. Coarticulation is applied so each sign flows smoothly into the next.",
  },
  {
    num: "05",
    title: "Rendering",
    body: "AvatarViewer drives a rigged GLTF mesh via WebGL. Each joint is controlled by a dual-spring system — one high-stiffness spring for large-amplitude reach (shoulder, elbow) and one fine-tuned spring for handshape precision.",
  },
] as const;

const PACKAGES = [
  {
    name: "@ikiraro/engine",
    label: "Core ML",
    body: "Runs a WebAssembly sign recognizer in the browser. Matches MediaPipe landmarks against a curated ASL centroid library using orientation-invariant Procrustes alignment. Velocity-based plateau detection identifies sign holds with sub-frame accuracy. No GPU required.",
  },
  {
    name: "@ikiraro/runtime",
    label: "Orchestration",
    body: "Manages input channels, plugin lifecycle, and the event bus. Provides the accessibility-mode system (standard, audio-first, visual-first), a priority audio queue, earcon support, and a keyboard shortcut manager. Every feature ships as a hot-swappable plugin.",
  },
  {
    name: "@ikiraro/renderer",
    label: "Visual output",
    body: "Renders a rigged 3D avatar via WebGL using Three.js. Accepts animation envelopes from the planner and drives each joint through spring physics. Includes HandOverlay for real-time MediaPipe visualization and AudioVisualizer for voice feedback.",
  },
  {
    name: "@ikiraro/sdk",
    label: "Public API",
    body: "A thin configuration layer and a single React hook — useIkiraro — that wires the other three packages together. Exposes snapshot state, translate(), startSpeech(), and an onTranslated event. The recommended entry point for most projects.",
  },
] as const;

const SPECS = [
  { key: "Output", val: "ASL · sign language" },
  { key: "Input", val: "Text · voice · vision" },
  { key: "Rendering", val: "WebGL 3D avatar" },
  { key: "License", val: "Open source · MIT" },
  { key: "Runtime", val: "Browser · edge" },
  { key: "Engine", val: "In-browser ML · WASM" },
  { key: "Latency", val: "~250 ms reduction" },
  { key: "Shadow", val: "none — ever" },
] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy"
      className="copy-btn flex items-center p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-[180ms] active:scale-[0.98]"
    >
      {copied ? <Check className="size-[14px] text-secondary" /> : <Copy className="size-[14px]" />}
    </button>
  );
}

function PackageIcon({ pkg }: { pkg: string }) {
  return (
    <svg
      className="size-[15px] opacity-35 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {pkg === "sdk" && <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />}
      {pkg === "renderer" && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="12" cy="12" r="4" />
        </>
      )}
      {pkg === "runtime" && (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      )}
      {pkg === "engine" && (
        <>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <path d="M2 8.5l10 6.5 10-6.5" />
        </>
      )}
    </svg>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen px-8 pt-12 pb-28 font-sans bg-background text-foreground">
      <div className="max-w-[440px] mx-auto">
        {/* ── Hero — dictionary entry ───────────────────────────── */}
        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            Open-source SDK · sign language accessibility
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[20px] font-medium tracking-[-0.03em]">ikiraro</span>
            <span className="text-[13px] italic font-light text-muted-foreground">
              /ˌi-ki-ˈra-ro/ &nbsp;n. &nbsp;[Kinyarwanda]
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-[13px] font-light leading-[1.8] text-secondary">
              1 &nbsp;a structure forming a passage between two separate banks.
            </p>
            <p className="text-[13px] font-light leading-[1.8] text-secondary">
              2 &nbsp;fig. a connection enabling exchange between parties or systems.
            </p>
            <p className="text-[13px] italic font-light leading-[1.8] pl-4 text-muted-foreground">
              b &nbsp;(of communication) bridging the gap between spoken and signed language.
            </p>
            <p className="text-[13px] font-light leading-[1.8] text-secondary">
              3 &nbsp;<span className="font-normal text-foreground not-italic">Ikiraro Bridge</span>{" "}
              — an accessibility engine that translates text and speech into sign language in real
              time.
            </p>
          </div>
        </section>

        <Separator className="my-14" />

        {/* ── What it is ───────────────────────────────────────── */}
        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            What it is
          </p>
          <p className="text-[14px] leading-[1.85] font-light tracking-[0.005em] text-secondary mb-5">
            <strong className="font-medium text-foreground">Ikiraro</strong> is a TypeScript SDK
            that renders American Sign Language through a 3D avatar — directly in the browser. No
            server round-trips. No dependencies beyond a WebGL context.
          </p>
          <p className="text-[14px] leading-[1.85] font-light tracking-[0.005em] text-secondary mb-5">
            The SDK exposes a complete pipeline from input to motion: text, voice, and camera all
            feed a single translation engine that produces frame-perfect ASL animation at up to 60
            fps. The avatar is a rigged GLTF mesh driven by dual-spring kinematics — stiff enough to
            hit precise sign poses, loose enough to flow between them.
          </p>
          <p className="text-[14px] leading-[1.85] font-light tracking-[0.005em] text-secondary">
            Sign language accessibility has historically required recorded video clips or
            server-side avatar services. Ikiraro moves that entire system into the browser, making
            it composable, extensible, and offline-capable. A deaf user on a slow connection gets
            the same fidelity as one on fiber.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-6">
            {[
              "ASL rendering",
              "Voice input",
              "Hand tracking",
              "3D avatar",
              "Browser-native",
              "Offline capable",
              "Plugin system",
              "Open source",
            ].map((label) => (
              <Badge
                key={label}
                variant="outline"
                className="rounded-full text-[11.5px] px-3 h-6 font-normal tracking-[0.01em] text-secondary border-border hover:border-muted-foreground transition-colors duration-[180ms]"
              >
                {label}
              </Badge>
            ))}
          </div>
        </section>

        <Separator className="my-14" />

        {/* ── The pipeline ─────────────────────────────────────── */}
        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            How it works
          </p>
          <p className="text-[14px] font-light leading-[1.85] text-secondary mb-8">
            Five stages, all in-browser. Every step runs locally — no API calls leave the device
            except the optional LLM translation, which can be replaced with a custom gloss resolver.
          </p>

          <div className="space-y-px rounded-[16px] overflow-hidden border border-border">
            {PIPELINE_STEPS.map(({ num, title, body }) => (
              <div key={num} className="bg-card px-4 py-4 border-b border-border last:border-none">
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span className="text-[11px] font-normal text-muted-foreground tabular-nums tracking-[0.05em]">
                    {num}
                  </span>
                  <span className="text-[13px] font-medium text-foreground tracking-[-0.01em]">
                    {title}
                  </span>
                </div>
                <p className="text-[12.5px] font-light text-secondary leading-[1.7] pl-[calc(1.5ch+0.75rem)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-14" />

        {/* ── Architecture ─────────────────────────────────────── */}
        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-2">
            Architecture
          </p>
          <p className="text-[13px] font-light text-muted-foreground leading-[1.65] mb-8">
            Four focused packages. Each can be used independently; the SDK wires them together.
          </p>

          <div className="space-y-2">
            {PACKAGES.map(({ name, label, body }) => (
              <div key={name} className="bg-card border border-border rounded-[14px] px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-medium text-foreground tracking-[-0.01em]">
                    {name}
                  </span>
                  <span className="text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5 font-normal">
                    {label}
                  </span>
                </div>
                <p className="text-[12.5px] font-light text-secondary leading-[1.7]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-14" />

        {/* ── Design principles ────────────────────────────────── */}
        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            Design principles
          </p>

          <div className="space-y-6">
            <div>
              <p className="text-[13px] font-medium text-foreground mb-1.5">
                Deep modules, shallow interfaces
              </p>
              <p className="text-[13px] font-light text-secondary leading-[1.75]">
                Each package hides substantial complexity behind a small surface area. The engine
                does Procrustes alignment, centroid matching, and plateau detection — you call{" "}
                <code className="text-[12px] bg-muted text-foreground px-1.5 py-0.5 rounded-[4px] font-normal">
                  recognize(landmarks)
                </code>
                .
              </p>
            </div>

            <div>
              <p className="text-[13px] font-medium text-foreground mb-1.5">
                Accessibility as architecture, not afterthought
              </p>
              <p className="text-[13px] font-light text-secondary leading-[1.75]">
                The runtime ships three built-in modes: standard, audio-first (for users who rely on
                audio cues), and visual-first (for deaf users who should not receive audio prompts).
                Mode determines which plugins activate, not just what gets rendered.
              </p>
            </div>

            <div>
              <p className="text-[13px] font-medium text-foreground mb-1.5">
                Composable by default
              </p>
              <p className="text-[13px] font-light text-secondary leading-[1.75]">
                Every input channel is a plugin. Every output adapter is a plugin. You can swap the
                LLM for a custom gloss resolver, add a transcript overlay, or route translated
                sentences to a remote service — without touching the core pipeline.
              </p>
            </div>

            <div>
              <p className="text-[13px] font-medium text-foreground mb-1.5">
                No shadows. No pure grays.
              </p>
              <p className="text-[13px] font-light text-secondary leading-[1.75]">
                The visual design uses a single warm sand palette throughout. Every color has a
                slight ochre undertone. Depth is achieved through border contrast, not elevation.
                The rendering canvas is the only place with anything approaching a dramatic visual.
              </p>
            </div>
          </div>
        </section>

        <Separator className="my-14" />

        {/* ── Use cases ────────────────────────────────────────── */}
        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            Use cases
          </p>

          <div className="grid grid-cols-2 rounded-[16px] overflow-hidden border border-border bg-border gap-px">
            {[
              {
                key: "Live captions",
                val: "Real-time ASL alongside speech in video calls and streams",
              },
              {
                key: "Kiosks",
                val: "Public information terminals that communicate in sign language",
              },
              {
                key: "Education",
                val: "Interactive ASL learning tools with immediate visual feedback",
              },
              {
                key: "Healthcare",
                val: "Patient intake forms and appointment instructions in ASL",
              },
              {
                key: "E-commerce",
                val: "Product descriptions and checkout flows accessible to Deaf shoppers",
              },
              {
                key: "Gaming",
                val: "NPCs and cutscenes that sign dialogue alongside voiced audio",
              },
            ].map(({ key, val }) => (
              <div key={key} className="bg-card px-3.5 py-3">
                <p className="text-[11px] text-muted-foreground mb-0.5 tracking-[0.04em]">{key}</p>
                <p className="text-[12px] font-light text-secondary leading-[1.6]">{val}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-14" />

        {/* ── Install ──────────────────────────────────────────── */}
        <section className="mb-14">
          <p className="text-[16px] font-medium tracking-[-0.02em] mb-1">Install</p>
          <p className="text-[13px] font-light leading-[1.65] text-muted-foreground mb-6">
            Packages ship separately. Start with the SDK; add renderer and runtime for the full
            pipeline.
          </p>

          <div className="space-y-1.5">
            {INSTALL_ROWS.map(({ icon, cmd, note }) => (
              <div
                key={cmd}
                className="flex items-center justify-between bg-card border border-border rounded-[10px] px-3.5 py-3 transition-all duration-[180ms] hover:border-muted-foreground/50 active:scale-[0.98] group cursor-default"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2.5 text-[13px] font-normal tracking-[0.01em] text-secondary">
                    <PackageIcon pkg={icon} />
                    {cmd}
                  </div>
                  <span className="text-[11px] font-light text-muted-foreground pl-[23px]">
                    {note}
                  </span>
                </div>
                <CopyButton text={cmd} />
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-14" />

        {/* ── Quick start ──────────────────────────────────────── */}
        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            Quick start
          </p>
          <p className="text-[13px] font-light text-secondary leading-[1.7] mb-5">
            A single hook connects everything. Pass a configuration object to{" "}
            <code className="text-[12px] bg-muted text-foreground px-1.5 py-0.5 rounded-[4px]">
              createIkiraroClient
            </code>{" "}
            and destructure what you need:
          </p>
          <pre className="bg-card border border-border rounded-[12px] p-4 text-[12px] font-light text-secondary leading-relaxed overflow-x-auto custom-scrollbar whitespace-pre">
            {`import { createIkiraroClient } from "@ikiraro/sdk";

const { useIkiraro } = createIkiraroClient({
  sdk: { groqApiKey: "gsk_…" },
});

function SignApp() {
  const { snapshot, translate } = useIkiraro();
  return (
    <button onClick={() => translate("Hello")}>
      Sign it
    </button>
  );
}`}
          </pre>
          <p className="text-[12.5px] font-light text-muted-foreground mt-3 leading-[1.65]">
            Mount{" "}
            <code className="text-[12px] bg-muted text-foreground px-1.5 py-0.5 rounded-[4px]">
              {"<AvatarViewer envelope={snapshot.lastEnvelope} />"}
            </code>{" "}
            anywhere in the tree and the avatar animates automatically.
          </p>
        </section>

        <Separator className="my-14" />

        {/* ── Specs ────────────────────────────────────────────── */}
        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            Specifications
          </p>
          <div className="grid grid-cols-2 rounded-[16px] overflow-hidden border border-border bg-border gap-px">
            {SPECS.map(({ key, val }) => (
              <div key={key} className="bg-card px-3.5 py-3">
                <p className="text-[11px] text-muted-foreground mb-0.5 tracking-[0.04em]">{key}</p>
                <p className="text-[12.5px] font-normal text-secondary">{val}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
