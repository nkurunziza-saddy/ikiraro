export function SectionHead({
  num,
  eye,
  headline,
  lede,
  centered,
}: {
  num: string;
  eye?: string;
  headline: React.ReactNode;
  lede?: string;
  centered?: boolean;
}) {
  if (centered) {
    return (
      <div className="mb-14 text-center flex flex-col items-center gap-4">
        <span className="text-[32px] font-mono font-medium text-[var(--primary)] tracking-[-0.5px]">
          {num}
        </span>
        <h2 className="text-[40px] leading-[1.06] max-w-3xl font-sans font-medium tracking-[-1.4px]">
          {headline}
        </h2>
        {lede && (
          <p className="text-[16px] leading-relaxed max-w-xl text-[var(--slate-text)]">{lede}</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[80px_1fr] gap-8 mb-14">
      <span className="pt-1 text-[13px] font-mono font-medium text-[var(--primary)] tracking-[1px]">
        {num}
      </span>
      <div className="flex flex-col gap-3">
        {eye && (
          <div className="flex items-center gap-4 text-[12px] font-mono text-[var(--steel)] tracking-[0.3px]">
            {eye}
            <span className="flex-1 h-px max-w-48 bg-[var(--rule)]" />
          </div>
        )}
        <h2 className="text-[40px] leading-[1.06] max-w-3xl font-sans font-medium tracking-[-1.4px]">
          {headline}
        </h2>
        {lede && (
          <p className="text-[16px] leading-relaxed max-w-xl mt-1 text-[var(--slate-text)]">
            {lede}
          </p>
        )}
      </div>
    </div>
  );
}
