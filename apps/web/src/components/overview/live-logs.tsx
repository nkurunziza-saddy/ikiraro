import { useEffect, useState, useRef } from "react";
import { Terminal, Cpu, Activity } from "lucide-react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { Matrix, loader, wave } from "@/components/ui/matrix";
import { useTheme } from "next-themes";
const LOG_TEMPLATES = [
  "[INFO] Speech capture thread initialized.",
  "[INFO] Audio stream started at 48.0kHz (mono).",
  "[OK] Local model weights verified (sha256: 8a7c29e...).",
  "[INFO] WebAssembly core loaded. Memory: 128MB linear.",
  "[DECRYPT] Keyframe sequence decryption signature verified.",
  "[PROCESS] Decoding speech token vector...",
  "[OK] NLU Parser resolved intention: 'Where is the bridge?'",
  "[SYNTH] Blending bone matrices for avatar 'Ikiraro-3D'.",
  "[RENDER] Context WebGL2 initialized successfully.",
  "[RENDER] Frame rate locked at 60.0 FPS (GPU bound).",
  "[OK] Synthesizer output ready. Latency: 4.8ms.",
  "[PROCESS] Streaming kinematic bone orientations...",
  "[INFO] WebGPU canvas resizing detected: 1920x1080.",
  "[WARN] Subtle audio jitter detected, re-aligning frames...",
  "[OK] Joint vectors projected. Active bones: 48, confidence: 99.2%",
];
export function OverviewLiveLogs() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted ? resolvedTheme === "dark" : true;
  const [logs, setLogs] = useState<string[]>([
    "[INFO] Speech capture thread initialized.",
    "[INFO] Audio stream started at 48.0kHz (mono).",
    "[OK] Local model weights verified (sha256: 8a7c29e...).",
    "[INFO] WebAssembly core loaded. Memory: 128MB linear.",
  ]);
  const [vuLevels, setVuLevels] = useState<number[]>([
    0.5, 0.4, 0.6, 0.3, 0.7, 0.4, 0.8, 0.5, 0.3, 0.6,
  ]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logInterval = setInterval(() => {
      setLogs((prev) => {
        const nextTemplate = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
        const timestamp = new Date().toLocaleTimeString();
        const newLog = `[${timestamp}] ${nextTemplate}`;
        const newLogs = [...prev, newLog];
        if (newLogs.length > 40) {
          newLogs.shift();
        }
        return newLogs;
      });
    }, 1500);
    return () => clearInterval(logInterval);
  }, []);

  useEffect(() => {
    const vuInterval = setInterval(() => {
      setVuLevels((prev) =>
        prev.map((level) => {
          const delta = (Math.random() - 0.5) * 0.3;
          return Math.max(0.1, Math.min(1, level + delta));
        }),
      );
    }, 120);
    return () => clearInterval(vuInterval);
  }, []);

  useEffect(() => {
    const container = logContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);
  const matrixOnColor = isDark ? "#ffffff" : "#000000";
  const matrixOffColor = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)";
  return (
    <section className="relative w-full py-24 md:py-32 bg-background border-b border-border overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-foreground/[0.01] blur-[90px] rounded-full"></div>
      </div>
      <div className="bento-container">
        <div className="flex flex-col items-center text-center max-w-[700px] mx-auto mb-16">
          <h2 className="font-sans font-medium text-[32px] md:text-[44px] leading-[1.1] text-foreground tracking-tight mb-4">
            Live Stream Diagnostics.
          </h2>
          <p className="font-sans text-[15px] md:text-[16px] text-muted-foreground leading-relaxed">
            Monitor real-time calculations directly from the local browser sandbox. Inspect
            rendering threads, matrix operations, and dynamic vector updates.
          </p>
        </div>

        <div className="bento-grid md:grid-cols-12">
          <div className="lg:col-span-8 bento-cell flex flex-col h-[500px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-bento-border bg-secondary/20">
              <div className="flex items-center gap-3">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-[13px] font-mono text-foreground font-semibold">
                  sensa-engine-logs.sh
                </span>
              </div>
              <div className="flex gap-1.5 opacity-50">
                <span className="w-2.5 h-2.5 bg-foreground/20"></span>
                <span className="w-2.5 h-2.5 bg-foreground/20"></span>
                <span className="w-2.5 h-2.5 bg-foreground/20"></span>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <ProgressiveBlur side="top" strength={3} size="60px" tint={false} />
              <div
                ref={logContainerRef}
                className="w-full h-full overflow-y-auto px-6 md:px-8 py-8 font-mono text-[13px] text-foreground/60 space-y-2.5 scroll-smooth"
                style={{ scrollbarWidth: "none" }}
              >
                {logs.map((log, index) => {
                  const isOk = log.includes("[OK]");
                  const isWarn = log.includes("[WARN]");
                  const isProcess = log.includes("[PROCESS]");
                  return (
                    <div key={index} className="leading-relaxed whitespace-pre-wrap flex gap-3">
                      <span className="w-4 shrink-0 text-center">
                        {isOk && <span className="text-primary font-bold">✓</span>}
                        {isWarn && <span className="text-yellow-500 font-bold">⚠</span>}
                        {isProcess && <span className="text-foreground/40 animate-pulse">●</span>}
                        {!isOk && !isWarn && !isProcess && (
                          <span className="text-foreground/20">&gt;</span>
                        )}
                      </span>
                      <span
                        className={
                          isOk
                            ? "text-foreground"
                            : isWarn
                              ? "text-yellow-500/90"
                              : "text-muted-foreground"
                        }
                      >
                        {log}
                      </span>
                    </div>
                  );
                })}
              </div>
              <ProgressiveBlur side="bottom" strength={3} size="60px" tint={false} />
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-px bg-bento-gap">
            <div className="flex-1 bento-cell p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-foreground">
                    Acoustic VU Spectrum
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground mb-8">
                  Real-time spectrum analysis of linguistic input.
                </p>
              </div>
              <div className="flex justify-center items-center py-6 bg-secondary/50 border border-border">
                <Matrix
                  rows={7}
                  cols={10}
                  mode="vu"
                  levels={vuLevels}
                  size={12}
                  gap={3}
                  palette={{
                    on: matrixOnColor,
                    off: matrixOffColor,
                  }}
                  brightness={0.9}
                />
              </div>
            </div>

            <div className="flex-1 bento-cell p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-foreground">
                    Synthesis Cache Load
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground mb-8">
                  Local buffer cycles and processing frame threads.
                </p>
              </div>
              <div className="flex items-center justify-around py-6 bg-secondary/50 border border-border">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase mb-3 font-semibold">
                    Matrix Loop
                  </span>
                  <Matrix
                    rows={7}
                    cols={7}
                    frames={loader}
                    fps={14}
                    size={7}
                    gap={2}
                    palette={{
                      on: matrixOnColor,
                      off: matrixOffColor,
                    }}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase mb-3 font-semibold">
                    Wave Sweep
                  </span>
                  <Matrix
                    rows={7}
                    cols={7}
                    frames={wave}
                    fps={12}
                    size={7}
                    gap={2}
                    palette={{
                      on: matrixOnColor,
                      off: matrixOffColor,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
