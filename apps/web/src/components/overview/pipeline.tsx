"use client";
import { useRef, useState } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beam";

function AudioIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="9" y="2" width="6" height="10" rx="3" fill="currentColor" fillOpacity="0.1" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function VisionIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="5" width="18" height="14" rx="0" fill="currentColor" fillOpacity="0.1" />
      <circle cx="12" cy="12" r="3" />
      <line x1="3" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polyline points="4 7 10 12 4 17" />
      <line x1="12" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function EngineIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <rect x="4" y="4" width="16" height="16" rx="0" fill="currentColor" fillOpacity="0.05" />
      <rect x="8" y="8" width="8" height="8" rx="0" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function OutputIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M2 12C2 12 7 5 12 5C17 5 22 12 22 12C22 12 17 19 12 19C7 19 2 12 2 12Z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function OverviewPipeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);

  const [activeNode, setActiveNode] = useState<number | null>(null);

  const stages = [
    {
      stage: "01",
      title: "Multimodal Normalization",
      desc: "All inputs are converted into a standardized tensor format before routing.",
    },
    {
      stage: "02",
      title: "Kinematic Semantic Parsing",
      desc: "The core engine resolves intent and maps it to the 3D bone hierarchy.",
    },
  ];

  return (
    <section className="relative w-full bg-background py-24 md:py-32 border-b border-border">
      <div className="bento-container grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 relative z-10">
        <div className="lg:col-span-6">
          <h2 className="text-title mb-6">Unified Synthesis Pipeline.</h2>
          <p className="text-subhero mb-12 max-w-[500px]">
            Raw audio, text feeds, and vision matrices are collected simultaneously and compiled
            into a unified joint stream.
          </p>

          <div className="grid grid-cols-1 bento-grid overflow-hidden">
            {stages.map((s, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 p-10 bento-cell bento-cell-hover cursor-crosshair relative group"
              >
                <div className="text-[18px] font-semibold text-foreground uppercase tracking-tight">
                  {s.title}
                </div>
                <p className="text-[15px] text-secondary-foreground mt-2 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-6">
          <div
            ref={containerRef}
            className="relative w-full aspect-square md:aspect-auto md:h-[650px] flex items-center justify-center border border-border bg-card/30 overflow-hidden shadow-inner"
          >
            <div className="absolute inset-0 blueprint-grid opacity-[0.08]"></div>

            {/* Source Nodes */}
            <div className="flex flex-col gap-20 z-20 mr-auto ml-12 lg:ml-20">
              {[
                { ref: div1Ref, id: 1, icon: <AudioIcon />, label: "Audio.Stream" },
                { ref: div2Ref, id: 2, icon: <VisionIcon />, label: "Vision.Matrix" },
                { ref: div3Ref, id: 3, icon: <TextIcon />, label: "Text.Input" },
              ].map((node) => (
                <div
                  key={node.id}
                  ref={node.ref}
                  onMouseEnter={() => setActiveNode(node.id)}
                  onMouseLeave={() => setActiveNode(null)}
                  className="w-16 h-16 border bg-background flex items-center justify-center relative cursor-crosshair transition-all duration-300 group shadow-sm hover:shadow-primary/20"
                  style={{
                    borderColor: activeNode === node.id ? "var(--primary)" : "var(--border)",
                  }}
                >
                  <div
                    className="transition-colors duration-300 relative z-10"
                    style={{
                      color: activeNode === node.id ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    {node.icon}
                  </div>
                  <span className="absolute -left-36 w-32 text-right text-[9px] font-mono uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">
                    {node.label}
                  </span>
                </div>
              ))}
            </div>

            {/* The Central Engine - Standing Still as requested */}
            <div
              ref={div4Ref}
              onMouseEnter={() => setActiveNode(4)}
              onMouseLeave={() => setActiveNode(null)}
              className="z-20 w-48 h-48 border bg-background flex flex-col items-center justify-center gap-6 relative cursor-crosshair transition-all duration-300 group shadow-2xl"
              style={{ borderColor: activeNode === 4 ? "var(--primary)" : "var(--border)" }}
            >
              <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-center">
                {/* HUD Decoration around icon */}
                <div className="absolute size-24 border border-border border-dashed rounded-full opacity-20"></div>
                <div
                  className="transition-colors duration-300 relative z-10"
                  style={{ color: activeNode === 4 ? "var(--primary)" : "var(--muted-foreground)" }}
                >
                  <EngineIcon />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold text-foreground">
                  Inference.Core
                </span>
                <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                  Proc.Active
                </span>
              </div>
              {/* HUD Brackets */}
              <div className="absolute inset-2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-0 left-0 size-2 border-t border-l border-primary"></div>
                <div className="absolute top-0 right-0 size-2 border-t border-r border-primary"></div>
                <div className="absolute bottom-0 left-0 size-2 border-b border-l border-primary"></div>
                <div className="absolute bottom-0 right-0 size-2 border-b border-r border-primary"></div>
              </div>
            </div>

            {/* Output Node */}
            <div
              ref={div5Ref}
              onMouseEnter={() => setActiveNode(5)}
              onMouseLeave={() => setActiveNode(null)}
              className="z-20 w-32 h-32 border bg-background ml-auto mr-12 lg:mr-20 flex flex-col items-center justify-center relative cursor-crosshair transition-all duration-300 group shadow-lg"
              style={{ borderColor: activeNode === 5 ? "var(--primary)" : "var(--border)" }}
            >
              <div
                className="transition-colors duration-300 mb-4 relative z-10"
                style={{ color: activeNode === 5 ? "var(--primary)" : "var(--muted-foreground)" }}
              >
                <OutputIcon />
              </div>
              <span className="absolute -right-36 w-32 text-left text-[9px] font-mono uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">
                Render.Output
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                Kinematic.Stream
              </span>
            </div>

            {/* Animated Beams */}
            {[div1Ref, div2Ref, div3Ref].map((ref, i) => (
              <AnimatedBeam
                key={i}
                containerRef={containerRef}
                fromRef={ref}
                toRef={div4Ref}
                curvature={i === 0 ? -40 : i === 2 ? 40 : 0}
                pathWidth={1.5}
                pathColor="var(--primary)"
                pathOpacity={activeNode === i + 1 || activeNode === 4 ? 0.6 : 0.1}
                gradientStartColor="var(--background)"
                gradientStopColor="var(--primary)"
                duration={3}
                delay={i * 0.5}
              />
            ))}

            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div4Ref}
              toRef={div5Ref}
              pathWidth={2}
              pathColor="var(--primary)"
              pathOpacity={activeNode === 5 || activeNode === 4 ? 0.8 : 0.2}
              gradientStartColor="var(--primary)"
              gradientStopColor="var(--background)"
              duration={2}
              delay={0}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
