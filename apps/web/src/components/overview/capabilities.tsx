import { SectionHead } from "./section-head";

export function OverviewCapabilities() {
  const capabilities = [
    {
      tag: "S / Speech",
      headline: "Hear every word.",
      body: "Microphone → Groq Whisper STT → normalized gloss → SignPlan. Under 50 ms median round-trip.",
      items: ["Whisper large-v3 / turbo", "Groq-accelerated inference", "Custom vocabulary hints"],
      viz: "wave",
    },
    {
      tag: "T / Text",
      headline: "Type it, sign it.",
      body: "Typed hearing-side text is normalized into an ASL-aligned gloss sequence with clause segmentation.",
      items: ["Gloss normalization", "Clause & timing metadata", "Planner note per output"],
      viz: "text",
    },
    {
      tag: "V / Vision",
      headline: "Hands on camera.",
      body: "MediaPipe hand landmarks → 6-stage surgical classifier → LinguisticBuffer → SignToken. No server.",
      items: ["WebGPU / WASM worker", "96-letter fingerprint lookup", "Real-time disambiguation"],
      viz: "vision",
    },
    {
      tag: "M / Manual",
      headline: "Direct gloss entry.",
      body: "Compose any gloss or fingerspelled sequence by hand. Useful for demos, QA, and high-precision tasks.",
      items: ["Full ASL alphabet (A–Z)", "Sign boundary markers", "Backspace & clear"],
      viz: "keyboard",
    },
  ];

  return (
    <section className="bg-[var(--paper-card)] border-b border-[var(--rule-soft)] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          num="02 / Capabilities"
          eye="Input → Plan → Render"
          headline={
            <>
              Speak, type, sign, or spell —{" "}
              <span className="italic text-[var(--primary-deep)] font-normal">
                without barriers.
              </span>
            </>
          }
          lede="Ikiraro covers all four ways a person can produce language. On-device vision, Groq STT, and a local-first gloss planner — in one SDK."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 border-t border-[var(--rule)] border-l border-[var(--rule-soft)] mt-0">
          {capabilities.map(({ tag, headline, body, items, viz }) => (
            <div
              key={tag}
              className="flex flex-col p-7 border-r border-b border-[var(--rule-soft)] bg-[var(--paper-card)] transition-colors duration-200 hover:bg-[var(--paper-soft)] group"
            >
              {/* Head */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-mono text-[var(--stone)] tracking-[0.5px]">
                  <strong className="text-[var(--primary)] font-medium">{tag[0]}</strong>
                  {tag.slice(1)}
                </span>
                <div className="w-8 h-8 rounded-full bg-[var(--paper-soft)] border border-[var(--rule-soft)] flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--paper-card)] transition-colors">
                  {viz === "wave" && <WaveIcon />}
                  {viz === "text" && <TextIcon />}
                  {viz === "vision" && <VisionIcon />}
                  {viz === "keyboard" && <KeyboardIcon />}
                </div>
              </div>

              <h3 className="text-[24px] font-sans font-medium tracking-[-0.7px] leading-snug mb-2">
                {headline}
              </h3>
              <p className="text-[14px] leading-relaxed mb-5 text-[var(--slate-text)]">{body}</p>

              {/* Mini visualization */}
              <div className="mb-5 h-14 rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper-soft)] p-2 flex items-end gap-[2px] overflow-hidden group-hover:bg-[var(--paper-card)] transition-colors">
                {viz === "wave" && <WaveViz />}
                {viz === "text" && <TextViz />}
                {viz === "vision" && <VisionViz />}
                {viz === "keyboard" && <KeyboardViz />}
              </div>

              {/* Feature list */}
              <ul className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-[var(--rule-soft)]">
                {items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-[13px] text-[var(--slate-text)]"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--primary)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const WaveIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
    <path d="M19 12a7 7 0 0 0-3-5.8M16 8.2a3.5 3.5 0 0 1 0 7.6" />
  </svg>
);

const TextIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M4 6h16M4 12h10M4 18h12" />
  </svg>
);

const VisionIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const KeyboardIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01M8 15h8" />
  </svg>
);

const WaveViz = () => (
  <>
    {Array.from({ length: 20 }, (_, i) => (
      <span
        key={i}
        className="flex-1 rounded-[1px] bg-gradient-to-b from-[var(--primary)] to-[var(--sunshine-500)] animate-[viz-rise_var(--dur)_ease-in-out_var(--del)_infinite]"
        style={{
          ["--dur" as any]: `${1.2 + (i % 4) * 0.2}s`,
          ["--del" as any]: `${(i * 0.06).toFixed(2)}s`,
          minHeight: "10%",
          maxHeight: "90%",
        }}
      />
    ))}
  </>
);

const TextViz = () => (
  <div className="flex flex-col gap-1 w-full justify-center h-full">
    {["HELLO ██████ ██", "HOW ████ YOU", "SIGN █████"].map((line) => (
      <div key={line} className="text-[10px] font-mono text-[var(--primary)] opacity-70">
        {line}
      </div>
    ))}
  </div>
);

const VisionViz = () => (
  <div className="flex items-center justify-center w-full gap-2">
    {["A", "S", "L"].map((l) => (
      <span
        key={l}
        className="w-7 h-7 flex items-center justify-center text-[16px] font-mono font-semibold bg-[var(--paper-card)] border border-[var(--rule)] text-[var(--primary)] rounded-[2px]"
      >
        {l}
      </span>
    ))}
  </div>
);

const KeyboardViz = () => (
  <div className="grid grid-cols-10 gap-[3px] w-full items-center">
    {Array.from({ length: 26 }, (_, i) => (
      <span
        key={i}
        className={`h-[10px] flex items-center justify-center text-[7px] font-mono rounded-[1px] border border-[var(--rule)] ${
          i % 5 === 2
            ? "bg-[var(--primary)] text-[var(--on-primary)]"
            : "bg-[var(--paper-card)] text-transparent"
        }`}
      >
        {String.fromCharCode(65 + i)}
      </span>
    ))}
  </div>
);
