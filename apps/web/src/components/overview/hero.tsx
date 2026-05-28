"use client";
import { Link } from "@tanstack/react-router";
import { HeroAvatarPane } from "./landing-avatar";
import { motion } from "motion/react";

export function OverviewHero() {
  return (
    <section className="relative w-full min-h-screen flex flex-col justify-center overflow-hidden bg-background">
      {/* Background: Structural Grid */}
      <div className="absolute inset-0 z-0 blueprint-grid opacity-[0.05]"></div>

      {/* The Impact Visual: High-Detail Macro */}
      <div className="absolute right-0 top-0 bottom-0 w-[45%] z-0 pointer-events-none hidden lg:block overflow-hidden border-l border-border/40">
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 0.25, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-full w-full"
        >
          <img
            src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=2400&auto=format&fit=crop"
            alt="Physical Motion Macro"
            className="size-full object-cover grayscale brightness-50 contrast-125"
          />
          <div className="absolute inset-0 bg-linear-to-r from-background via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-linear-to-b from-background via-transparent to-background"></div>
        </motion.div>
      </div>

      <div className="relative z-10 bento-container">
        <div className="max-w-[1200px]">
          {/* Refined Headline - Balanced Scale */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-16"
          >
            Speech Intelligence. <br />
            <span className="text-primary">Sign Velocity.</span>
          </motion.h1>

          {/* Clean Functional Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <p className="text-[17px] md:text-[20px] text-secondary-foreground leading-relaxed mb-12 max-w-[440px]">
                A browser-native SDK that translates human intention into synchronized physical
                motion. 100% on-device. Zero server lag.
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                <Link
                  to="/playground"
                  className="group relative flex items-center justify-center px-8 py-3 bg-foreground text-background font-bold text-[13px] tracking-widest hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                >
                  Launch Console
                  <svg
                    className="size-4 ml-3 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
                <Link
                  to="/docs"
                  className="flex items-center justify-center px-8 py-3 border border-border bg-transparent text-foreground font-bold text-[13px] tracking-widest hover:bg-secondary transition-all active:scale-95"
                >
                  Documentation
                </Link>
              </div>
            </motion.div>

            {/* Viewfinder Insert */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="lg:col-span-7 flex justify-end"
            >
              <div className="relative w-full max-w-[480px] aspect-square bg-card border border-border overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 z-0 bg-linear-to-br from-primary/5 to-transparent opacity-30"></div>
                <div className="absolute inset-0 z-10 opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700">
                  <HeroAvatarPane />
                </div>

                {/* Minimalist Viewfinder HUD */}
                <div className="absolute inset-0 z-20 pointer-events-none p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="size-4 border-t border-l border-border"></div>
                    <div className="size-4 border-t border-r border-border"></div>
                  </div>
                  <div className="flex justify-between items-end opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="size-4 border-b border-l border-border"></div>
                    <div className="size-4 border-b border-r border-border"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
