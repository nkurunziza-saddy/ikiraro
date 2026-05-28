"use client";
import { PixelBackground } from "@/components/ui/pixel";
import { Matrix, wave, loader, pulse, digits } from "@/components/ui/matrix";
import { motion } from "motion/react";

export function OverviewCapabilities() {
  const features = [
    {
      label: "Input Parsing",
      name: "Voice to Sign",
      description: "Direct speech transcription routed to local Groq inference in under 50ms.",
      matrixFrames: wave,
      color: "var(--primary)",
      pixelPattern: "edges" as const,
    },
    {
      label: "Semantic Engine",
      name: "Text Normalization",
      description:
        "Handles anaphora resolution and syntax conversion into ASL gloss automatically.",
      matrixFrames: loader,
      color: "var(--primary)",
      pixelPattern: "random" as const,
    },
    {
      label: "Vision Pipeline",
      name: "Zero-Server Vision",
      description:
        "MediaPipe hand tracking executed entirely in WebAssembly, ensuring total privacy.",
      matrixFrames: pulse,
      color: "var(--primary)",
      pixelPattern: "cursor" as const,
    },
    {
      label: "Kinematics",
      name: "3D Coarticulation",
      description: "The Ikiraro engine calculates complex blending between gestures natively.",
      matrixFrames: digits,
      color: "var(--primary)",
      pixelPattern: "random" as const,
    },
  ];

  return (
    <section className="relative w-full bg-background py-24 md:py-32 border-b border-border">
      <div className="bento-container">
        <div className="max-w-[800px] mb-20">
          <h2 className="text-title mb-6">Intelligent inputs.</h2>
          <p className="text-subhero max-w-[600px]">
            Ikiraro intercepts all forms of human communication through a strict, typed API and
            normalizes it for the renderer.
          </p>
        </div>

        <div className="w-full bento-grid sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bento-cell bento-cell-hover p-10 flex flex-col justify-between min-h-[360px] cursor-crosshair relative overflow-hidden group"
              >
                <PixelBackground
                  className="absolute inset-0 z-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                  pattern={feature.pixelPattern}
                  gap={2}
                  size={8}
                  speed={0.5}
                  darkColors={feature.color}
                />
                <div className="mb-6 flex flex-col relative z-10 pointer-events-none">
                  <h3 className="text-[20px] font-semibold text-foreground tracking-tight mb-8">
                    {feature.name}
                  </h3>

                  <div className="h-[60px] w-full flex items-center mb-6 opacity-30 group-hover:opacity-100 transition-opacity duration-300">
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
                <p className="text-[15px] text-secondary-foreground leading-relaxed border-t border-border pt-6 mt-auto relative z-10 pointer-events-none">
                  {feature.description}
                </p>
                {/* HUD Corner */}
                <div className="absolute top-4 right-4 size-1 border-t border-r border-border opacity-20 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
