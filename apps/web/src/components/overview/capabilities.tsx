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
    <section className="py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <SectionHead
          num="Capabilities"
          headline={
            <>
              Speak, type, sign, or spell.{" "}
              <span className="text-muted-foreground font-normal">Without barriers.</span>
            </>
          }
          lede="Ikiraro covers all four ways a person can produce language. On-device vision, Groq STT, and a local-first gloss planner in one SDK."
        />

        <div className="border-border mt-0 grid border-l border-t md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ tag, headline, body, items, viz }) => (
            <div
              key={tag}
              className="bg-background border-border group flex flex-col p-7 transition-colors duration-200 border-b border-r hover:bg-secondary"
            >
              {/* Head */}
              <div className="mb-5 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px] tracking-[0.5px]">
                  <strong className="text-foreground font-medium">{tag[0]}</strong>
                  {tag.slice(1)}
                </span>
                <div className="bg-secondary border-border text-foreground group-hover:bg-background flex size-8 items-center justify-center rounded-full border transition-colors">
                  {viz === "wave" && <WaveIcon />}
                  {viz === "text" && <TextIcon />}
                  {viz === "vision" && <VisionIcon />}
                  {viz === "keyboard" && <KeyboardIcon />}
                </div>
              </div>

              <h3 className="mb-2 text-[20px] font-semibold leading-snug tracking-tight">
                {headline}
              </h3>
              <p className="text-muted-foreground mb-5 text-[14px] leading-relaxed">{body}</p>

              {/* Mini visualization */}
              <div className="border-border bg-secondary rounded-sm group-hover:bg-background mb-5 flex h-14 items-end gap-[2px] overflow-hidden border p-2 transition-colors">
                {viz === "wave" && <WaveViz />}
                {viz === "text" && <TextViz />}
                {viz === "vision" && <VisionViz />}
                {viz === "keyboard" && <KeyboardViz />}
              </div>

              {/* Feature list */}
              <ul className="border-border mt-auto flex flex-col gap-2.5 border-t pt-4">
                {items.map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground flex items-center gap-2.5 text-[13px]"
                  >
                    <span className="bg-foreground h-1 w-1 shrink-0 rounded-full" />
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
        className="bg-foreground flex-1 rounded-[1px] animate-[viz-rise_var(--dur)_ease-in-out_var(--del)_infinite]"
        style={{
          ["--dur" as any]: `${1.2 + (i % 4) * 0.2}s`,
          ["--del" as any]: `${(i * 0.06).toFixed(2)}s`,
          minHeight: "10%",
          maxHeight: "90%",
          opacity: 0.6,
        }}
      />
    ))}
  </>
);

const TextViz = () => (
  <div className="flex h-full w-full flex-col justify-center gap-1">
    {["HELLO ██████ ██", "HOW ████ YOU", "SIGN █████"].map((line) => (
      <div key={line} className="text-foreground font-mono text-[10px] opacity-50">
        {line}
      </div>
    ))}
  </div>
);

const VisionViz = () => (
  <div className="flex w-full items-center justify-center gap-2">
    {["A", "S", "L"].map((l) => (
      <span
        key={l}
        className="bg-background border-border text-foreground flex size-7 items-center justify-center rounded-sm border font-mono text-[16px] font-semibold"
      >
        {l}
      </span>
    ))}
  </div>
);

const KeyboardViz = () => (
  <div className="grid w-full grid-cols-10 items-center gap-[3px]">
    {Array.from({ length: 26 }, (_, i) => (
      <span
        key={i}
        className={`flex h-[10px] items-center justify-center rounded-[1px] border border-border font-mono text-[7px] ${
          i % 5 === 2 ? "bg-foreground text-background" : "bg-background text-transparent"
        }`}
      >
        {String.fromCharCode(65 + i)}
      </span>
    ))}
  </div>
);
