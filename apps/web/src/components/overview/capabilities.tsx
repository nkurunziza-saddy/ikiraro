"use client";
import { useState } from "react";
import { PixelBackground } from "@/components/ui/pixel";
import { Matrix, wave, loader, pulse, digits } from "@/components/ui/matrix";
export function OverviewCapabilities() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const features = [
    {
      label: "Input Parsing",
      name: "Voice to Sign",
      description: "Direct speech transcription routed to local Groq inference in under 50ms.",
      matrixFrames: wave,
      color: "hsla(24, 75%, 60%, 1)",
      pixelPattern: "edges" as const,
    },
    {
      label: "Semantic Engine",
      name: "Text Normalization",
      description:
        "Handles anaphora resolution and syntax conversion into ASL gloss automatically.",
      matrixFrames: loader,
      color: "hsla(199, 75%, 60%, 1)",
      pixelPattern: "random" as const,
    },
    {
      label: "Vision Pipeline",
      name: "Zero-Server Vision",
      description:
        "MediaPipe hand tracking executed entirely in WebAssembly, ensuring total privacy.",
      matrixFrames: pulse,
      color: "hsla(158, 55%, 55%, 1)",
      pixelPattern: "cursor" as const,
    },
    {
      label: "Kinematics",
      name: "3D Coarticulation",
      description: "The Sensa engine calculates complex blending between gestures natively.",
      matrixFrames: digits,
      color: "hsla(263, 60%, 65%, 1)",
      pixelPattern: "random" as const,
    },
  ];
  return (
    <section className="relative w-full bg-background py-[120px] md:py-[160px] border-b border-border">
      <div className="bento-container">
        <div className="max-w-[700px] mb-20">
          <h2 className="text-title mb-6">Intelligent inputs.</h2>
          <p className="text-subhero">
            Sensa intercepts all forms of human communication through a strict, typed API and
            normalizes it for the renderer.
          </p>
        </div>

        <div className="w-full bento-grid sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const isActive = hoveredIndex === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="bento-cell bento-cell-hover p-8 lg:p-10 flex flex-col justify-between min-h-[320px] cursor-pointer relative overflow-hidden group"
              >
                <PixelBackground
                  className="absolute inset-0 z-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700"
                  pattern={feature.pixelPattern}
                  gap={2}
                  size={8}
                  speed={0.5}
                  darkColors={feature.color}
                />
                <div className="mb-6 flex flex-col relative z-10 pointer-events-none">
                  <span
                    className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-4 block transition-colors duration-300"
                    style={{ color: isActive ? feature.color : undefined }}
                  >
                    {feature.label}
                  </span>
                  <h3 className="text-[18px] font-semibold text-foreground tracking-tight mb-8">
                    {feature.name}
                  </h3>

                  <div className="h-[60px] w-full flex items-center mb-6 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                    <Matrix
                      rows={7}
                      cols={7}
                      frames={feature.matrixFrames}
                      size={4}
                      gap={2}
                      fps={10}
                      palette={{ on: feature.color, off: "var(--bento-border)" }}
                    />
                  </div>
                </div>
                <p className="text-[14px] text-secondary-foreground leading-relaxed border-t border-border pt-6 mt-auto relative z-10 pointer-events-none">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
