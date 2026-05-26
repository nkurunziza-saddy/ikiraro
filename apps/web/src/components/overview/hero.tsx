"use client";
import { Link } from "@tanstack/react-router";
import { HeroAvatarPane } from "./landing-avatar";
import { motion } from "motion/react";
import { MeshGradientCard } from "@/components/ui/mesh-gradient-card";
import { Matrix } from "@/components/ui/matrix";
export function OverviewHero() {
  return (
    <section className="relative w-full min-h-[85vh] flex flex-col justify-center overflow-hidden bg-background border-b border-border">
      <div className="absolute inset-0 z-0 blueprint-grid opacity-[0.2]"></div>
      <div className="relative z-10 bento-container grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 items-center pt-24 pb-32">
        <div className="lg:col-span-6 flex flex-col items-start relative z-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-sans text-title font-semibold tracking-tighter mb-8">
              The intelligence <br className="hidden md:block" />
              of speech. <span className="text-secondary-foreground">The velocity of sign.</span>
            </h1>
            <p className="text-subhero max-w-[500px] mb-12 text-sm text-secondary-foreground/80 leading-relaxed">
              A browser-native SDK that translates human intention into synchronized 3D physical
              motion. 100% on-device rendering. Zero server latency.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/playground"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-semibold text-[15px] hover:opacity-90 transition-opacity"
              >
                Launch Engine
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/docs"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 border border-border text-foreground font-semibold text-[15px] hover:bg-secondary transition-colors"
              >
                Explore Documentation
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="lg:col-span-6 relative mt-12 lg:mt-0 flex">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full relative group cursor-crosshair"
          >
            <div className="relative w-full aspect-square bg-card overflow-hidden border border-border transition-colors duration-500 group-hover:border-primary/20">
              <MeshGradientCard
                className="absolute inset-0 z-0 opacity-40 rounded-none border-none"
                interval={3000}
              />
              <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen">
                <HeroAvatarPane />
              </div>
              <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-border transition-all duration-500 group-hover:w-12 group-hover:h-12 group-hover:border-primary/40"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-border transition-all duration-500 group-hover:w-12 group-hover:h-12 group-hover:border-primary/40"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-border transition-all duration-500 group-hover:w-12 group-hover:h-12 group-hover:border-primary/40"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-border transition-all duration-500 group-hover:w-12 group-hover:h-12 group-hover:border-primary/40"></div>
                <div className="absolute top-0 left-0 right-0 h-10 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Viewport Active
                  </span>
                  <div className="flex items-center gap-2" aria-hidden="true">
                    <span className="w-1.5 h-1.5 bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/60">
                      Live Render
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 lg:-right-12 top-12 bottom-12 w-40 hidden md:flex flex-col gap-px bg-bento-gap border border-bento-border border-l-0 z-20 translate-x-1/2">
              {[
                {
                  label: "Latency",
                  value: "< 48ms",
                  color: "hsla(24, 75%, 60%, 1)",
                  levels: [0.2, 0.4, 0.6, 0.8, 0.9, 0.5, 0.3, 0.1],
                },
                {
                  label: "Rendering",
                  value: "60 FPS",
                  color: "hsla(158, 55%, 55%, 1)",
                  levels: [0.9, 0.8, 1.0, 0.9, 0.8, 0.9, 1.0, 0.9],
                },
                {
                  label: "Compute",
                  value: "Local",
                  color: "hsla(199, 75%, 60%, 1)",
                  levels: [0.8, 0.7, 0.9, 0.8, 0.6, 0.9, 0.7, 0.8],
                },
              ].map((spec, i) => (
                <div
                  key={i}
                  className="flex-1 relative flex flex-col justify-center bento-cell bento-cell-hover p-6 cursor-crosshair group/tag"
                >
                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground group-hover/tag:text-foreground/80 transition-colors duration-300 mb-2">
                    {spec.label}
                  </span>
                  <span className="text-[16px] font-sans font-semibold tracking-tighter text-foreground group-hover/tag:text-primary transition-colors duration-300 mb-4">
                    {spec.value}
                  </span>
                  <div className="h-6 w-full flex items-end">
                    <Matrix
                      rows={5}
                      cols={8}
                      size={2.5}
                      gap={1.5}
                      mode="vu"
                      levels={spec.levels}
                      palette={{ on: spec.color, off: "var(--bento-border)" }}
                      className="opacity-50 group-hover/tag:opacity-100 transition-opacity duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
