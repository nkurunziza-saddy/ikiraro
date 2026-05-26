"use client";
import { useState, memo } from "react";
import { motion } from "motion/react";
import { PixelBackground } from "@/components/ui/pixel";
const ChipVisual = memo(function ChipVisual({ active }: { active: boolean }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="transition-colors duration-500"
      style={{ color: active ? "hsla(24, 75%, 60%, 1)" : "var(--muted-foreground)" }}
    >
      <rect
        x="20"
        y="20"
        width="40"
        height="40"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <rect
        x="28"
        y="28"
        width="24"
        height="24"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />

      <line x1="8" y1="30" x2="20" y2="30" stroke="currentColor" strokeWidth="1.2" />
      <line x1="8" y1="40" x2="20" y2="40" stroke="currentColor" strokeWidth="1.2" />
      <line x1="8" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="1.2" />

      <line x1="60" y1="30" x2="72" y2="30" stroke="currentColor" strokeWidth="1.2" />
      <line x1="60" y1="40" x2="72" y2="40" stroke="currentColor" strokeWidth="1.2" />
      <line x1="60" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="1.2" />

      <line x1="30" y1="8" x2="30" y2="20" stroke="currentColor" strokeWidth="1.2" />
      <line x1="40" y1="8" x2="40" y2="20" stroke="currentColor" strokeWidth="1.2" />
      <line x1="50" y1="8" x2="50" y2="20" stroke="currentColor" strokeWidth="1.2" />

      <line x1="30" y1="60" x2="30" y2="72" stroke="currentColor" strokeWidth="1.2" />
      <line x1="40" y1="60" x2="40" y2="72" stroke="currentColor" strokeWidth="1.2" />
      <line x1="50" y1="60" x2="50" y2="72" stroke="currentColor" strokeWidth="1.2" />
      {active && (
        <>
          <motion.circle
            cx="20"
            cy="30"
            r="1.5"
            fill="currentColor"
            animate={{ cx: [20, 40, 40] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle
            cx="60"
            cy="50"
            r="1.5"
            fill="currentColor"
            animate={{ cx: [60, 40, 40] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}
    </svg>
  );
});
const MeshVisual = memo(function MeshVisual({ active }: { active: boolean }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="transition-colors duration-500"
      style={{ color: active ? "hsla(199, 75%, 60%, 1)" : "var(--muted-foreground)" }}
    >
      <circle
        cx="20"
        cy="25"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity={active ? 1 : 0.2}
      />
      <circle
        cx="60"
        cy="20"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity={active ? 1 : 0.2}
      />
      <circle
        cx="40"
        cy="50"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity={active ? 1 : 0.2}
      />
      <circle
        cx="55"
        cy="55"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity={active ? 1 : 0.2}
      />
      <circle
        cx="25"
        cy="55"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity={active ? 1 : 0.2}
      />

      <line
        x1="20"
        y1="25"
        x2="60"
        y2="20"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="20"
        y1="25"
        x2="40"
        y2="50"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="60"
        y1="20"
        x2="40"
        y2="50"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="40"
        y1="50"
        x2="55"
        y2="55"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="40"
        y1="50"
        x2="25"
        y2="55"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <line
        x1="60"
        y1="20"
        x2="55"
        y2="55"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      {active && (
        <>
          <motion.circle
            cx="20"
            cy="25"
            r="1.5"
            fill="currentColor"
            animate={{ cx: [20, 60], cy: [25, 20] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="40"
            cy="50"
            r="1.5"
            fill="currentColor"
            animate={{ cx: [40, 25], cy: [50, 55] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
    </svg>
  );
});
const SyncVisual = memo(function SyncVisual({ active }: { active: boolean }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="transition-colors duration-500"
      style={{ color: active ? "hsla(158, 55%, 55%, 1)" : "var(--muted-foreground)" }}
    >
      <circle cx="40" cy="40" r="24" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="40" cy="40" r="16" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <ellipse cx="40" cy="40" rx="6" ry="16" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <ellipse cx="40" cy="40" rx="16" ry="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
      {active && (
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ originX: "40px", originY: "40px" }}
        >
          <circle cx="40" cy="24" r="2" fill="currentColor" />
          <circle cx="40" cy="56" r="2" fill="currentColor" />
        </motion.g>
      )}
    </svg>
  );
});
const SecurityVisual = memo(function SecurityVisual({ active }: { active: boolean }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="transition-colors duration-500"
      style={{ color: active ? "hsla(263, 60%, 65%, 1)" : "var(--muted-foreground)" }}
    >
      <path
        d="M 40 16 L 58 24 L 58 46 C 58 58, 48 64, 40 64 C 32 64, 22 58, 22 46 L 22 24 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <circle cx="40" cy="34" r="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M 40 38 L 40 46" stroke="currentColor" strokeWidth="1.2" />
      {active && (
        <motion.path
          d="M 25 32 L 40 40 L 55 32"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.8"
          animate={{ y: [-4, 10, -4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </svg>
  );
});
export function OverviewFeaturesGrid() {
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  return (
    <section className="bg-background py-[120px] md:py-[200px] border-b border-border">
      <div className="bento-container">
        <div className="max-w-[700px] mb-20">
          <h2 className="text-title mb-6">Built for the Edge.</h2>
          <p className="text-subhero">
            Sensa brings advanced machine learning to local devices with unparalleled performance
            and minimal latency.
          </p>
        </div>

        <div className="bento-grid md:grid-cols-12">
          <div
            onMouseEnter={() => setHoveredBlock(0)}
            onMouseLeave={() => setHoveredBlock(null)}
            className="md:col-span-8 bento-cell bento-cell-hover p-10 md:p-16 flex flex-col justify-between cursor-pointer select-none relative overflow-hidden group"
          >
            <PixelBackground
              className="absolute inset-0 z-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700"
              pattern="cursor"
              gap={2}
              size={10}
              speed={0.5}
              darkColors="hsla(24, 75%, 60%, 1)"
            />
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start mb-16 relative z-10 pointer-events-none">
              <div className="sm:col-span-8 max-w-xl">
                <h3 className="text-[28px] font-semibold tracking-tight text-foreground mb-4">
                  Local Inference Engine
                </h3>
                <p className="text-section-body text-secondary-foreground">
                  Run massive models directly on hardware without needing constant cloud connection.
                  By executing LLM planning and WebGL rendering in the same thread, data stays
                  strictly local and latency approaches zero.
                </p>
              </div>
              <div className="sm:col-span-4 flex justify-end pt-2 sm:pt-0">
                <ChipVisual active={hoveredBlock === 0} />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-6 relative z-10 pointer-events-none">
              <div className="flex flex-col gap-1">
                <span className="bento-label">Architecture</span>
                <span
                  className="text-[11px] font-mono text-muted-foreground font-bold uppercase tracking-wider transition-colors duration-300"
                  style={{ color: hoveredBlock === 0 ? "hsla(24, 75%, 60%, 1)" : undefined }}
                >
                  Neural Core WebGPU
                </span>
              </div>
            </div>
          </div>

          <div
            onMouseEnter={() => setHoveredBlock(1)}
            onMouseLeave={() => setHoveredBlock(null)}
            className="md:col-span-4 bento-cell bento-cell-hover p-10 flex flex-col justify-between cursor-pointer select-none relative overflow-hidden group"
          >
            <PixelBackground
              className="absolute inset-0 z-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700"
              pattern="random"
              gap={2}
              size={10}
              speed={0.5}
              darkColors="hsla(199, 75%, 60%, 1)"
            />
            <div className="mb-8 relative z-10 pointer-events-none">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h3 className="text-[22px] font-semibold text-foreground">
                  Neural Mesh Networking
                </h3>
                <div className="shrink-0">
                  <MeshVisual active={hoveredBlock === 1} />
                </div>
              </div>
              <p className="text-section-body text-secondary-foreground">
                Devices form an ad-hoc inference cluster, sharing compute loads to solve complex
                tasks dynamically without central orchestration.
              </p>
            </div>
            <div className="flex flex-col gap-1 border-t border-border pt-6 relative z-10 pointer-events-none">
              <span className="bento-label">Topology</span>
              <span
                className="text-[11px] font-mono text-muted-foreground font-bold uppercase tracking-wider transition-colors duration-300"
                style={{ color: hoveredBlock === 1 ? "hsla(199, 75%, 60%, 1)" : undefined }}
              >
                P2P Swarm Logic
              </span>
            </div>
          </div>

          <div
            onMouseEnter={() => setHoveredBlock(2)}
            onMouseLeave={() => setHoveredBlock(null)}
            className="md:col-span-6 bento-cell bento-cell-hover p-10 flex flex-col sm:flex-row gap-8 justify-between items-start cursor-pointer select-none relative overflow-hidden group"
          >
            <PixelBackground
              className="absolute inset-0 z-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700"
              pattern="edges"
              gap={2}
              size={10}
              speed={0.5}
              darkColors="hsla(158, 55%, 55%, 1)"
            />
            <div className="flex-1 relative z-10 pointer-events-none">
              <h3 className="text-[20px] font-semibold text-foreground mb-3">Global Sync</h3>
              <p className="text-section-body text-secondary-foreground text-[15px] leading-relaxed">
                When connected, edge nodes automatically synchronize state globally with minimal
                overhead.
              </p>
              <div className="flex flex-col gap-1 mt-8 pt-4 border-t border-border">
                <span className="bento-label">Protocol</span>
                <span
                  className="text-[11px] font-mono text-muted-foreground font-bold uppercase tracking-wider transition-colors duration-300"
                  style={{ color: hoveredBlock === 2 ? "hsla(158, 55%, 55%, 1)" : undefined }}
                >
                  Delta-Only Sync
                </span>
              </div>
            </div>
            <div className="shrink-0 pt-2 relative z-10 pointer-events-none">
              <SyncVisual active={hoveredBlock === 2} />
            </div>
          </div>

          <div
            onMouseEnter={() => setHoveredBlock(3)}
            onMouseLeave={() => setHoveredBlock(null)}
            className="md:col-span-6 bento-cell bento-cell-hover p-10 flex flex-col sm:flex-row gap-8 justify-between items-start cursor-pointer select-none relative overflow-hidden group"
          >
            <PixelBackground
              className="absolute inset-0 z-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700"
              pattern="cursor"
              gap={2}
              size={10}
              speed={0.5}
              darkColors="hsla(263, 60%, 65%, 1)"
            />
            <div className="flex-1 relative z-10 pointer-events-none">
              <h3 className="text-[20px] font-semibold text-foreground mb-3">
                Zero Trust Security
              </h3>
              <p className="text-section-body text-secondary-foreground text-[15px] leading-relaxed">
                End-to-end encryption with rotating keys for all matrix data. Strict hardware-level
                isolation.
              </p>
              <div className="flex flex-col gap-1 mt-8 pt-4 border-t border-border">
                <span className="bento-label">Cryptography</span>
                <span
                  className="text-[11px] font-mono text-muted-foreground font-bold uppercase tracking-wider transition-colors duration-300"
                  style={{ color: hoveredBlock === 3 ? "hsla(263, 60%, 65%, 1)" : undefined }}
                >
                  AES-256-GCM
                </span>
              </div>
            </div>
            <div className="shrink-0 pt-2 relative z-10 pointer-events-none">
              <SecurityVisual active={hoveredBlock === 3} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
