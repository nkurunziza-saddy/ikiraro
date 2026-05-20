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
    <div className="flex flex-col gap-4">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.05em] uppercase">
        Hearing-side message
      </span>
      <textarea
        value={textDraft}
        onChange={(e) => setTextDraft(e.target.value)}
        disabled={isWorking}
        placeholder="Enter hearing-side message…"
        className="text-foreground border-border w-full min-h-[120px] resize-none border-b pb-6 text-[14px] leading-relaxed outline-none transition-all disabled:opacity-50 bg-transparent"
      />
    </div>
  );
}
