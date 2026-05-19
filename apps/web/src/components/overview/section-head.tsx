export function SectionHead({
  num,
  headline,
  lede,
}: {
  num: string;
  headline: React.ReactNode;
  lede?: string;
}) {
  return (
    <div className="mb-10">
      <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-5">
        {num}
      </div>
      <h2 className="text-[28px] font-bold leading-tight tracking-tight text-foreground mb-4">
        {headline}
      </h2>
      {lede && <p className="text-muted-foreground text-[14px] leading-relaxed max-w-lg">{lede}</p>}
    </div>
  );
}
