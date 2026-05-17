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
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Raw text message
      </span>
      <textarea
        value={textDraft}
        onChange={(e) => setTextDraft(e.target.value)}
        disabled={isWorking}
        placeholder="Type the hearing-side message here. The translator will normalize it into a cleaner sign plan."
        className="min-h-44 rounded-2xl border bg-muted px-5 py-5 text-base leading-relaxed outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
      />
    </div>
  );
}
