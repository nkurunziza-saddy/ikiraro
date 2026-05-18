import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@sensa/components";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 py-20 lg:py-32">
      {/* Minimal Hero */}
      <section className="relative">
        <div className="flex flex-col gap-10">
          <div className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Operational Intelligence
          </div>
          <div className="space-y-6">
            <h1 className="max-w-5xl text-6xl font-bold tracking-tighter text-balance sm:text-7xl lg:text-8xl">
              Precision tools for spoken & sign systems.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground/70">
              Sensa combines speech capture, vision-based tracking, and translation history in a
              unified working surface built for operational clarity.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 pt-6">
            <Link to="/dashboard">
              <Button
                size="lg"
                className="min-w-48 font-bold uppercase tracking-widest rounded-md shadow-sm"
              >
                Launch Console
              </Button>
            </Link>
            <Link to="/sdk-test">
              <Button
                size="lg"
                variant="outline"
                className="min-w-48 font-bold uppercase tracking-widest rounded-md"
              >
                SDK Test
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Understated Features */}
      <section className="grid gap-16 lg:grid-cols-3 border-t border-border/30 pt-20">
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">
            Unified
          </p>
          <h3 className="text-xl font-bold tracking-tight">Timeline Management</h3>
          <p className="text-sm leading-relaxed text-muted-foreground/60">
            Compare intent, plan, and playback without context switching. Optimized for accuracy and
            flow verification.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">
            Precise
          </p>
          <h3 className="text-xl font-bold tracking-tight">Deterministic Output</h3>
          <p className="text-sm leading-relaxed text-muted-foreground/60">
            Manual sequences stay local and easy to verify, making it a good fit for demos, QA, and
            high-precision tasks.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">
            Focused
          </p>
          <h3 className="text-xl font-bold tracking-tight">Operational Design</h3>
          <p className="text-sm leading-relaxed text-muted-foreground/60">
            The interface is tuned to feel like a tool, not a demo, keeping focus on accuracy and
            procedural efficiency.
          </p>
        </div>
      </section>
    </div>
  );
}
