"use client";
import { useRef, useState } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
const AudioColor = "hsla(24, 75%, 60%, 1)";
const VisionColor = "hsla(158, 55%, 55%, 1)";
const TextColor = "hsla(199, 75%, 60%, 1)";
const EngineColor = "hsla(263, 60%, 65%, 1)";
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
      <line x1="8" y1="22" x2="16" y2="22" />
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
      <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
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
      <rect x="2" y="3" width="20" height="18" rx="2" fill="currentColor" fillOpacity="0.05" />
    </svg>
  );
}
function EngineIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
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
      width="24"
      height="24"
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
  const getBeamOpacity = (nodeId: number) => {
    if (activeNode === null) return 0.25;
    return activeNode === nodeId || activeNode === 4 || activeNode === 5 ? 0.8 : 0.05;
  };
  const getBeamColor = (nodeId: number, defaultColor: string) => {
    if (activeNode === null) return "rgba(255,255,255,0.15)";
    return activeNode === nodeId || activeNode === 4 || activeNode === 5
      ? defaultColor
      : "rgba(255,255,255,0.05)";
  };
  return (
    <section className="relative w-full bg-background py-[120px] md:py-[200px] border-b border-border">
      <div className="bento-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24 relative z-10">
        <div className="md:col-span-5 md:col-start-2">
          <h2 className="text-title mb-6">Unified Synthesis Pipeline.</h2>
          <p className="text-subhero mb-12">
            Raw audio, text feeds, and vision matrices are collected simultaneously, parsed by our
            lightweight inference network, and compiled into a unified joint stream.
          </p>
          <div className="grid grid-cols-1 bento-grid">
            {[
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
            ].map((s, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 p-8 bento-cell bento-cell-hover cursor-pointer relative group"
              >
                <div className="text-[10px] font-mono text-secondary-foreground font-bold uppercase tracking-widest group-hover:text-foreground transition-colors duration-300">
                  Stage {s.stage}
                </div>
                <div className="text-[16px] font-semibold text-foreground">{s.title}</div>
                <p className="text-[14px] text-secondary-foreground mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-6">
          <div
            ref={containerRef}
            className="relative w-full aspect-square md:aspect-auto md:h-[650px] flex items-center justify-center border border-border bg-background overflow-hidden"
          >
            <div className="absolute inset-0 blueprint-grid opacity-[0.2]"></div>

            <div className="flex flex-col gap-16 z-20 mr-auto ml-16 lg:ml-24">
              <div
                ref={div1Ref}
                onMouseEnter={() => setActiveNode(1)}
                onMouseLeave={() => setActiveNode(null)}
                className="w-14 h-14 border bg-card flex items-center justify-center relative cursor-pointer transition-colors duration-300 group"
                style={{ borderColor: activeNode === 1 ? AudioColor : "var(--bento-border)" }}
              >
                <div
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ backgroundColor: AudioColor, opacity: activeNode === 1 ? 0.1 : 0 }}
                />
                <div
                  style={{ color: activeNode === 1 ? AudioColor : "var(--muted-foreground)" }}
                  className="transition-colors duration-300 relative z-10"
                >
                  <AudioIcon />
                </div>
                <span
                  className="absolute -left-28 w-24 text-right text-[10px] font-mono uppercase tracking-wider transition-colors duration-300"
                  style={{
                    color: activeNode === 1 ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  Audio Feed
                </span>
              </div>

              <div
                ref={div2Ref}
                onMouseEnter={() => setActiveNode(2)}
                onMouseLeave={() => setActiveNode(null)}
                className="w-14 h-14 border bg-card flex items-center justify-center relative cursor-pointer transition-colors duration-300 group"
                style={{ borderColor: activeNode === 2 ? VisionColor : "var(--bento-border)" }}
              >
                <div
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ backgroundColor: VisionColor, opacity: activeNode === 2 ? 0.1 : 0 }}
                />
                <div
                  style={{ color: activeNode === 2 ? VisionColor : "var(--muted-foreground)" }}
                  className="transition-colors duration-300 relative z-10"
                >
                  <VisionIcon />
                </div>
                <span
                  className="absolute -left-28 w-24 text-right text-[10px] font-mono uppercase tracking-wider transition-colors duration-300"
                  style={{
                    color: activeNode === 2 ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  Vision Feed
                </span>
              </div>

              <div
                ref={div3Ref}
                onMouseEnter={() => setActiveNode(3)}
                onMouseLeave={() => setActiveNode(null)}
                className="w-14 h-14 border bg-card flex items-center justify-center relative cursor-pointer transition-colors duration-300 group"
                style={{ borderColor: activeNode === 3 ? TextColor : "var(--bento-border)" }}
              >
                <div
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ backgroundColor: TextColor, opacity: activeNode === 3 ? 0.1 : 0 }}
                />
                <div
                  style={{ color: activeNode === 3 ? TextColor : "var(--muted-foreground)" }}
                  className="transition-colors duration-300 relative z-10"
                >
                  <TextIcon />
                </div>
                <span
                  className="absolute -left-28 w-24 text-right text-[10px] font-mono uppercase tracking-wider transition-colors duration-300"
                  style={{
                    color: activeNode === 3 ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  Text Feed
                </span>
              </div>
            </div>

            <div
              ref={div4Ref}
              onMouseEnter={() => setActiveNode(4)}
              onMouseLeave={() => setActiveNode(null)}
              className="z-20 w-44 h-44 border bg-card flex flex-col items-center justify-center gap-6 relative cursor-pointer transition-colors duration-300 group"
              style={{ borderColor: activeNode === 4 ? EngineColor : "var(--bento-border)" }}
            >
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{ backgroundColor: EngineColor, opacity: activeNode === 4 ? 0.05 : 0 }}
              />
              <div className="relative flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full border border-border animate-spin [animation-duration:8s] absolute"
                  style={{ borderTopColor: EngineColor, borderRightColor: EngineColor }}
                />
                <div
                  style={{ color: activeNode === 4 ? EngineColor : "var(--muted-foreground)" }}
                  className="transition-colors duration-300 relative z-10"
                >
                  <EngineIcon />
                </div>
              </div>
              <span
                className="text-[10px] font-mono uppercase tracking-[0.2em] transition-colors duration-300"
                style={{
                  color: activeNode === 4 ? "var(--foreground)" : "var(--muted-foreground)",
                }}
              >
                Inference Engine
              </span>
            </div>

            <div
              ref={div5Ref}
              onMouseEnter={() => setActiveNode(5)}
              onMouseLeave={() => setActiveNode(null)}
              className="z-20 w-28 h-28 border bg-card ml-auto mr-16 lg:mr-24 flex flex-col items-center justify-center relative cursor-pointer transition-colors duration-300 group"
              style={{ borderColor: activeNode === 5 ? EngineColor : "var(--bento-border)" }}
            >
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{ backgroundColor: EngineColor, opacity: activeNode === 5 ? 0.1 : 0 }}
              />
              <div
                style={{ color: activeNode === 5 ? EngineColor : "var(--muted-foreground)" }}
                className="transition-colors duration-300 mb-3 relative z-10"
              >
                <OutputIcon />
              </div>
              <span
                className="absolute -right-28 w-24 text-[10px] font-mono uppercase tracking-wider transition-colors duration-300"
                style={{
                  color: activeNode === 5 ? "var(--foreground)" : "var(--muted-foreground)",
                }}
              >
                Live Output
              </span>
            </div>

            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div1Ref}
              toRef={div4Ref}
              curvature={-40}
              pathWidth={1.5}
              pathColor={getBeamColor(1, AudioColor)}
              pathOpacity={getBeamOpacity(1)}
              gradientStartColor="#ffffff"
              gradientStopColor={AudioColor}
              duration={3}
              delay={0}
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div2Ref}
              toRef={div4Ref}
              pathWidth={1.5}
              pathColor={getBeamColor(2, VisionColor)}
              pathOpacity={getBeamOpacity(2)}
              gradientStartColor="#ffffff"
              gradientStopColor={VisionColor}
              duration={3}
              delay={1}
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div3Ref}
              toRef={div4Ref}
              curvature={40}
              pathWidth={1.5}
              pathColor={getBeamColor(3, TextColor)}
              pathOpacity={getBeamOpacity(3)}
              gradientStartColor="#ffffff"
              gradientStopColor={TextColor}
              duration={3}
              delay={2}
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={div4Ref}
              toRef={div5Ref}
              pathWidth={2}
              pathColor={getBeamColor(5, EngineColor)}
              pathOpacity={getBeamOpacity(5)}
              gradientStartColor={EngineColor}
              gradientStopColor="#ffffff"
              duration={2}
              delay={0.5}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
