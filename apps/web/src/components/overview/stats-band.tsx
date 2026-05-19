export function StatsBand() {
  const stats = [
    { val: "<50", unit: "ms", lbl: "End-to-end latency" },
    { val: "26", unit: "/ letters", lbl: "ASL fingerspelling" },
    { val: "3", unit: "/ paths", lbl: "Input modes" },
    { val: "0", unit: "/ servers", lbl: "Fully on-device" },
  ];

  return (
    <div className="bg-[var(--paper-card)] border-b border-[var(--rule-soft)]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[var(--rule-soft)]">
          {stats.map(({ val, unit, lbl }, i) => (
            <div
              key={lbl}
              className={`px-8 py-8 flex flex-col justify-between min-h-[130px] border-r border-[var(--rule-soft)] last:border-r-0 ${
                i === 1 ? "md:border-r" : ""
              }`}
            >
              <div className="text-[32px] leading-none font-heading font-medium text-[var(--ink)] tracking-[-1.5px]">
                {val}
                <span className="text-[13px] ml-1.5 font-mono font-medium align-top text-[var(--primary)] tracking-0">
                  {unit}
                </span>
              </div>
              <div className="text-[11px] uppercase font-mono text-[var(--stone)] tracking-[0.4px]">
                {lbl}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
