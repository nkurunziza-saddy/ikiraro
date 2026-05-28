"use client";
import { useState } from "react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
const PrivacyColor = "hsla(158, 55%, 55%, 1)";
function ShieldIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.1 : 0}
        className="transition-all duration-300"
      />
      <path d="M12 8v4" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}
function LockIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.1 : 0}
        className="transition-all duration-300"
      />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 10 7 10 7a18.14 18.14 0 0 1-2.1 3.11" />
      <line x1="4" y1="4" x2="20" y2="20" />
    </svg>
  );
}
export function OverviewPrivacy() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const rows = [
    { title: "Hardware Sandboxed Vision", Icon: ShieldIcon },
    { title: "TLS 1.3 Intention Tunneling", Icon: LockIcon },
  ];
  return (
    <section className="relative w-full bg-background py-[120px] md:py-[200px] border-b border-border">
      <div className="bento-container grid grid-cols-1 md:grid-cols-12 gap-24 items-center relative z-10">
        <div className="md:col-span-6">
          <h2 className="text-title mb-6">
            Your Data. <br /> Stays on Your Device.
          </h2>
          <p className="text-subhero mb-16">
            We process all high-resolution video and kinematic data directly on the edge. Raw
            footage never leaves your device — only compressed, encrypted intent vectors are
            transmitted.
          </p>
          <div className="bento-grid grid-cols-1">
            {rows.map((row, i) => {
              const Icon = row.Icon;
              const isActive = hoveredRow === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="flex items-center gap-6 p-8 bento-cell bento-cell-hover cursor-pointer"
                >
                  <div
                    style={{ color: isActive ? PrivacyColor : "var(--muted-foreground)" }}
                    className="transition-colors duration-300"
                  >
                    <Icon active={isActive} />
                  </div>
                  <span className="text-[16px] font-semibold text-foreground transition-colors duration-300">
                    {row.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-6">
          <div className="relative w-full aspect-[4/3] bento-grid grid-cols-1 sm:grid-cols-2 overflow-hidden group cursor-pointer hover:border-primary/5 transition-colors duration-500">
            <div className="relative bento-cell bg-card overflow-hidden flex flex-col justify-center">
              <div className="absolute inset-0 blueprint-grid opacity-[0.15]"></div>
              <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 group-hover:scale-[1.02]">
                <div className="p-4 border border-border bg-background mb-6 text-muted-foreground">
                  <EyeOffIcon />
                </div>
                <span className="bento-label">Raw Sensor Stream</span>
              </div>
              <ProgressiveBlur side="bottom" className="absolute bottom-0 left-0 w-full h-[80px]" />
              <ProgressiveBlur side="top" className="absolute top-0 left-0 w-full h-[80px]" />
            </div>
            <div className="bento-cell bento-cell-hover p-10 flex flex-col justify-center gap-8 relative overflow-hidden transition-colors duration-500">
              <div
                className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-5"
                style={{ backgroundColor: PrivacyColor }}
              />
              <div className="flex flex-col gap-2 relative z-10">
                <span className="text-metadata text-muted-foreground transition-colors duration-500 group-hover:text-foreground">
                  Status
                </span>
                <div className="font-mono text-[10px] text-muted-foreground leading-relaxed break-all p-5 border border-border transition-all duration-500 bg-secondary/20 shadow-inner group-hover:text-foreground group-hover:bg-secondary/40">
                  <span style={{ color: PrivacyColor }}>0x8F2B...A9C4</span>
                  <br />
                  [SESSION ENCRYPTED]
                  <br />
                  AES-256-GCM
                  <br />
                  VERIFIED
                  <br />
                  OK
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
