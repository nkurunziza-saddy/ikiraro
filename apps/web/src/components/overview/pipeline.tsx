import { SectionHead } from "./section-head";

export function OverviewPipeline() {
  const stages = [
    {
      num: "01",
      name: "Input",
      desc: "Voice via mic, typed text, or hand landmarks from the camera — Ikiraro accepts all three simultaneously.",
      lat: "Capture",
      ms: "~5 ms",
      icon: <path d="M9 3h6v11a3 3 0 0 1-6 0V3zM19 11a7 7 0 0 1-14 0M12 18v3" />,
    },
    {
      num: "02",
      name: "Classify",
      desc: "The surgical classifier runs a 6-stage pipeline on MediaPipe landmarks: gating, fingerprint lookup, confidence scoring.",
      lat: "Vision",
      ms: "~12 ms",
      icon: (
        <>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </>
      ),
    },
    {
      num: "03",
      name: "Plan",
      desc: "Groq Llama produces a normalized ASL gloss with clause boundaries, timing, and coarticulation blending.",
      lat: "Inference",
      ms: "~38 ms",
      icon: (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4" />
        </>
      ),
    },
    {
      num: "04",
      name: "Render",
      desc: "RendererDirector advances through FrameItem[] with coarticulation blending between each sign.",
      lat: "Frame",
      ms: "~3 ms",
      icon: <path d="M12 2 4 7v6c0 4.5 3 8 8 9 5-1 8-4.5 8-9V7l-8-5z" />,
    },
    {
      num: "05",
      name: "Output",
      desc: "The 3D hand animation plays synchronized to the SignPlan. TTS optionally reads the gloss text aloud.",
      lat: "Synthesis",
      ms: "~14 ms",
      icon: (
        <>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
          <path d="M19 12a7 7 0 0 0-3-5.8" />
        </>
      ),
    },
  ];

  return (
    <section className="py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <SectionHead
          num="03 / Inside Ikiraro"
          headline={
            <>
              Five stages.{" "}
              <span className="text-muted-foreground font-normal">Under the hood.</span>
            </>
          }
          lede="Everything on the vision path runs in a Web Worker, with zero round-trips. Speech uses Groq's API for sub-50 ms transcription. No screen content ever leaves unless you explicitly configure it."
        />

        <div className="mt-14 grid grid-cols-1 gap-7 md:grid-cols-3 lg:grid-cols-5">
          {stages.map((card, i) => (
            <div
              key={card.num}
              className="border-border relative flex flex-col rounded border p-5 transition-all duration-200 hover:border-foreground/30 hover:-translate-y-px"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-muted-foreground text-[10.5px] tracking-[0.6px]">
                  {card.num}
                </span>
                <div className="bg-secondary border-border text-foreground flex size-7 items-center justify-center rounded-full border">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {card.icon}
                  </svg>
                </div>
              </div>

              <div className="text-foreground mb-2.5 text-[12px] font-semibold uppercase tracking-[1.6px]">
                {card.name}
              </div>

              <p className="text-muted-foreground mb-auto text-[13px] leading-relaxed">
                {card.desc}
              </p>

              <div className="border-border mt-4 flex items-center justify-between border-t pt-3.5 font-mono text-[11px]">
                <span className="text-muted-foreground uppercase text-[10px] tracking-[0.4px]">
                  {card.lat}
                </span>
                <span className="text-foreground flex items-center gap-1.5 font-medium">
                  <span
                    className="bg-foreground animate-[live-pulse_1.4s_ease-in-out_infinite] h-1.5 w-1.5 rounded-full"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                  {card.ms}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline summary */}
        <div className="bg-foreground text-background mt-10 flex flex-wrap items-center justify-between gap-6 rounded px-7 py-5">
          <div className="text-background/80 text-[14px]">
            <strong className="font-semibold text-background">72 ms</strong>, median. Every step
            on-device or Groq-accelerated. Zero round-trips for vision.
          </div>
          <div className="flex gap-8 text-[12px]">
            {[
              { lbl: "SDK weight", val: "38 kb" },
              { lbl: "Vision worker", val: "WASM" },
              { lbl: "Server calls", val: "0*" },
            ].map(({ lbl, val }) => (
              <div key={lbl} className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.5px] text-background/40">
                  {lbl}
                </span>
                <span className="text-background/70 text-[16px] font-medium">{val}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground mt-3 font-mono text-[11px]">
          * Speech mode sends audio to Groq. Vision and text/manual modes are fully local.
        </p>
      </div>
    </section>
  );
}
