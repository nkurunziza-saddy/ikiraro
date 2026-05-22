import { createFileRoute, Link } from "@tanstack/react-router";
import { CodeBlock, PageTitle, Callout } from "@/components/docs/primitives";
export const Route = createFileRoute("/docs/")({
  component: SdkOverviewPage,
});
const SNIPPET_INSTALL = `# npm
npm install @ikiraro/sdk
# bun
bun add @ikiraro/sdk`;
const SNIPPET_ENV = `# .env
VITE_GROQ_API_KEY=gsk_...`;
const SNIPPET_QUICK_START = `import { useIkiraro } from "@/lib/ikiraro";
import { AvatarViewer } from "@ikiraro/sdk";
function App() {
  const { snapshot, translate, isReady } = useIkiraro();
  return (
    <>
      <AvatarViewer
        envelope={snapshot.lastEnvelope}
        modelUrl="/avatar.glb"
        className="w-full h-[400px]"
      />
      <input
        placeholder="Type to sign…"
        disabled={!isReady}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            translate(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />
    </>
  );
}`;
const SNIPPET_SUBPATHS = `// Main entry — hooks, components, types
import { useIkiraro, AvatarViewer } from "@ikiraro/sdk";
// Component subpath
import { AvatarViewer } from "@ikiraro/sdk/components";
// Engine primitives subpath
import { buildPlanFromGloss } from "@ikiraro/sdk/engine";`;
function SdkOverviewPage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="Ikiraro SDK"
        subtitle="A facade package that aggregates the runtime, rendering, and engine into a single versioned entry point. Install once, drop in the hook — text and speech translate to ASL automatically through a 3D avatar or your own canvas."
      />

      <section className="space-y-4">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.14em]">
          What's included
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              pkg: "@ikiraro/runtime",
              desc: "IkiraroRuntime, EventBus, 7 plugins, useIkiraro and useHandTracking React hooks, Groq AI services.",
            },
            {
              pkg: "@ikiraro/renderer",
              desc: "AvatarViewer (R3F), AudioVisualizer, AslHandSvg, Button, and other Tailwind UI components.",
            },
            {
              pkg: "@ikiraro/engine",
              desc: "Pure math, pose library, vision classifier, sign planners, RendererDirector. No React, no I/O.",
            },
          ].map(({ pkg, desc }) => (
            <div
              key={pkg}
              className="border border-border bg-card rounded-xl p-5 space-y-2 hover:border-border/80 transition-colors"
            >
              <code className="text-foreground font-mono text-[13px] font-semibold bg-secondary/50 px-2 py-1 rounded-md">
                {pkg}
              </code>
              <p className="text-muted-foreground text-[14px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* Installation */}
      <section className="space-y-4">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.14em]">
          Installation
        </p>
        <CodeBlock code={SNIPPET_INSTALL} label="terminal" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          You need a{" "}
          <a
            href="https://console.groq.com"
            className="text-foreground underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Groq API key
          </a>{" "}
          to power Whisper STT and Llama gloss generation. Add it to your environment:
        </p>
        <CodeBlock code={SNIPPET_ENV} label=".env" />
        <Callout>
          <strong className="text-foreground">No API key?</strong> The runtime falls back to{" "}
          <code className="font-mono text-foreground">DeterministicUnitsPlanner</code> —
          fingerspelling still works deterministically, but LLM gloss generation is disabled.
        </Callout>
      </section>
      {/* Quick Start */}
      <section className="space-y-4">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.14em]">
          Quick start
        </p>
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Call <code className="font-mono text-foreground">useIkiraro</code>, pass the envelope to{" "}
          <code className="font-mono text-foreground">AvatarViewer</code>, provide an input that
          calls <code className="font-mono text-foreground">translate</code>. The global client
          manages the full runtime lifecycle automatically using reference counting.
        </p>
        <CodeBlock code={SNIPPET_QUICK_START} label="App.tsx" />
      </section>
      {/* Subpaths */}
      <section className="space-y-4">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.14em]">
          Package subpaths
        </p>
        <CodeBlock code={SNIPPET_SUBPATHS} label="imports" />
      </section>
      {/* Next steps nav */}
      <section className="pt-4 border-t border-border">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.14em] mb-4">
          Next
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            {
              label: "useIkiraro hook",
              to: "/docs/hooks",
              desc: "Full API reference for the primary hook",
            },
            { label: "useHandTracking", to: "/docs/vision", desc: "Camera-based sign recognition" },
            {
              label: "UI Components",
              to: "/docs/components",
              desc: "AvatarViewer, AudioVisualizer, AslHandSvg",
            },
            {
              label: "Runtime API",
              to: "/docs/runtime",
              desc: "Direct runtime control and plugins",
            },
            {
              label: "Event Reference",
              to: "/docs/events",
              desc: "All 34 events in the EventBus registry",
            },
            { label: "Key Types", to: "/docs/types", desc: "TypeScript types and architecture" },
          ].map(({ label, to, desc }) => (
            <Link
              key={to}
              to={to}
              className="border border-border bg-card rounded-xl p-5 hover:bg-secondary/50 transition-colors group flex flex-col gap-1"
            >
              <p className="text-foreground text-[14px] font-semibold">{label}</p>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
