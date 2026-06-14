import { RiExternalLinkLine } from "@remixicon/react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PageLayout } from "@/components";
import { TextEffect } from "@/components/ui";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

const GITHUB_URL = "https://github.com/nkurunziza-saddy/ikiraro";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.23, 1, 0.32, 1] as any,
    },
  },
};

function DocsPage() {
  return (
    <PageLayout mainClassName="pt-24 md:pt-40">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-20 md:space-y-32"
      >
        {/* Section: Documentation */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8 items-start"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char">
              Documentation
            </TextEffect>
          </header>
          <div className="space-y-6">
            <TextEffect preset="fade-in-blur" per="word" delay={0.5}>
              The complete Ikiraro documentation is currently maintained within the repository. It
              covers everything required to integrate, configure, and extend the engine.
            </TextEffect>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 1,
                duration: 0.8,
                ease: [0.23, 1, 0.32, 1] as any,
              }}
              className="pt-6 flex flex-col sm:flex-row gap-6 font-medium text-[14px] tracking-tight"
            >
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground flex items-center gap-1.5 w-max border-b border-foreground/20 pb-0.5 hover:border-foreground/80 transition-colors"
              >
                Read Docs on GitHub <RiExternalLinkLine className="size-3.5" />
              </a>
            </motion.div>
          </div>
        </motion.section>

        {/* Section: What's Covered */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8 items-start"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char" delay={1.2}>
              Topics Covered
            </TextEffect>
          </header>
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
        </motion.section>

        {/* Section: Contributing */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8 items-start"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char" delay={2}>
              Contributing
            </TextEffect>
          </header>
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
        </motion.section>
      </motion.div>
    </PageLayout>
  );
}
