export function LivePreview() {
  return (
    <section className="bg-[var(--paper-card)] border-y border-[var(--rule-soft)] py-20 overflow-hidden relative">
      {/* Background radial glow */}
      <div
        className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(229,163,92,.12), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5 text-[11px] font-mono text-[var(--steel)] tracking-[0.3px]">
              <span className="text-[var(--primary)] font-medium">/ live</span>
              <span className="w-5 h-px bg-[var(--rule)]" />
              Console preview
            </div>
            <h2 className="text-[36px] leading-tight mb-4 font-sans font-medium tracking-[-1.2px]">
              What Ikiraro does{" "}
              <span className="italic text-[var(--primary-deep)] font-normal">right now.</span>
            </h2>
            <p className="text-[15px] leading-relaxed max-w-sm text-[var(--slate-text)]">
              Three input paths, one output. The console ties them together in a single working
              surface — with a full translation history, live vision feed, and 3D sign rendering.
            </p>
          </div>

          {/* Signal card simulation */}
          <div className="bg-[var(--paper-card)] border border-[var(--rule-soft)] rounded-md shadow-[0_8px_20px_-8px_rgba(24,22,18,0.1),0_2px_4px_rgba(24,22,18,0.04)] overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--rule-soft)] bg-[var(--paper-soft)]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-[live-pulse_1.6s_ease-in-out_infinite]" />
                <span className="text-[12px] font-medium text-[var(--ink)]">
                  Ikiraro
                  <span className="ml-1.5 text-[var(--stone)] font-normal">· translating</span>
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--stone)]">v0.3</span>
            </div>

            {/* Waveform visualization */}
            <div className="flex items-end gap-[2px] px-5 py-4 h-[72px] border-b border-[var(--rule-soft)]">
              {Array.from({ length: 36 }, (_, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-[1px] bg-gradient-to-b from-[var(--primary)] to-[var(--sunshine-500)] animate-[viz-rise_var(--dur)_ease-in-out_var(--del)_infinite]"
                  style={{
                    // These values change per bar, but we can use CSS variables for cleanliness
                    ["--dur" as any]: `${1.2 + (i % 5) * 0.18}s`,
                    ["--del" as any]: `${(i * 0.04).toFixed(2)}s`,
                    minHeight: "10%",
                    maxHeight: "90%",
                  }}
                />
              ))}
            </div>

            {/* Gloss output */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--rule-soft)]">
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-[var(--primary)] text-[var(--on-primary)] rounded-[2px] font-mono tracking-[1px]">
                GL
              </span>
              <span className="text-[14px] font-mono text-[var(--ink)] uppercase">
                HELLO WORLD HOW YOU{" "}
                <span className="inline-block w-[2px] h-[1em] align-middle bg-[var(--primary)] animate-[live-pulse_1s_ease-in-out_infinite]" />
              </span>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2 px-5 py-4 flex-wrap">
              {[
                { mode: "Speech", active: true },
                { mode: "Text", active: false },
                { mode: "Vision", active: false },
                { mode: "Manual", active: false },
              ].map(({ mode, active }) => (
                <span
                  key={mode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full font-mono tracking-[0.3px] border transition-colors ${
                    active
                      ? "bg-[var(--ink)] text-[var(--on-dark)] border-[var(--ink)]"
                      : "text-[var(--steel)] border-[var(--rule-soft)]"
                  }`}
                >
                  {active && <span className="w-[5px] h-[5px] rounded-full bg-[var(--primary)]" />}
                  {mode}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
