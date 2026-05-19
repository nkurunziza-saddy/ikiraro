export function StatsBand() {
  const stats = [
    { val: "<50", unit: "ms", lbl: "Latency" },
    { val: "26", unit: "chars", lbl: "Fingerspelling" },
    { val: "3", unit: "modes", lbl: "Input Paths" },
    { val: "0", unit: "srv", lbl: "On-device" },
  ];

  return (
    <div className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
          {stats.map(({ val, unit, lbl }) => (
            <div key={lbl} className="flex flex-col gap-1.5">
              <div className="text-[32px] font-bold text-foreground tracking-tight">
                {val}
                <span className="text-[12px] ml-1 font-bold text-muted-foreground uppercase tracking-widest">
                  {unit}
                </span>
              </div>
              <div className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                {lbl}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
