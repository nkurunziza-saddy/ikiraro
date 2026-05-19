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
      desc: "Groq Llama produces a normalized ASL gloss with clause boundaries, timing, and coarticulation metadata.",
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
    <section className="py-24 border-b border-[var(--rule-soft)]">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          num="03 / Inside Ikiraro"
          eye="How it works"
          headline={
            <>
              Five stages.{" "}
              <span className="italic text-[var(--primary-deep)] font-normal">Under the hood.</span>
            </>
          }
          lede="Everything on the vision path runs in a Web Worker, with zero round-trips. Speech uses Groq's API for sub-50 ms transcription. No screen content ever leaves unless you explicitly configure it."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-7 mt-14">
          {stages.map((card, i) => (
            <div
              key={card.num}
              className="flex flex-col bg-[var(--paper-card)] border border-[var(--rule-soft)] rounded-[3px] p-5.5 relative transition-all duration-200 hover:border-[var(--rule)] hover:translate-y-[-1px] ik-pipe-card"
            >
              <div className="flex justify-between items-center mb-5">
                <span className="text-[10.5px] font-mono text-[var(--stone)] tracking-[0.6px]">
                  {card.num}
                </span>
                <div className="w-7 h-7 rounded-full bg-[var(--paper-soft)] border border-[var(--rule-soft)] flex items-center justify-center text-[var(--primary)]">
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

              <div className="text-[12px] font-semibold uppercase mb-2.5 text-[var(--ink)] tracking-[1.6px]">
                {card.name}
              </div>

              <p className="text-[13px] leading-relaxed mb-auto text-[var(--slate-text)]">
                {card.desc}
              </p>

              <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[var(--rule-soft)] font-mono text-[11px]">
                <span className="uppercase text-[10px] text-[var(--stone)] tracking-[0.4px]">
                  {card.lat}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_0_2px_rgba(200,68,42,0.18)] animate-[live-pulse_1.4s_ease-in-out_infinite]"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                  {card.ms}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline summary */}
        <div className="flex items-center justify-between flex-wrap gap-6 mt-10 px-7 py-5 bg-[var(--ink)] text-[var(--on-dark)] rounded-[3px]">
          <div className="text-[14px] text-white/80">
            <strong className="text-white font-semibold">72 ms</strong>, median. Every step
            on-device or Groq-accelerated. Zero round-trips for vision.
          </div>
          <div className="flex gap-8 font-mono text-[12px]">
            {[
              { lbl: "SDK weight", val: "38 kb" },
              { lbl: "Vision worker", val: "WASM" },
              { lbl: "Server calls", val: "0*" },
            ].map(({ lbl, val }) => (
              <div key={lbl} className="flex flex-col gap-1">
                <span className="text-white/40 text-[10px] tracking-[0.5px] uppercase">{lbl}</span>
                <span className="text-[var(--sunshine-300)] text-[16px] font-medium">{val}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] mt-3 font-mono text-[var(--stone)]">
          * Speech mode sends audio to Groq. Vision and text/manual modes are fully local.
        </p>
      </div>
    </section>
  );
}
