import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <article className="min-h-screen bg-background text-[15px] leading-[1.85] tracking-[-0.01em] antialiased text-muted-foreground font-light font-sans selection:bg-foreground selection:text-background flex flex-col">
      <main className="max-w-[900px] mx-auto px-4 md:px-6 pt-24 md:pt-40 pb-20 md:pb-40 flex-1 w-full">
        <div className="space-y-20 md:space-y-32">
          {/* Section: Introduction */}
          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8 items-start">
            <header className="font-medium text-foreground tracking-tight">Ikiraro Bridge</header>
            <div className="space-y-6">
              <p>
                Ikiraro is an open-source, client-side infrastructure designed to fluidly translate
                between sign language and spoken text. It moves the entire computational pipeline
                directly into the web browser.
              </p>
              <p>
                Instead of relying on rigid, pre-recorded videos or heavy server-side processing,
                the SDK provides a deterministic 3D engine, a robust linguistics compiler, and
                hardware-accelerated visual tracking—all executing natively within the user's
                sandbox.
              </p>
              <div className="pt-6 flex flex-col sm:flex-row gap-8 font-medium text-[14px] tracking-tight">
                <Link
                  to="/what"
                  className="text-foreground flex items-center gap-1.5 w-max border-b border-foreground/20 pb-0.5 hover:border-foreground/80 transition-colors"
                >
                  Read the Architecture Brief <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  to="/playground"
                  className="text-muted-foreground/70 hover:text-foreground transition-colors flex items-center gap-1.5 w-max pb-0.5"
                >
                  Open Playground
                </Link>
              </div>
            </div>
          </section>

          {/* Section: Capabilities */}
          <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8 items-start">
            <header className="font-medium text-foreground tracking-tight">Capabilities</header>
            <div className="space-y-6">
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  Acoustic & Text Translation.
                </strong>
                Ingests live speech or structured text and deterministically compiles it into fluent
                sign language geometry.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">Visual Inference.</strong>
                Processes webcam feeds using on-device machine learning to recognize and transcribe
                sign language back into text, completely preserving user privacy.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">Dynamic Kinematics.</strong>
                Generates smooth, biologically accurate motion at sixty frames per second using
                physics-based dual-spring interpolation, eschewing canned animations.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">Universal Access.</strong>
                Includes a built-in shortcut manager, priority text-to-speech queues, and spatial
                audio cues to ensure absolute accessibility across all input modalities.
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
            <Link to="/docs" className="hover:text-foreground transition-colors">
              Documentation
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
