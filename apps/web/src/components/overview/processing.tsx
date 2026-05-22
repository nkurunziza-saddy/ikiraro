"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Matrix } from "@/components/ui/matrix";
function HandGraphic({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 100 120"
        className="w-16 h-20 md:w-24 md:h-28 opacity-90 transition-opacity duration-300"
      >
        <circle cx="50" cy="110" r="3" fill={color} />

        <line
          x1="50"
          y1="110"
          x2="30"
          y2="80"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="50"
          y1="110"
          x2="42"
          y2="75"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="50"
          y1="110"
          x2="52"
          y2="75"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="50"
          y1="110"
          x2="62"
          y2="78"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="50"
          y1="110"
          x2="72"
          y2="85"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <path
          d="M 30 80 L 42 75 L 52 75 L 62 78 L 72 85"
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.5"
        />

        <line
          x1="30"
          y1="80"
          x2="20"
          y2="70"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="20"
          y1="70"
          x2="14"
          y2="60"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <circle cx="30" cy="80" r="1.5" fill={color} />
        <circle cx="20" cy="70" r="1.5" fill={color} />
        <circle cx="14" cy="60" r="2.5" fill={color} className={active ? "animate-pulse" : ""} />

        <line
          x1="42"
          y1="75"
          x2="38"
          y2="52"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="38"
          y1="52"
          x2="34"
          y2="38"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="34"
          y1="38"
          x2="30"
          y2="25"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <circle cx="42" cy="75" r="1.5" fill={color} />
        <circle cx="38" cy="52" r="1.5" fill={color} />
        <circle cx="34" cy="38" r="1.5" fill={color} />
        <circle cx="30" cy="25" r="2.5" fill={color} className={active ? "animate-pulse" : ""} />

        <line
          x1="52"
          y1="75"
          x2="52"
          y2="50"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="52"
          y1="50"
          x2="52"
          y2="34"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="52"
          y1="34"
          x2="52"
          y2="18"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <circle cx="52" cy="75" r="1.5" fill={color} />
        <circle cx="52" cy="50" r="1.5" fill={color} />
        <circle cx="52" cy="34" r="1.5" fill={color} />
        <circle cx="52" cy="18" r="2.5" fill={color} className={active ? "animate-pulse" : ""} />

        <line
          x1="62"
          y1="78"
          x2="64"
          y2="54"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="64"
          y1="54"
          x2="66"
          y2="40"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="66"
          y1="40"
          x2="68"
          y2="28"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <circle cx="62" cy="78" r="1.5" fill={color} />
        <circle cx="64" cy="54" r="1.5" fill={color} />
        <circle cx="66" cy="40" r="1.5" fill={color} />
        <circle cx="68" cy="28" r="2.5" fill={color} className={active ? "animate-pulse" : ""} />

        <line
          x1="72"
          y1="85"
          x2="78"
          y2="65"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="78"
          y1="65"
          x2="82"
          y2="53"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line
          x1="82"
          y1="53"
          x2="86"
          y2="42"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <circle cx="72" cy="85" r="1.5" fill={color} />
        <circle cx="78" cy="65" r="1.5" fill={color} />
        <circle cx="82" cy="53" r="1.5" fill={color} />
        <circle cx="86" cy="42" r="2.5" fill={color} className={active ? "animate-pulse" : ""} />
      </svg>
    </div>
  );
}
function FaceGraphic({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 100 120"
        className="w-16 h-20 md:w-24 md:h-28 opacity-90 transition-opacity duration-300"
      >
        <path
          d="M 50 15 C 25 15, 20 50, 25 80 C 30 100, 45 110, 50 110 C 55 110, 70 100, 75 80 C 80 50, 75 15, 50 15 Z"
          fill="transparent"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <ellipse
          cx="38"
          cy="45"
          rx="8"
          ry="4"
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <ellipse
          cx="62"
          cy="45"
          rx="8"
          ry="4"
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <circle cx="38" cy="45" r="2" fill={color} />
        <circle cx="62" cy="45" r="2" fill={color} />
        <path
          d="M 50 40 L 50 65 L 43 72 L 50 75 L 57 72 L 50 65"
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <circle cx="50" cy="65" r="2" fill={color} />
        <path
          d="M 38 85 Q 50 95 62 85 Q 50 80 38 85 Z"
          fill="transparent"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
        <line x1="38" y1="85" x2="62" y2="85" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="50" y1="15" x2="50" y2="40" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="50" y1="40" x2="38" y2="45" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="50" y1="40" x2="62" y2="45" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="38" y1="45" x2="25" y2="45" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="62" y1="45" x2="75" y2="45" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="38" y1="45" x2="50" y2="65" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="62" y1="45" x2="50" y2="65" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="25" y1="80" x2="38" y2="85" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="75" y1="80" x2="62" y2="85" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        {active && (
          <motion.line
            x1="15"
            y1="20"
            x2="85"
            y2="20"
            stroke={color}
            strokeWidth="1.5"
            strokeOpacity="0.8"
            animate={{ y1: [20, 105, 20], y2: [20, 105, 20] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </svg>
    </div>
  );
}
function BodyGraphic({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 100 120"
        className="w-16 h-20 md:w-24 md:h-28 opacity-90 transition-opacity duration-300"
      >
        <circle cx="50" cy="25" r="6" stroke={color} strokeWidth="1.5" fill="transparent" />
        <line
          x1="50"
          y1="31"
          x2="50"
          y2="65"
          stroke={color}
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        <line
          x1="32"
          y1="38"
          x2="68"
          y2="38"
          stroke={color}
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        <line
          x1="32"
          y1="38"
          x2="24"
          y2="55"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <line
          x1="24"
          y1="55"
          x2="20"
          y2="70"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <line
          x1="68"
          y1="38"
          x2="76"
          y2="55"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <line
          x1="76"
          y1="55"
          x2="80"
          y2="70"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <line
          x1="40"
          y1="65"
          x2="60"
          y2="65"
          stroke={color}
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        <line
          x1="40"
          y1="65"
          x2="38"
          y2="90"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <line
          x1="38"
          y1="90"
          x2="36"
          y2="110"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <line
          x1="60"
          y1="65"
          x2="62"
          y2="90"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <line
          x1="62"
          y1="90"
          x2="64"
          y2="110"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <circle cx="32" cy="38" r="2.5" fill={color} className={active ? "animate-pulse" : ""} />
        <circle cx="68" cy="38" r="2.5" fill={color} className={active ? "animate-pulse" : ""} />
        <circle cx="20" cy="70" r="2" fill={color} />
        <circle cx="80" cy="70" r="2" fill={color} />
        <circle cx="38" cy="90" r="2" fill={color} />
        <circle cx="62" cy="90" r="2" fill={color} />
      </svg>
    </div>
  );
}
const cardSettings = [
  {
    title: "Hand Tracking",
    subtitle: "Active Hand Matrix",
    description: "Resolves 21 key points per hand with full degrees of freedom.",
    color: "hsla(24, 75%, 60%, 1)",
    metric: "21 Keypoints",
    inferenceTime: "0.4ms",
    precision: "99.8%",
    status: "Tracking active",
    levels: [0.2, 0.5, 0.8, 0.9, 0.7, 0.4, 0.3, 0.2],
  },
  {
    title: "Facial Mapping",
    subtitle: "High-Density Mesh",
    description: "Tracks 468 landmark points for micro-expression transfer.",
    color: "hsla(199, 75%, 60%, 1)",
    metric: "468 Landmarks",
    inferenceTime: "1.1ms",
    precision: "99.2%",
    status: "Mapping active",
    levels: [0.4, 0.6, 0.9, 1.0, 0.8, 0.5, 0.4, 0.3],
  },
  {
    title: "Body Pose",
    subtitle: "Skeletal Alignment",
    description: "Computes 33 skeletal joints in 3D space with auto-calibration.",
    color: "hsla(158, 55%, 55%, 1)",
    metric: "33 Joint Nodes",
    inferenceTime: "1.4ms",
    precision: "98.9%",
    status: "Skeletal active",
    levels: [0.1, 0.3, 0.5, 0.7, 0.9, 0.8, 0.5, 0.2],
  },
];
export function OverviewProcessing() {
  const [activeLayer, setActiveLayer] = useState<number>(0);
  return (
    <section className="relative w-full bg-background py-[120px] md:py-[200px] border-b border-border">
      <div className="bento-container grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
        <div className="lg:col-span-5 lg:col-start-2 flex flex-col">
          <h2 className="text-title mb-6">
            Multimodal Processing. <br /> Sub-millisecond Latency.
          </h2>
          <p className="text-subhero mb-10">
            The Sensa engine captures high-fidelity kinematic data across multiple modalities
            simultaneously. Hands, face, and body posture are computed in parallel to reconstruct
            intent with zero lag.
          </p>

          <div className="flex items-center gap-6 mb-8 border-b border-border pb-2">
            {cardSettings.map((card, i) => {
              const isActive = activeLayer === i;
              return (
                <button
                  key={i}
                  onClick={() => setActiveLayer(i)}
                  className="relative py-2 text-[11px] font-mono uppercase tracking-wider transition-colors duration-300 cursor-pointer select-none outline-none"
                  style={{
                    color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  {card.title}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px]"
                      style={{ backgroundColor: card.color }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col gap-6">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <span>Status Telemetry</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ backgroundColor: cardSettings[activeLayer].color }}
                />
                Live Feed
              </span>
            </div>
            <div className="grid grid-cols-3 gap-6 font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground block mb-1 uppercase tracking-wider">
                  Inference Time
                </span>
                <span className="text-[13px] text-foreground">
                  {cardSettings[activeLayer].inferenceTime}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block mb-1 uppercase tracking-wider">
                  Tracking Accuracy
                </span>
                <span className="text-[13px] text-foreground">
                  {cardSettings[activeLayer].precision}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block mb-1 uppercase tracking-wider">
                  System Status
                </span>
                <span
                  className="text-[13px] uppercase"
                  style={{ color: cardSettings[activeLayer].color }}
                >
                  {cardSettings[activeLayer].status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-7 relative w-full aspect-square border border-bento-border bg-background overflow-hidden rounded-none">
          <div className="absolute inset-0 flex flex-col gap-px bg-bento-gap">
            {cardSettings.map((card, i) => {
              const isActive = activeLayer === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setActiveLayer(i)}
                  className="flex-1 relative flex items-center p-6 md:p-8 group cursor-crosshair overflow-hidden transition-colors duration-500 bento-cell"
                  style={{
                    backgroundColor: isActive ? "var(--bento-hover)" : "var(--background)",
                  }}
                >
                  <div
                    className="flex flex-col relative z-10 pointer-events-none w-[45%] transition-opacity duration-500"
                    style={{ opacity: isActive ? 1 : 0.4 }}
                  >
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2 block transition-colors duration-300"
                      style={{ color: isActive ? card.color : "var(--muted-foreground)" }}
                    >
                      {card.subtitle}
                    </span>
                    <h3 className="text-[18px] md:text-[20px] font-semibold text-foreground tracking-tight mb-4">
                      {card.title}
                    </h3>

                    <div
                      className="transition-opacity duration-500"
                      style={{ opacity: isActive ? 1 : 0.05 }}
                    >
                      <Matrix
                        rows={5}
                        cols={8}
                        size={3}
                        gap={1.5}
                        mode="vu"
                        levels={card.levels}
                        palette={{ on: card.color, off: "var(--bento-border)" }}
                      />
                    </div>
                  </div>

                  <div className="relative z-10 pointer-events-none w-[55%] flex justify-end h-full items-center">
                    <div
                      className="transition-opacity duration-500"
                      style={{ opacity: isActive ? 1 : 0.1 }}
                    >
                      {i === 0 && <HandGraphic active={isActive} color={card.color} />}
                      {i === 1 && <FaceGraphic active={isActive} color={card.color} />}
                      {i === 2 && <BodyGraphic active={isActive} color={card.color} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
