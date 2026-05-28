import { DottedMap, type Marker } from "@/components/ui/dotted-map";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
const EDGE_NODES: Marker[] = [
  { lat: 37.7749, lng: -122.4194, size: 0.8, pulse: true },
  { lat: 40.7128, lng: -74.006, size: 0.8, pulse: true },
  { lat: 51.5074, lng: -0.1278, size: 0.8, pulse: true },
  { lat: 35.6762, lng: 139.6503, size: 0.8, pulse: true },
  { lat: 1.3521, lng: 103.8198, size: 0.8, pulse: true },
  { lat: -33.8688, lng: 151.2093, size: 0.8, pulse: true },
  { lat: -23.5505, lng: -46.6333, size: 0.8, pulse: true },
  { lat: -1.9403, lng: 29.8739, size: 1.0, pulse: true },
  { lat: -33.9249, lng: 18.4241, size: 0.8, pulse: true },
];
export function OverviewNetwork() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted ? resolvedTheme === "dark" : true;
  return (
    <section className="relative w-full py-24 md:py-32 bg-background border-b border-border overflow-hidden">
      <div className="bento-container">
        <div className="bento-grid lg:grid-cols-12">
          <div className="lg:col-span-5 bento-cell p-10 md:p-14 flex flex-col justify-center">
            <h2 className="font-sans font-medium text-[32px] md:text-[44px] leading-[1.1] text-foreground tracking-tight mb-6">
              On-Device Anywhere. <br />
              Zero Latency.
            </h2>
            <p className="font-sans text-[15px] md:text-[16px] text-muted-foreground leading-relaxed mb-12">
              The Ikiraro engine is compiled to an ultra-lightweight WebAssembly core. It runs
              entirely on the client, utilizing local GPU acceleration without sending voice or
              video data to third-party APIs.
            </p>

            <div className="grid grid-cols-2 gap-px bg-bento-gap border-t border-bento-border -mx-10 md:-mx-14 -mb-10 md:-mb-14 mt-auto">
              <div className="bento-cell p-6 md:p-8">
                <p className="font-mono text-[28px] text-foreground font-semibold">0ms</p>
                <p className="bento-label mt-2">Network Latency</p>
              </div>
              <div className="bento-cell p-6 md:p-8">
                <p className="font-mono text-[28px] text-foreground font-semibold">100%</p>
                <p className="bento-label mt-2">On-Device Privacy</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bento-cell relative overflow-hidden group">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,var(--bento-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--bento-border)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)]"></div>
            <div className="relative z-10 w-full h-full min-h-[400px] flex items-center justify-center">
              <DottedMap
                width={200}
                height={100}
                mapSamples={4000}
                markers={EDGE_NODES}
                dotColor={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}
                markerColor={isDark ? "#ffffff" : "#000000"}
                dotRadius={0.3}
                stagger={true}
                pulse={true}
                className="w-full h-full text-foreground/10 opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-[1.2]"
              />
            </div>

            <div className="absolute bottom-6 left-8 z-10 flex items-center gap-3">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </div>
              <span className="bento-label font-semibold">Active Local Translators</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
