import { SectionHead } from "./section-head";

export function StatsDeepDive() {
  const stats = [
    {
      pre: "A · Deaf community",
      num: "70",
      sup: "M",
      lbl: "Deaf or hard-of-hearing people in the US — the primary audience for ASL communication tools.",
    },
    {
      pre: "B · Accessibility gap",
      num: "96",
      sup: "%",
      lbl: "Of top websites still fail basic WCAG checks. Sign language support is almost non-existent.",
    },
    {
      pre: "C · Translation speed",
      num: "<50",
      sup: "ms",
      lbl: "End-to-end latency from input to a rendered sign plan in the Ikiraro pipeline.",
    },
    {
      pre: "D · SDK weight",
      num: "38",
      sup: "kb",
      lbl: "Gzipped footprint for the core @ikiraro/sdk. Vision models download only on demand.",
    },
  ];

  return (
    <section className="bg-[var(--paper-soft)] border-b border-[var(--rule-soft)] py-24 relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(50% 80% at 100% 0%, rgba(215,83,31,.06), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 relative">
        <SectionHead
          num="01 / The case"
          headline={
            <>
              ASL is the 4th most-used language in the US.{" "}
              <span className="italic text-[var(--primary-deep)] font-normal">
                Most digital products weren't built for it.
              </span>
            </>
          }
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 border-t border-[var(--rule)] mt-12">
          {stats.map(({ pre, num, sup, lbl }) => (
            <div
              key={pre}
              className="pt-9 pb-4 pr-8 border-b md:border-b-0 border-[var(--rule-soft)] md:border-r last:border-r-0"
            >
              <div className="text-[12px] font-mono text-[var(--stone)] tracking-[0.3px] mb-4">
                {pre}
              </div>
              <div className="text-[68px] font-heading font-medium text-[var(--ink)] tracking-[-4px] leading-none mb-5">
                {num}
                <sup className="align-top ml-1 text-[20px] font-medium text-[var(--primary)] tracking-[-0.5px]">
                  {sup}
                </sup>
              </div>
              <div className="text-[14px] leading-relaxed max-w-56 text-[var(--steel)]">{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
