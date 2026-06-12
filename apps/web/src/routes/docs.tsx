import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const GITHUB_URL = "https://github.com/nkurunziza-saddy/ikiraro";

const DOC_SECTIONS = [
  {
    title: "Installation",
    desc: "Getting started with bun, npm, or pnpm. Includes framework-specific setup for React, Vue, and vanilla JS.",
  },
  {
    title: "Core concepts",
    desc: "How gloss notation works, what coarticulation means, and why the SDK separates planning from rendering.",
  },
  {
    title: "API reference",
    desc: "useIkiraro, AvatarViewer, useHandTracking, AudioQueue — every hook, component, and export documented.",
  },
  {
    title: "Plugin development",
    desc: "Extending the runtime with custom input channels, output adapters, or accessibility overlays.",
  },
  {
    title: "Architecture deep-dive",
    desc: "Procrustes alignment, spring physics, LinguisticBuffer internals — for contributors and the curious.",
  },
];

function DocsPage() {
  return (
    <div className="min-h-screen px-8 pt-12 pb-28 bg-background text-foreground font-sans">
      <div className="max-w-[440px] mx-auto">
        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            Documentation
          </p>
          <h1 className="text-[20px] font-medium tracking-[-0.03em] mb-4">
            Full docs live on GitHub.
          </h1>
          <p className="text-[14px] font-light leading-[1.8] text-secondary">
            The Ikiraro monorepo README covers installation, architecture, API reference, and plugin
            development — all in one place while the dedicated docs site is being built.
          </p>
        </section>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-card border border-border rounded-[10px] px-4 py-3 mb-14 hover:border-muted-foreground/50 transition-all duration-[180ms] group"
        >
          <span className="text-[13px] font-normal text-secondary">
            github.com/nkurunziza-saddy/ikiraro
          </span>
          <ExternalLink className="size-[14px] text-muted-foreground group-hover:text-foreground transition-colors duration-[180ms] shrink-0" />
        </a>

        <Separator className="my-14" />

        <section className="mb-14">
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            What's covered
          </p>
          <div className="space-y-px rounded-[16px] overflow-hidden border border-border">
            {DOC_SECTIONS.map(({ title, desc }) => (
              <div
                key={title}
                className="bg-card px-4 py-3.5 border-b border-border last:border-none"
              >
                <p className="text-[13px] font-medium text-foreground mb-0.5">{title}</p>
                <p className="text-[12.5px] font-light text-muted-foreground leading-[1.65]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-14" />

        <section>
          <p className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase mb-5">
            Contributing
          </p>
          <p className="text-[14px] font-light leading-[1.8] text-secondary">
            Ikiraro is open-source under MIT. Issues, pull requests, and discussion are all welcome.
            The{" "}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors duration-[180ms]"
            >
              repository
            </a>{" "}
            includes a CONTRIBUTING guide with local setup instructions and an architecture overview
            for new contributors.
          </p>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
