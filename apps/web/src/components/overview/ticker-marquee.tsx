const TICKER_ITEMS = [
  { action: "Translating speech to ASL gloss", who: "Speech mode", tag: "active" },
  { action: "Fingerspelling H-E-L-L-O", who: "Vision mode", tag: "WebGPU" },
  { action: "Groq Whisper transcription", who: "Text mode", tag: "<50 ms" },
  { action: "RendererDirector advancing frame", who: "3D output", tag: "SignPlan" },
  { action: "LinguisticBuffer committed word", who: "Classifier", tag: "ASL" },
  { action: "EventBus dispatched translation", who: "Runtime", tag: "v0.3" },
  { action: "MediaPipe landmarks streamed", who: "Worker", tag: "60 fps" },
  { action: "Plugin lifecycle: setup complete", who: "IkiraroRuntime", tag: "plugin" },
];

export function TickerMarquee() {
  return (
    <div className="ik-ticker">
      <div className="ik-ticker-track">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <div key={i} className="flex items-center gap-12">
            <span className="inline-flex items-center gap-3 text-[14px] shrink-0 text-white/80">
              <span className="w-2 h-2 rounded-full shrink-0 bg-[var(--primary)] shadow-[0_0_0_3px_rgba(200,68,42,0.18)]" />
              <span className="text-[var(--on-dark)]">{item.action}</span>
              <span className="text-white/50 italic">— {item.who}</span>
              <span className="px-2 py-0.5 text-[10.5px] font-mono bg-white/10 text-[var(--sunshine-300)] rounded-[3px] border border-white/5 tracking-[0.4px]">
                {item.tag}
              </span>
            </span>
            <span className="text-white/20 font-mono text-[12px]">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}
