"use client";
import { useState } from "react";
import { Matrix, wave, loader, pulse, digits, snake } from "@/components/ui/matrix";
import { PixelBackground } from "@/components/ui/pixel";
import { motion } from "motion/react";

const nodesData = [
  {
    title: "Input Buffer",
    desc: "Intercepts raw speech, type, or camera feeds, normalizing frame rates at 120Hz.",
    color: "var(--primary)",
    matrixFrames: wave,
  },
  {
    title: "Tokenization",
    desc: "Converts normalized inputs into dense semantic tokens via WebAssembly BPE.",
    color: "var(--primary)",
    matrixFrames: loader,
  },
  {
    title: "Groq Llama 3",
    desc: "Executes real-time linguistic planning, mapping tokens to sign structures.",
    color: "var(--primary)",
    matrixFrames: snake,
  },
  {
    title: "Skeletal Queue",
    desc: "Synthesizes geometries and coarticulation interpolation for smooth transitions.",
    color: "var(--primary)",
    matrixFrames: digits,
  },
  {
    title: "3D Output",
    desc: "Renders smooth 60fps skeletal animations locally inside the viewport.",
    color: "var(--primary)",
    matrixFrames: pulse,
  },
];

export function LivePreview() {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  return (
    <section className="relative w-full bg-background py-24 md:py-32 overflow-hidden border-b border-border">
      <div className="bento-container grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 items-end mb-24">
        <div className="lg:col-span-7">
          <h2 className="text-title mb-8">
            The translation of <br /> human intention.
          </h2>
          <p className="text-[18px] md:text-[22px] text-secondary-foreground leading-relaxed font-medium text-balance">
            Whether you speak, type, or sign into the camera, Ikiraro intercepts raw human data and
            routes it through a central intelligence entirely on-device.
          </p>
        </div>
        <div className="lg:col-span-5 pb-2">
          <div className="p-8 border border-border bg-secondary/10 relative">
            <p className="text-[15px] text-secondary-foreground leading-relaxed">
              We abandoned the traditional server-roundtrip model. The result is an intricate ballet
              of geometry that happens in real time, with zero data leaving the browser.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full relative bg-card/30 py-24 border-y border-border">
        <div className="absolute inset-0 z-0 blueprint-grid opacity-[0.08]"></div>
        <div className="relative z-10 bento-container">
          <div className="flex flex-col items-center">
            <div className="w-full flex flex-col lg:flex-row gap-px bg-bento-gap border border-bento-border relative shadow-2xl overflow-hidden">
              {nodesData.map((node, i) => {
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setActiveNode(i)}
                    onMouseLeave={() => setActiveNode(null)}
                    className="flex-1 bento-cell bento-cell-hover relative flex flex-col p-8 lg:p-10 cursor-crosshair group min-h-[300px] z-10"
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
                      <div className="flex-1 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity duration-300 mb-10">
                        <Matrix
                          rows={7}
                          cols={7}
                          frames={node.matrixFrames}
                          size={5}
                          gap={3}
                          fps={10}
                          palette={{ on: node.color, off: "var(--bento-border)" }}
                        />
                      </div>
                      <h3 className="text-[15px] font-bold text-foreground tracking-widest text-center uppercase">
                        {node.title}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="min-h-[80px] text-center mt-12 w-full max-w-[900px] transition-all duration-300 bg-background/80 border border-border p-8 flex items-center justify-center backdrop-blur-md relative z-10 shadow-xl">
              {activeNode !== null ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-[12px] tracking-wide text-foreground leading-relaxed"
                >
                  <span className="text-primary font-bold uppercase tracking-[0.2em]">
                    // STAGE_0{activeNode + 1} // {nodesData[activeNode].title}
                  </span>{" "}
                  : {nodesData[activeNode].desc}
                </motion.div>
              ) : (
                <div className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase animate-pulse">
                  Hover over synthesis nodes to inspect pipeline telemetry
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
