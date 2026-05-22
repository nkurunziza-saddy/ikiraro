"use client";
import { useState } from "react";
import { Matrix, wave, loader, pulse, digits, snake } from "@/components/ui/matrix";
import { PixelBackground } from "@/components/ui/pixel";
const nodesData = [
  {
    title: "Input Buffer",
    desc: "Intercepts raw speech, type, or camera feeds, normalizing frame rates and resolutions at 120Hz.",
    color: "hsla(24, 75%, 60%, 1)",
    matrixFrames: wave,
  },
  {
    title: "Tokenization",
    desc: "Converts normalized inputs into dense semantic tokens via WebAssembly-compiled Byte-Pair Encoding.",
    color: "hsla(199, 75%, 60%, 1)",
    matrixFrames: loader,
  },
  {
    title: "Groq Llama 3",
    desc: "Executes real-time linguistic planning, mapping semantic tokens to target sign structures under 10ms.",
    color: "hsla(158, 55%, 55%, 1)",
    matrixFrames: snake,
  },
  {
    title: "WebGL Renderer",
    desc: "Synthesizes skeletal geometries and coarticulation interpolation for smooth physical transitions.",
    color: "hsla(263, 60%, 65%, 1)",
    matrixFrames: digits,
  },
  {
    title: "3D Output",
    desc: "Renders smooth 60fps skeletal animations locally inside the viewport with total hardware privacy.",
    color: "hsla(24, 75%, 60%, 1)",
    matrixFrames: pulse,
  },
];
export function LivePreview() {
  const [activeNode, setActiveNode] = useState<number | null>(null);
  return (
    <section className="relative w-full bg-background py-[120px] md:py-[200px] overflow-hidden border-b border-border">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-y-20 md:gap-16">
        <div className="md:col-span-5 md:col-start-2">
          <div className="sticky top-24">
            <h2 className="text-title mb-8">
              The translation of <br /> human intention.
            </h2>
            <div className="flex flex-col gap-8">
              <p className="text-subhero">
                Whether you speak, type, or sign into the camera, Sensa intercepts raw human data
                and routes it through a central intelligence.
              </p>
            </div>
          </div>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <div className="space-y-12">
            <p className="text-[16px] text-secondary-foreground leading-relaxed">
              We abandoned the traditional server-roundtrip model. Instead, the engine relies on an
              ultra-low latency architecture driven by Groq's Llama models for linguistic planning,
              and a custom WebGL renderer for the physical execution of the sign.
            </p>
            <div className="p-8 border border-border bg-secondary/20">
              <h4 className="text-metadata mb-4">Technical Note</h4>
              <p className="text-[14px] text-secondary-foreground leading-relaxed">
                The result is an intricate ballet of geometry that happens entirely on your device,
                in real time. Zero data leaves the browser, ensuring total privacy for sensitive
                communication.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Blueprint technical diagram break */}
      <div className="w-full mt-24 md:mt-32 border-y border-border relative bg-card py-24">
        {/* Large Grid background */}
        <div className="absolute inset-0 z-0 blueprint-grid opacity-[0.25]"></div>
        <div className="relative z-10 bento-container flex flex-col items-center">
          {/* Bento-Box Pipeline */}
          <div className="w-full flex flex-col lg:flex-row gap-px bg-bento-gap border border-bento-border shadow-2xl relative">
            {/* Animated Data Pipeline Sweep Line (Behind) */}
            <div className="hidden lg:block absolute left-0 right-0 top-1/2 h-[1px] bg-border -translate-y-1/2 z-0 overflow-hidden">
              {activeNode !== null && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-24 blur-[4px] opacity-80"
                  style={{
                    backgroundColor: nodesData[activeNode].color,
                    animation: `sweep ${activeNode === nodesData.length - 1 ? 1 : 2}s linear infinite`,
                  }}
                >
                  <style>
                    {`@keyframes sweep {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(1400px); }
                            }`}
                  </style>
                </div>
              )}
            </div>
            {nodesData.map((node, i) => {
              const isActive = activeNode === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setActiveNode(i)}
                  onMouseLeave={() => setActiveNode(null)}
                  className="flex-1 bento-cell bento-cell-hover relative flex flex-col p-8 lg:p-10 cursor-crosshair group min-h-[280px] z-10"
                >
                  <PixelBackground
                    className="absolute inset-0 z-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                    pattern="random"
                    gap={2}
                    size={6}
                    speed={0.5}
                    darkColors={node.color}
                  />
                  <div className="relative z-10 pointer-events-none flex flex-col h-full">
                    <span
                      className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-8 block transition-colors duration-300"
                      style={{ color: isActive ? node.color : undefined }}
                    >
                      Phase 0{i + 1}
                    </span>
                    {/* Matrix Visual representing the node */}
                    <div className="flex-1 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity duration-300 mb-8">
                      <Matrix
                        rows={7}
                        cols={7}
                        frames={node.matrixFrames}
                        size={4}
                        gap={2}
                        fps={10}
                        palette={{ on: node.color, off: "var(--bento-border)" }}
                      />
                    </div>
                    <h3 className="text-[16px] font-semibold text-foreground tracking-tight text-center">
                      {node.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Interactive telemetry specs */}
          <div className="min-h-[60px] text-center mt-12 w-full max-w-[800px] transition-all duration-300 bg-background/80 border border-border p-6 flex items-center justify-center backdrop-blur-md relative z-10">
            {activeNode !== null ? (
              <div className="font-mono text-[12px] tracking-wide text-foreground leading-relaxed">
                <span style={{ color: nodesData[activeNode].color }} className="font-bold">
                  // {nodesData[activeNode].title.toUpperCase()}
                </span>{" "}
                : {nodesData[activeNode].desc}
              </div>
            ) : (
              <div className="font-mono text-[12px] tracking-wide text-muted-foreground italic">
                Hover over any node in the synthesis pipeline to inspect system parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
