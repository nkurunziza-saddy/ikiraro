"use client";
import { useState } from "react";
import { motion } from "motion/react";

function LatencyVisual({ active }: { active: boolean }) {
  return (
    <svg
      width="100%"
      height="60"
      viewBox="0 0 160 60"
      fill="none"
      className="transition-colors duration-500"
      style={{ color: active ? "var(--primary)" : "var(--border)" }}
    >
      <path
        d="M 0 30 L 20 30 L 30 15 L 40 45 L 50 30 L 80 30 L 90 20 L 100 40 L 110 30 L 140 30 L 150 10 L 160 30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        strokeLinejoin="round"
      />
      {active && (
        <>
          <path
            d="M 0 30 L 20 30 L 30 15 L 40 45 L 50 30 L 80 30 L 90 20 L 100 40 L 110 30 L 140 30 L 150 10 L 160 30"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeDasharray="30 200"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="230; -30"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </path>
          <circle r="3" fill="currentColor">
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path="M 0 30 L 20 30 L 30 15 L 40 45 L 50 30 L 80 30 L 90 20 L 100 40 L 110 30 L 140 30 L 150 10 L 160 30"
            />
          </circle>
        </>
      )}
    </svg>
  );
}

function ClientVisual({ active }: { active: boolean }) {
  return (
    <svg
      width="100%"
      height="60"
      viewBox="0 0 160 60"
      fill="none"
      className="transition-colors duration-500"
      style={{ color: active ? "var(--primary)" : "var(--border)" }}
    >
      <rect
        x="10"
        y="10"
        width="80"
        height="40"
        rx="0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.2"
      />
      <circle cx="30" cy="30" r="2" fill="currentColor" />
      <circle cx="50" cy="20" r="2" fill="currentColor" />
      <circle cx="70" cy="40" r="2" fill="currentColor" />
      <line
        x1="30"
        y1="30"
        x2="50"
        y2="20"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      <line
        x1="50"
        y1="20"
        x2="70"
        y2="40"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      <line
        x1="30"
        y1="30"
        x2="70"
        y2="40"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {active && (
        <motion.circle
          cx="30"
          cy="30"
          r="6"
          fill="currentColor"
          opacity="0.2"
          animate={{ scale: [1, 2.5, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

function FpsVisual({ active }: { active: boolean }) {
  return (
    <svg
      width="100%"
      height="60"
      viewBox="0 0 160 60"
      fill="none"
      className="transition-colors duration-500"
      style={{ color: active ? "var(--primary)" : "var(--border)" }}
    >
      <g transform="translate(10, 30)">
        <line
          x1="0"
          y1="0"
          x2="140"
          y2="0"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.2"
        />
        {Array.from({ length: 15 }).map((_, i) => (
          <line
            key={i}
            x1={i * 10}
            y1="-4"
            x2={i * 10}
            y2="4"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity={i % 5 === 0 ? 0.6 : 0.2}
          />
        ))}
      </g>
      {active && (
        <motion.g
          animate={{ x: [0, 140] }}
          transition={{ duration: 1, ease: "linear", repeat: Infinity }}
        >
          <line x1="10" y1="15" x2="10" y2="45" stroke="currentColor" strokeWidth="1.5" />
        </motion.g>
      )}
    </svg>
  );
}

export function StatsBand() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const stats = [
    {
      key: "Latency",
      val: "48ms",
      desc: "Median end-to-end delay from input to frame generation.",
      visual: LatencyVisual,
    },
    {
      key: "Compute",
      val: "On-Device",
      desc: "Zero-server architecture utilizing WebGL and WebAssembly.",
      visual: ClientVisual,
    },
    {
      key: "Precision",
      val: "60 FPS",
      desc: "Synchronized 3D sign animation at native refresh rates.",
      visual: FpsVisual,
    },
  ];

  return (
    <section className="relative w-full bg-background border-b border-border">
      <div className="bento-container">
        <div className="bento-grid md:grid-cols-3">
          {stats.map((stat, i) => {
            const Visual = stat.visual;
            const isActive = hoveredIndex === i;
            return (
              <div
                key={stat.key}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="bento-cell bento-cell-hover flex flex-col p-12 relative overflow-hidden group cursor-pointer"
              >
                <div className="mb-6 flex flex-col">
                  <span className="text-[48px] md:text-[64px] font-bold tracking-tighter text-foreground leading-none mb-8">
                    {stat.val}
                  </span>
                  <div className="h-[60px] w-full max-w-[160px] mb-2 flex items-center">
                    <Visual active={isActive} />
                  </div>
                </div>
                <p className="text-[14px] text-secondary-foreground leading-relaxed pt-6 border-t border-border mt-auto">
                  {stat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
