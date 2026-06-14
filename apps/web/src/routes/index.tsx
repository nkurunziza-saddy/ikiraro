import { RiArrowRightLine } from "@remixicon/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "@/components";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout mainClassName="pt-24 md:pt-40">
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
              Instead of relying on rigid, pre-recorded videos or heavy server-side processing, the
              SDK provides a deterministic 3D engine, a robust linguistics compiler, and
              hardware-accelerated visual tracking—all executing natively within the user's sandbox.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row gap-8 font-medium text-[14px] tracking-tight">
              <Link
                to="/what"
                className="text-foreground flex items-center gap-1.5 w-max border-b border-foreground/20 pb-0.5 hover:border-foreground/80 transition-colors"
              >
                Read the Architecture Brief <RiArrowRightLine className="size-3.5" />
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
    </PageLayout>
  );
}
