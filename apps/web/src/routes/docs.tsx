import { RiExternalLinkLine } from "@remixicon/react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const GITHUB_URL = "https://github.com/nkurunziza-saddy/ikiraro";

function DocsPage() {
  return (
    <PageLayout mainClassName="pt-24 md:pt-40">
      <div className="space-y-20 md:space-y-32">
        {/* Section: Documentation */}
        <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8 items-start">
          <header className="font-medium text-foreground tracking-tight">Documentation</header>
          <div className="space-y-6">
            <p>
              The complete Ikiraro documentation is currently maintained within the repository. It
              covers everything required to integrate, configure, and extend the engine.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row gap-6 font-medium text-[14px] tracking-tight">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground flex items-center gap-1.5 w-max border-b border-foreground/20 pb-0.5 hover:border-foreground/80 transition-colors"
              >
                Read Docs on GitHub <RiExternalLinkLine className="size-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Section: What's Covered */}
        <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8 items-start">
          <header className="font-medium text-foreground tracking-tight">Topics Covered</header>
          <div className="space-y-6">
            <p>
              <strong className="font-medium text-foreground mr-2.5">Installation.</strong>
              Getting started with bun, npm, or pnpm. Includes framework-specific setup for React,
              Vue, and vanilla JavaScript environments.
            </p>
            <p>
              <strong className="font-medium text-foreground mr-2.5">Core Concepts.</strong>
              Detailed explanations of how gloss notation works, what coarticulation means in a
              computational context, and why the SDK separates linguistic planning from 3D
              rendering.
            </p>
            <p>
              <strong className="font-medium text-foreground mr-2.5">API Reference.</strong>
              Comprehensive typing and usage examples for{" "}
              <span className="font-mono text-[13px] text-foreground/80">useIkiraro</span>,{" "}
              <span className="font-mono text-[13px] text-foreground/80">AvatarViewer</span>,{" "}
              <span className="font-mono text-[13px] text-foreground/80">useHandTracking</span>, and
              the <span className="font-mono text-[13px] text-foreground/80">AudioQueue</span>.
            </p>
            <p>
              <strong className="font-medium text-foreground mr-2.5">Plugin Development.</strong>
              Instructions for extending the runtime with custom input channels, specialized output
              adapters, or novel accessibility overlays.
            </p>
            <p>
              <strong className="font-medium text-foreground mr-2.5">
                Architecture Deep-Dive.
              </strong>
              Mathematical breakdowns of Procrustes alignment, dual-spring physics, and
              LinguisticBuffer internals. Intended for contributors and technical researchers.
            </p>
          </div>
        </section>

        {/* Section: Contributing */}
        <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8 items-start">
          <header className="font-medium text-foreground tracking-tight">Contributing</header>
          <div className="space-y-6">
            <p>
              Ikiraro is open-source under the MIT License. Issues, pull requests, and architectural
              discussions are strongly encouraged.
            </p>
            <p>
              The repository includes a dedicated contributing guide outlining local development
              setup, testing requirements, and a high-level architecture overview designed
              specifically to onboard new contributors quickly.
            </p>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
