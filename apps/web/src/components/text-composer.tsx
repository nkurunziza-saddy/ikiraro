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
      <span className="font-mono text-stone text-[10px] tracking-[0.3px]">
        Hearing-side message
      </span>
      <textarea
        value={textDraft}
        onChange={(e) => setTextDraft(e.target.value)}
        disabled={isWorking}
        placeholder="Enter hearing-side message…"
        className="text-ink border-rule-soft w-full min-h-[120px] resize-none border-b pb-6 text-[18px] leading-relaxed outline-none transition-all disabled:opacity-50 bg-transparent"
      />
    </div>
  );
}
