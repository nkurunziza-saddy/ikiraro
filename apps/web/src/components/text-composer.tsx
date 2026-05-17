export function TextComposer({
  textDraft,
  setTextDraft,
  isWorking,
}: {
  textDraft: string;
  setTextDraft: (text: string) => void;
  isWorking: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        Typed Input
      </span>
      <textarea
        value={textDraft}
        onChange={(e) => setTextDraft(e.target.value)}
        disabled={isWorking}
        placeholder="Enter hearing-side message..."
        className="min-h-32 w-full bg-transparent text-lg leading-relaxed outline-none transition-all placeholder:text-muted-foreground/20 focus:border-primary border-b border-border/30 pb-6 disabled:opacity-50"
      />
    </div>
  );
}
