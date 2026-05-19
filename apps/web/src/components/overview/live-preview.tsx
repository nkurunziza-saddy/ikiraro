export function LivePreview() {
  return (
    <section className="bg-secondary py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          <div>
            <div className="text-muted-foreground uppercase tracking-widest font-bold mb-6 text-[10px]">
              Preview
            </div>
            <h2 className="mb-6 text-[28px] font-bold leading-tight tracking-tight text-foreground">
              Real-time synchronization.
            </h2>
            <p className="text-muted-foreground max-w-sm text-[14px] leading-relaxed">
              Three input paths, one output. Sensa ties them together in a single surface — with a
              full translation history and 3D sign rendering.
            </p>
          </div>

          {/* Signal card simulation */}
          <div className="bg-background border border-border rounded-lg overflow-hidden shadow-sh-2">
            {/* Card header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-foreground h-1.5 w-1.5 rounded-full" />
                <span className="text-foreground text-[12px] font-bold">Sensa</span>
              </div>
              <span className="text-muted-foreground text-[11px] font-medium tracking-wider">
                v0.3
              </span>
            </div>

            {/* Waveform visualization */}
            <div className="border-b border-border flex h-16 items-end gap-[1px] px-6 py-4">
              {Array.from({ length: 48 }, (_, i) => (
                <span
                  key={i}
                  className="bg-muted-foreground/20 flex-1 rounded-sm"
                  style={{
                    height: `${10 + Math.sin(i * 0.5) * 40 + 40}%`,
                  }}
                />
              ))}
            </div>

            {/* Output */}
            <div className="border-b border-border px-6 py-5">
              <span className="text-foreground text-[16px] font-bold tracking-tight uppercase">
                HELLO WORLD HOW ARE YOU
              </span>
            </div>

            {/* Mode labels */}
            <div className="flex gap-6 px-6 py-4">
              {["Speech", "Text", "Vision"].map((mode, i) => (
                <span
                  key={mode}
                  className={`text-[11px] font-bold tracking-wider uppercase transition-colors ${
                    i === 0 ? "text-foreground" : "text-muted-foreground/40"
                  }`}
                >
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
