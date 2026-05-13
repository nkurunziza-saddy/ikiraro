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
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">
        Raw text
      </span>
      <textarea
        value={textDraft}
        onChange={(e) => setTextDraft(e.target.value)}
        disabled={isWorking}
        placeholder="Type the hearing-side message here. The semantic planner will normalize it into a sign plan."
        className="min-h-44 rounded-[1.5rem] border border-stone-800 bg-stone-900 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-stone-500 focus:border-white disabled:opacity-50"
      />
    </div>
  );
}
