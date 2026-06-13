import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const GITHUB_URL = "https://github.com/nkurunziza-saddy/ikiraro";

function DocsPage() {
  return (
    <article className="min-h-screen bg-background text-[15px] leading-[1.85] tracking-[-0.01em] antialiased text-muted-foreground font-light font-sans selection:bg-foreground selection:text-background flex flex-col">
      <main className="max-w-[900px] mx-auto px-4 md:px-6 pt-24 md:pt-40 pb-20 md:pb-40 flex-1 w-full">
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
                  Read Docs on GitHub <ExternalLink className="size-3.5" />
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
                <span className="font-mono text-[13px] text-foreground/80">useHandTracking</span>,
                and the <span className="font-mono text-[13px] text-foreground/80">AudioQueue</span>
                .
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">Plugin Development.</strong>
                Instructions for extending the runtime with custom input channels, specialized
                output adapters, or novel accessibility overlays.
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
                Ikiraro is open-source under the MIT License. Issues, pull requests, and
                architectural discussions are strongly encouraged.
              </p>
              <p>
                The repository includes a dedicated contributing guide outlining local development
                setup, testing requirements, and a high-level architecture overview designed
                specifically to onboard new contributors quickly.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="max-w-[900px] mx-auto px-4 md:px-6 pb-24 pt-12 w-full mt-8 md:mt-12 border-t border-border/20">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-4 md:gap-y-8 text-[13px]">
          <div className="flex flex-col gap-1.5">
            <Link
              to="/"
              className="font-medium text-foreground hover:opacity-70 transition-opacity tracking-tight"
            >
              Ikiraro Bridge
            </Link>
            <span className="text-muted-foreground/50 font-light">Built for the web.</span>
          </div>
          <nav className="flex flex-wrap gap-8 font-medium text-muted-foreground/70 items-start pt-0.5">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/what" className="hover:text-foreground transition-colors">
              Manifesto
            </Link>
            <a
              href="https://github.com/nkurunziza-saddy/ikiraro"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Source Code
            </a>
          </nav>
        </div>
      </footer>
    </article>
  );
}
