import { SectionHead } from "./section-head";

export function OverviewFAQ() {
  const faqs = [
    {
      n: "01",
      q: "Does Ikiraro send my audio to a server?",
      a: "Speech mode sends audio to Groq's API for Whisper transcription — this is disclosed and configurable. Vision (fingerspelling), text, and manual modes are fully on-device. No hand landmarks or camera frames ever leave the browser.",
    },
    {
      n: "02",
      q: "What ASL signs does it support?",
      a: "Full fingerspelling (A–Z, 0–9) via the vision classifier. For lexeme signs, the Groq planner produces gloss tokens that match entries in the GLOSS_REGISTRY. The registry is small today and designed to be extended — one entry per gloss with duration metadata.",
    },
    {
      n: "03",
      q: "Can I use the SDK without the 3D avatar?",
      a: "Yes. The SignPlan and RendererDirector are fully decoupled from the UI. Supply your own adapter to SignCanvas and drive it with FrameItem[] however you like. The @ikiraro/components package is optional.",
    },
    {
      n: "04",
      q: "How does fingerspelling work without a server?",
      a: "MediaPipe runs on WebGPU (GPU delegate) or WASM in a dedicated Web Worker. The IkiraroSurgicalClassifier uses fingerprint lookup tables built from hand geometry — no ML model weights are downloaded at runtime.",
    },
    {
      n: "05",
      q: "Is this production-ready?",
      a: "Ikiraro is a developer SDK in active development (v0.3). The core architecture — EventBus, plugin system, SignPlan IR, LinguisticBuffer — is stable. The gloss registry and 3D avatar are still growing. Use it for demos, research, and integrations. Do not deploy for critical accessibility needs without thorough testing.",
    },
  ];

  return (
    <section className="py-24 border-b border-[var(--rule-soft)]">
      <div className="mx-auto max-w-[880px] px-12">
        <SectionHead num="06" headline="Answered honestly." centered />

        <div className="mt-12">
          {faqs.map(({ n, q, a }, i) => (
            <details
              key={n}
              className="group border-b border-[var(--rule-soft)] py-6 first:border-t"
              open={i === 0}
            >
              <summary className="flex items-center gap-4 cursor-pointer list-none outline-none">
                <span className="shrink-0 text-[12px] font-mono font-medium w-9 text-[var(--primary)]">
                  {n}
                </span>
                <span className="flex-1 text-[19px] font-sans font-medium tracking-[-0.5px] text-[var(--ink)]">
                  {q}
                </span>
                <svg
                  className="shrink-0 text-[var(--stone)] transition-transform duration-200 group-open:rotate-45"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="mt-3 text-[16px] leading-relaxed text-[var(--slate-text)] ml-[52px] max-w-[640px]">
                {a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
