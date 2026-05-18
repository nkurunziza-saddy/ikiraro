import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  SignPlayer3D,
  buildPlanFromUnits,
  createEnvelope,
  RendererDirector,
  REST_POSE,
} from "@ikiraro/sdk";
import type { TranslationEnvelope } from "@ikiraro/sdk";
import { Badge } from "@ikiraro/components/ui/badge";
import { Input } from "@ikiraro/components/ui/input";
import { Button } from "@ikiraro/components/ui/button";

export const Route = createFileRoute("/sdk-test")({
  component: SdkTestPage,
});

// ─── Pre-built demo envelopes ────────────────────────────────────────────────
function buildDemoEnvelope(units: string[]): TranslationEnvelope {
  return createEnvelope(buildPlanFromUnits(units), {
    mode: "text",
    rawInput: units.join(" "),
  });
}

const DEMOS: { label: string; units: string[] }[] = [
  { label: "Hello", units: ["HELLO"] },
  { label: "Thank you", units: ["THANK", "YOU"] },
  { label: "A–Z", units: ["A", "B", "C", "D", "E", "F", "G", "H", "I"] },
  { label: "Numbers", units: ["1", "2", "3", "4", "5"] },
];

function SdkTestPage() {
  const [activeEnvelope, setActiveEnvelope] = useState<TranslationEnvelope | null>(() =>
    buildDemoEnvelope(DEMOS[0]!.units),
  );
  const [customInput, setCustomInput] = useState("");
  const [activeDemo, setActiveDemo] = useState(0);

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customInput.trim().toUpperCase();
    if (!trimmed) return;
    const units = trimmed.split(/\s+/);
    setActiveEnvelope(buildDemoEnvelope(units));
    setActiveDemo(-1);
  }

  function handleDemo(idx: number) {
    setActiveDemo(idx);
    setActiveEnvelope(buildDemoEnvelope(DEMOS[idx]!.units));
  }

  // Confirm RendererDirector and REST_POSE are accessible from the SDK
  const _sanity = useMemo(() => ({ RendererDirector, REST_POSE }), []);
  void _sanity;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest">
            SDK Test
          </Badge>
          <code className="text-[10px] text-muted-foreground/50">@ikiraro/sdk v0.1.0</code>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">SDK integration test</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground/60">
          This page imports exclusively from{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">@ikiraro/sdk</code>. It
          exercises the deterministic translation pipeline — no API key required.
        </p>
      </div>

      {/* Quickfire demo buttons */}
      <div className="flex flex-col gap-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Demo presets
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMOS.map((d, i) => (
            <Button
              key={d.label}
              variant={activeDemo === i ? "default" : "outline"}
              size="sm"
              className="text-[11px] font-bold uppercase tracking-widest"
              onClick={() => handleDemo(i)}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom input */}
      <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Custom gloss (space-separated tokens, e.g.{" "}
          <span className="text-foreground/70">HELLO WORLD</span>)
        </p>
        <div className="flex gap-3">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="HELLO WORLD"
            className="max-w-sm font-mono text-sm uppercase"
          />
          <Button type="submit" className="font-bold uppercase tracking-widest text-[11px]">
            Play
          </Button>
        </div>
      </form>

      {/* Player */}
      <div className="flex flex-col gap-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Renderer output
        </p>
        <SignPlayer3D envelope={activeEnvelope} />
      </div>

      {/* API surface callout */}
      <div className="rounded-xl border bg-muted/20 p-6">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Imports used on this page
        </p>
        <pre className="overflow-x-auto text-[12px] leading-relaxed text-muted-foreground/80">{`import {
  SignPlayer3D,          // @ikiraro/sdk (components)
  buildPlanFromUnits,   // @ikiraro/sdk (engine/planning)
  createEnvelope,       // @ikiraro/sdk (engine/planning)
  RendererDirector,     // @ikiraro/sdk (engine/planning)
  REST_POSE,            // @ikiraro/sdk (engine/planning)
} from "@ikiraro/sdk"`}</pre>
      </div>
    </div>
  );
}
