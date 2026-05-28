"use client";
import { PixelBackground } from "@/components/ui/pixel";

export function OverviewFeaturesGrid() {
  return (
    <section className="bg-background py-24 md:py-32 border-b border-border">
      <div className="bento-container">
        <div className="max-w-[800px] mb-20">
          <h2 className="text-title mb-6">Built for the Edge.</h2>
          <p className="text-subhero max-w-[600px]">
            Ikiraro brings advanced machine learning to local devices with unparalleled performance
            and absolute data sovereignty.
          </p>
        </div>

        <div className="bento-grid md:grid-cols-12">
          {/* Main Block */}
          <div className="md:col-span-8 bento-cell bento-cell-hover p-12 md:p-16 flex flex-col justify-between cursor-crosshair relative overflow-hidden group">
            <PixelBackground
              className="absolute inset-0 z-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700"
              pattern="cursor"
              gap={2}
              size={10}
              speed={0.5}
              darkColors="var(--primary)"
            />
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start mb-16 relative z-10 pointer-events-none">
              <div className="sm:col-span-12">
                <h3 className="text-[28px] font-bold tracking-tight text-foreground mb-6 uppercase">
                  Local Inference Engine
                </h3>
                <p className="text-[17px] text-secondary-foreground leading-relaxed">
                  Run massive models directly on hardware without needing constant cloud connection.
                  By executing LLM planning and WebGL rendering in the same thread, data stays
                  strictly local and latency approaches zero.
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Block */}
          <div className="md:col-span-4 bento-cell bento-cell-hover p-12 flex flex-col justify-between cursor-crosshair relative overflow-hidden group">
            <PixelBackground
              className="absolute inset-0 z-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700"
              pattern="random"
              gap={2}
              size={10}
              speed={0.5}
              darkColors="var(--primary)"
            />
            <div className="mb-8 relative z-10 pointer-events-none">
              <h3 className="text-[22px] font-bold text-foreground mb-6 uppercase">
                Zero Trust Privacy
              </h3>
              <p className="text-[16px] text-secondary-foreground leading-relaxed">
                Hand tracking and 3D rendering never leave the browser. End-to-end encryption with
                rotating keys for all matrix data. Strict hardware-level isolation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
