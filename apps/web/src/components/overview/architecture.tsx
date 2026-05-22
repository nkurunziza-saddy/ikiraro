import { Mic, Brain, Cpu, Database, Eye } from "lucide-react";
import { CircuitBoard, type CircuitConnection } from "@/components/ui/circuit-board";
const ARCH_NODES = [
  {
    id: "input",
    x: 60,
    y: 200,
    label: "Audio Capture",
    status: "active" as const,
    size: "lg" as const,
    icon: <Mic className="h-5 w-5 text-foreground" />,
  },
  {
    id: "parser",
    x: 220,
    y: 200,
    label: "Kinematic Parser",
    status: "processing" as const,
    size: "md" as const,
    icon: <Brain className="h-4 w-4 text-foreground" />,
  },
  {
    id: "syn",
    x: 380,
    y: 200,
    label: "Sign Synth (ALU)",
    status: "processing" as const,
    size: "lg" as const,
    icon: <Cpu className="h-5 w-5 text-foreground" />,
  },
  {
    id: "cache",
    x: 380,
    y: 340,
    label: "Motion Cache",
    status: "active" as const,
    size: "md" as const,
    icon: <Database className="h-4 w-4 text-foreground" />,
  },
  {
    id: "render",
    x: 540,
    y: 200,
    label: "3D Render Engine",
    status: "active" as const,
    size: "lg" as const,
    icon: <Eye className="h-5 w-5 text-foreground" />,
  },
];
const ARCH_CONNECTIONS: CircuitConnection[] = [
  { from: "input", to: "parser", animated: true },
  { from: "parser", to: "syn", animated: true },
  { from: "cache", to: "syn", animated: true, bidirectional: true },
  { from: "syn", to: "render", animated: true },
];
export function OverviewArchitecture() {
  return (
    <section className="relative w-full py-24 md:py-32 bg-background border-b border-border overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-[600px] h-[600px] bg-foreground/5 blur-[120px] rounded-full"></div>
      </div>
      <div className="bento-container">
        <div className="bento-grid lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 order-2 lg:order-1 bento-cell bento-cell-hover relative flex items-center justify-center p-6 md:p-8 overflow-hidden group">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-border transition-colors duration-500 group-hover:border-primary/40"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-border transition-colors duration-500 group-hover:border-primary/40"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-border transition-colors duration-500 group-hover:border-primary/40"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-border transition-colors duration-500 group-hover:border-primary/40"></div>
            <div className="absolute inset-0 blueprint-grid opacity-[0.2]"></div>
            <div className="relative w-full aspect-[3/2] max-w-[600px] flex items-center justify-center z-10">
              <CircuitBoard
                nodes={ARCH_NODES}
                connections={ARCH_CONNECTIONS}
                width={600}
                height={400}
                showGrid={true}
                pulseSpeed={1.8}
                traceWidth={1.5}
                className="w-full h-full text-foreground"
              />
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 bento-cell p-10 md:p-14 flex flex-col justify-center">
            <h2 className="font-sans font-medium text-[32px] md:text-[44px] leading-[1.1] text-foreground tracking-tight mb-6">
              Hardware Synthesis. <br />
              Direct Data Flow.
            </h2>
            <p className="font-sans text-[15px] md:text-[16px] text-muted-foreground leading-relaxed mb-8">
              Acoustic streams are captured and instantly mapped to kinematic coordinate chains.
              Frame sequences are computed through a local synthesizer, feeding high-fidelity bone
              orientations to our specialized 3D GPU rendering thread.
            </p>
            <div className="space-y-4 font-sans">
              <div className="flex gap-4 items-start">
                <span className="flex items-center justify-center w-6 h-6 border border-border bg-secondary/20 text-muted-foreground text-xs font-mono">
                  1
                </span>
                <div>
                  <p className="text-foreground font-medium text-sm">Capture & Tokenize</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Converts acoustic features to sign tokens on the audio hardware thread.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex items-center justify-center w-6 h-6 border border-border bg-secondary/20 text-muted-foreground text-xs font-mono">
                  2
                </span>
                <div>
                  <p className="text-foreground font-medium text-sm">Kinematic Cache Check</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    References local motion indexes for instant, predictive joint matching.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex items-center justify-center w-6 h-6 border border-border bg-secondary/20 text-muted-foreground text-xs font-mono">
                  3
                </span>
                <div>
                  <p className="text-foreground font-medium text-sm">WebGPU Projection</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Renders high-frequency mesh animations in the browser canvas at 60 FPS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
