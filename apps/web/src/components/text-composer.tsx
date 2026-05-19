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
      <span
        className="text-[10px]"
        style={{ fontFamily: "var(--font-mono)", color: "var(--stone)", letterSpacing: "0.3px" }}
      >
        Hearing-side message
      </span>
      <textarea
        value={textDraft}
        onChange={(e) => setTextDraft(e.target.value)}
        disabled={isWorking}
        placeholder="Enter hearing-side message…"
        className="w-full text-[18px] leading-relaxed outline-none resize-none pb-6 transition-all disabled:opacity-50"
        style={{
          background: "transparent",
          color: "var(--ink)",
          borderBottom: "1px solid var(--rule-soft)",
          minHeight: "120px",
        }}
      />
    </div>
  );
}
