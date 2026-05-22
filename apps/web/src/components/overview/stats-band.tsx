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
      style={{ color: active ? "hsla(24, 75%, 60%, 1)" : "rgba(255, 255, 255, 0.25)" }}
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

          <circle r="3.5" fill="currentColor">
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
      style={{ color: active ? "hsla(199, 75%, 60%, 1)" : "rgba(255, 255, 255, 0.25)" }}
    >
      <rect
        x="10"
        y="10"
        width="80"
        height="40"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.2"
        fill="currentColor"
        fillOpacity="0.05"
      />

      <circle cx="30" cy="30" r="3" fill="currentColor" />
      <circle cx="50" cy="20" r="3" fill="currentColor" />
      <circle cx="70" cy="40" r="3" fill="currentColor" />
      <line
        x1="30"
        y1="30"
        x2="50"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="50"
        y1="20"
        x2="70"
        y2="40"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="30"
        y1="30"
        x2="70"
        y2="40"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />

      <path
        d="M 120 25 C 120 15, 140 15, 140 25 C 150 25, 150 35, 140 35 L 120 35 C 110 35, 110 25, 120 25 Z"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1.5"
      />

      <line x1="90" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <line x1="108" y1="30" x2="114" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

      <path
        d="M 100 26 L 108 34 M 108 26 L 100 34"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      {active && (
        <>
          <motion.circle
            cx="30"
            cy="30"
            r="6"
            fill="currentColor"
            opacity="0.3"
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="50"
            cy="20"
            r="6"
            fill="currentColor"
            opacity="0.3"
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
          />
          <motion.circle
            cx="70"
            cy="40"
            r="6"
            fill="currentColor"
            opacity="0.3"
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.5, delay: 1, repeat: Infinity }}
          />
        </>
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
      style={{ color: active ? "hsla(158, 55%, 55%, 1)" : "rgba(255, 255, 255, 0.25)" }}
    >
      <g transform="translate(10, 30)">
        <line
          x1="0"
          y1="0"
          x2="140"
          y2="0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />
        {Array.from({ length: 15 }).map((_, i) => (
          <line
            key={i}
            x1={i * 10}
            y1="-5"
            x2={i * 10}
            y2="5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity={i % 5 === 0 ? 0.8 : 0.3}
          />
        ))}
      </g>
      {active && (
        <motion.g
          animate={{ x: [0, 140] }}
          transition={{ duration: 1, ease: "linear", repeat: Infinity }}
        >
          <line x1="10" y1="15" x2="10" y2="45" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="7,15 13,15 10,20" fill="currentColor" />
          <polygon points="7,45 13,45 10,40" fill="currentColor" />
        </motion.g>
      )}
    </svg>
  );
}
export function StatsBand() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const stats = [
    {
      key: "Processing Latency",
      val: "48ms",
      desc: "Median end-to-end delay from input to frame generation.",
      visual: LatencyVisual,
      color: "hsla(24, 75%, 60%, 1)",
    },
    {
      key: "Compute Location",
      val: "100% Client-Side",
      desc: "Zero-server architecture utilizing WebGL and WebAssembly.",
      visual: ClientVisual,
      color: "hsla(199, 75%, 60%, 1)",
    },
    {
      key: "Motion Precision",
      val: "60 FPS",
      desc: "Synchronized 3D sign animation at native refresh rates.",
      visual: FpsVisual,
      color: "hsla(158, 55%, 55%, 1)",
    },
  ];
  return (
    <section className="relative w-full bg-background py-0 border-b border-border">
      <div className="bento-container border-x border-border">
        <div className="bento-grid md:grid-cols-3">
          {stats.map((stat, i) => {
            const Visual = stat.visual;
            const isActive = hoveredIndex === i;
            return (
              <motion.div
                key={stat.key}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="bento-cell bento-cell-hover flex flex-col p-10 md:p-12 relative overflow-hidden group cursor-pointer"
                animate={{
                  backgroundColor: isActive ? "var(--bento-hover)" : "var(--background)",
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-4 mb-10">
                  <span
                    className="bento-label transition-colors duration-300"
                    style={{ color: isActive ? stat.color : undefined }}
                  >
                    {stat.key}
                  </span>
                </div>
                <div className="mb-6 flex flex-col">
                  <span className="text-[40px] md:text-[56px] font-semibold tracking-tighter text-foreground leading-none mb-8">
                    {stat.val}
                  </span>
                  <div className="h-[60px] w-full max-w-[160px] mb-2 flex items-center">
                    <Visual active={isActive} />
                  </div>
                </div>
                <p className="text-[14px] text-secondary-foreground leading-relaxed border-t border-border pt-6 mt-auto">
                  {stat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
