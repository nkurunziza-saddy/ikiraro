import { createFileRoute } from "@tanstack/react-router";
import {
  CodeBlock,
  PageTitle,
  SectionHead,
  RefTable,
  RefTableHead,
  RefRow,
} from "@/components/docs/primitives";
export const Route = createFileRoute("/docs/types")({
  component: TypesPage,
});
const SNIPPET_IMPORTS = `// All types are available from the SDK entry point:
import type {
  TranslationEnvelope,
  SignPlan,
  SignToken,
  IkiraroToken,
  CommunicationMode,
  SttModel,
  TranslationContext,
  RuntimeSnapshot,
  IkiraroPlugin,
  PluginContext,
  EventRegistry,
  IkiraroEvent,
} from "@ikiraro/sdk";
// Engine types also importable directly (for custom renderers):
import type { FrameItem, ArmTarget, MotionType } from "@ikiraro/engine/types";`;
const SNIPPET_ENVELOPE = `type TranslationEnvelope = {
  mode: "speech" | "text" | "sign-keys" | "camera-fingerspell";
  intake: SpeechIntake | null;  // null for text and sign-keys mode
  plan: SignPlan;               // the full signing plan
  rendererQueue: FrameItem[];   // pre-computed frame sequence for the avatar
  rawInput: string;             // original text or units string
  normalizedText: string;       // cleaned / lowercased version
  intent?: SemanticIntent;      // LLM output — only present for text/speech mode
};`;
const SNIPPET_SIGN_PLAN = `type SignPlan = {
  sourceText: string;     // the input that generated this plan
  normalizedText: string; // cleaned version
  glossText: string;      // space-separated ASL gloss, e.g. "HELLO YOU HOW"
  track: "semantic" | "deterministic";
  strategy: "semantic" | "deterministic";
  clauses: SignClause[];
  metadata: {
    confidence: number;   // 0–1, from LLM or 1.0 for deterministic
    reviewNeeded: boolean;
    notes: string[];
  };
};`;
const SNIPPET_FRAME_ITEM = `// FrameItem — one unit in the avatar's animation queue
type FrameItem = {
  type: "lexeme" | "fingerspell" | "number" | "pause" | "pointing";
  value: string;           // pose library key or character
  label: string;           // display label (the ASL gloss word)
  sublabel?: string;       // e.g. the fingerspelled letters
  duration: number;        // ms this frame plays for
  motion?: MotionType;     // optional motion path (arc, shake, circle, etc.)
  armTarget?: ArmTarget;   // optional per-sign arm position override
  facialExpression?: string;
  coarticulation?: "blend" | "snap" | "none";
};`;
const SNIPPET_SIGN_TOKEN = `// SignToken — the discriminated union of gloss token types
// produced by the planner before expansion into FrameItems:
type LexemeToken     = { type: "lexeme";      lexemeId: string;  durationMs: number; ... }
type FingerspellToken= { type: "fingerspell"; text: string;      durationMs: number; ... }
type NumberToken     = { type: "number";      value: string;     durationMs: number; ... }
type PointingToken   = { type: "pointing";    target: string;    durationMs: number; ... }
type PauseToken      = { type: "pause";       durationMs: number }
type SignToken = LexemeToken | FingerspellToken | NumberToken | PointingToken | PauseToken;
// All non-pause tokens share BaseToken fields:
type BaseToken = {
  durationMs: number;
  emphasis: "low" | "normal" | "high";
  facialExpression?: "neutral" | "inquisitive" | "assertive" | "urgent" | "empathetic";
  coarticulationHint?: "blend" | "snap" | "none";
};`;
const SNIPPET_IKIRARO_TOKEN = `// IkiraroToken — the unified domain object for all conversational input.
// Produced by vision, keyboard, and speech input adapters.
type IkiraroToken = {
  id: string;
  value: string;
  type: "sign" | "speech" | "text" | "control";
  source: string;           // which plugin produced it ("vision", "keyboard", etc.)
  timestamp: number;
  confidence: number;       // 0–1
  stability: "draft" | "stable" | "committed";
  correlationId?: string;   // links a draft and its committed version
  metadata?: Record<string, unknown>;
};`;
const SNIPPET_RUNTIME_SNAPSHOT = `// RuntimeSnapshot — returned by useIkiraro().snapshot and runtime.snapshot()
interface RuntimeSnapshot {
  // Session lifecycle phase (distinct from internal runtime lifecycle)
  status: "idle" | "recording" | "translating" | "finished" | "error";
  isTranslating: boolean;
  lastEnvelope: TranslationEnvelope | null;
  compositionTokens: IkiraroToken[];
  compositionText: string;
  speechStatus: "idle" | "capturing" | "processing" | "error";
  speechLevel: number;  // 0–1 normalized mic amplitude
  error: string | null;
}`;
const SNIPPET_PLUGIN_TYPE = `import type { IkiraroPlugin, PluginContext, IkiraroEvent } from "@ikiraro/sdk";
interface MyState { count: number }
class CounterPlugin implements IkiraroPlugin<MyState> {
  name = "counter";
  initialState: MyState = { count: 0 };
  setup(ctx: PluginContext<MyState>) {
    ctx.subscribe("translation:finished", () => {
      // ctx.getPluginState() returns MyState (typed to S)
      const current = ctx.getPluginState();
      ctx.emit({
        type: "input:unit",
        payload: { unit: String(current.count), confidence: 1, type: "counter" },
        timestamp: Date.now(),
        source: this.name,
      });
    });
    return () => { /* cleanup */ };
  }
  reducer(state: MyState, event: IkiraroEvent): MyState {
    if (event.type === "translation:finished") {
      return { count: state.count + 1 };
    }
    return state;
  }
}`;
function TypesPage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="Key Types"
        subtitle="All types are exported from @ikiraro/sdk. They're also importable from @ikiraro/engine/types and @ikiraro/runtime for advanced use cases."
      />

      <section className="space-y-4">
        <SectionHead id="imports" label="Importing types" />
        <CodeBlock code={SNIPPET_IMPORTS} label="type imports" />
      </section>

      <section className="space-y-4">
        <SectionHead id="translation-envelope" label="TranslationEnvelope" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The top-level output of every translation. Returned by{" "}
          <code className="font-mono text-foreground">onTranslated</code>, stored in{" "}
          <code className="font-mono text-foreground">snapshot.lastEnvelope</code>, and passed to{" "}
          <code className="font-mono text-foreground">AvatarViewer</code>. Contains both the
          semantic plan and the pre-computed renderer queue.
        </p>
        <CodeBlock code={SNIPPET_ENVELOPE} label="TranslationEnvelope" />
        <RefTable>
          <RefTableHead cols={["Field", "Type", "Description"]} />
          <RefRow
            name="mode"
            type="CommunicationMode"
            desc="Which input path produced this envelope: text, speech, sign-keys, or camera-fingerspell."
          />
          <RefRow
            name="intake"
            type="SpeechIntake | null"
            desc="STT metadata — word timings, language, duration. Only present for speech mode."
          />
          <RefRow
            name="plan"
            type="SignPlan"
            desc="The full signing plan with gloss, clauses, and confidence metadata."
          />
          <RefRow
            name="rendererQueue"
            type="FrameItem[]"
            desc="Pre-computed animation frames — pass the entire envelope to AvatarViewer, which reads this."
          />
          <RefRow name="rawInput" type="string" desc="Original text or joined units string." />
          <RefRow
            name="normalizedText"
            type="string"
            desc="Cleaned version — lowercased, punctuation removed."
          />
          <RefRow
            name="intent"
            type="SemanticIntent?"
            desc="LLM output: rawGloss, glossTokens, confidence, model. Undefined for deterministic mode."
          />
        </RefTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="sign-plan" label="SignPlan" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The intermediate representation between the planner and the renderer. Both{" "}
          <code className="font-mono text-foreground">DeterministicUnitsPlanner</code> and{" "}
          <code className="font-mono text-foreground">GroqSemanticPlanner</code> produce a SignPlan.
        </p>
        <CodeBlock code={SNIPPET_SIGN_PLAN} label="SignPlan" />
      </section>

      <section className="space-y-4">
        <SectionHead id="frame-item" label="FrameItem" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          A single animation primitive in the renderer queue. The RendererDirector drains{" "}
          <code className="font-mono text-foreground">rendererQueue</code> frame by frame, blending
          handshapes using the coarticulation hint.
        </p>
        <CodeBlock code={SNIPPET_FRAME_ITEM} label="FrameItem" />
        <RefTable>
          <RefTableHead cols={["Coarticulation", "Description"]} />
          <RefRow
            name="blend"
            desc="Smooth interpolation between the previous pose and this one. Default for lexeme transitions."
          />
          <RefRow
            name="snap"
            desc="Immediate cut — no interpolation. Used between fingerspelled letters to prevent smearing."
          />
          <RefRow name="none" desc="Hold the previous pose until the frame ends, then cut." />
        </RefTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="sign-token" label="SignToken" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Gloss tokens produced by the planner — the IR between gloss text and FrameItems. You'll
          encounter these in <code className="font-mono text-foreground">SignPlan.clauses</code>.
        </p>
        <CodeBlock code={SNIPPET_SIGN_TOKEN} label="SignToken variants" />
      </section>
      {/* IkiraroToken */}
      <section className="space-y-4">
        <SectionHead id="ikiraro-token" label="IkiraroToken" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The unified input token — produced by vision, keyboard, and speech adapters, and stored in{" "}
          <code className="font-mono text-foreground">snapshot.compositionTokens</code>. Distinct
          from SignToken: IkiraroToken tracks input provenance; SignToken tracks signing intent.
        </p>
        <CodeBlock code={SNIPPET_IKIRARO_TOKEN} label="IkiraroToken" />
      </section>
      {/* RuntimeSnapshot */}
      <section className="space-y-4">
        <SectionHead id="runtime-snapshot" label="RuntimeSnapshot" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The full shape of the object returned by{" "}
          <code className="font-mono text-foreground">snapshot</code> from{" "}
          <code className="font-mono text-foreground">useIkiraro</code> and{" "}
          <code className="font-mono text-foreground">runtime.snapshot()</code>.
        </p>
        <CodeBlock code={SNIPPET_RUNTIME_SNAPSHOT} label="RuntimeSnapshot" />
      </section>
      {/* IkiraroPlugin */}
      <section className="space-y-4">
        <SectionHead id="ikiraro-plugin" label="IkiraroPlugin" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The plugin interface. Generic over state type{" "}
          <code className="font-mono text-foreground">S</code> — omit it for stateless plugins.
          Teardown is handled by returning a disposer from{" "}
          <code className="font-mono text-foreground">setup</code>, not via a separate method.
        </p>
        <CodeBlock code={SNIPPET_PLUGIN_TYPE} label="IkiraroPlugin<S>" />
      </section>
      {/* Architecture */}
      <section className="space-y-6">
        <SectionHead id="architecture" label="Package architecture" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The SDK is a curated facade — it re-exports stable surfaces from three internal packages
          under a single versioned entry point.
        </p>
        <div className="relative pl-4 border-l-2 border-border space-y-0">
          {[
            {
              pkg: "@ikiraro/sdk",
              role: "Public facade",
              desc: "Curated re-exports: React hooks, components, core types, and plugin authoring API. Has no logic of its own. This is what you install.",
            },
            {
              pkg: "@ikiraro/runtime",
              role: "Runtime & bindings",
              desc: "IkiraroRuntime, EventBus, default plugins (Session, Composition, Translation, Speech), createIkiraroClient factory, useHandTracking React hook, Groq AI services.",
            },
            {
              pkg: "@ikiraro/renderer",
              role: "UI library",
              desc: "AvatarViewer (R3F), AudioVisualizer, AslHandSvg, HandOverlay, WebSpeechProvider. Depends on @ikiraro/engine for types.",
            },
            {
              pkg: "@ikiraro/engine",
              role: "Core — no deps",
              desc: "Pure math, ASL pose library, vision classifier, sign planners, RendererDirector. No React, no I/O, no network. Zero dependencies. Framework adapters import from here.",
            },
          ].map(({ pkg, role, desc }) => (
            <div key={pkg} className="relative pb-6">
              <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-border border-2 border-background" />
              <div className="pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-foreground font-mono text-[12px] font-semibold">{pkg}</code>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-[0.1em]">
                    {role}
                  </span>
                </div>
                <p className="text-muted-foreground text-[12px] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Design principles
          </p>
          <ul className="space-y-2 text-[12px] text-muted-foreground">
            {[
              "Local-first — the engine runs entirely in the browser. Groq is an optional enhancement, not a hard dependency.",
              "Deterministic by default — translateUnits() produces the same frame sequence for the same input every time. LLM variance is opt-in via translate().",
              "Effect-based I/O — Groq STT and LLM calls are wrapped in typed Effect layers for composable error handling.",
              "Plugin architecture — every capability is a plugin. The runtime is an EventBus plus a reducer pipeline. Add, remove, or override plugins via createIkiraro({ plugins: [] }).",
              "Curated public API — internals (EventBus, planners, worker processor) are not exported. Only the stable surface is versioned.",
            ].map((p) => (
              <li key={p} className="flex gap-2 leading-relaxed">
                <span className="text-foreground shrink-0">—</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
