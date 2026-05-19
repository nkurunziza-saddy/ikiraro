import { SectionHead } from "./section-head";

export function StepGuide() {
  const steps = [
    {
      n: "01",
      title: "Install the SDK.",
      body: "npm install @ikiraro/sdk — or import directly from @ikiraro/communication inside your monorepo. No bundler config required.",
    },
    {
      n: "02",
      title: "Configure once.",
      body: "Pass your Groq API key to createIkiraro(). The runtime bootstraps all plugins — session, composition, translation, speech, vision.",
    },
    {
      n: "03",
      title: "Subscribe to output.",
      body: 'Listen on "translation:finished" for the TranslationEnvelope. Pass rendererQueue to SignPlayer3D or your own 3D adapter.',
    },
  ];

  return (
    <section className="py-24 border-b border-[var(--rule-soft)]">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          num="04 / How it works"
          headline="Three steps. Then your users get signed output."
        />

        <div className="grid md:grid-cols-3 border-t border-[var(--rule)]">
          {steps.map(({ n, title, body }, i) => (
            <div
              key={n}
              className={`pt-9 pr-8 pb-0 border-b md:border-b-0 border-[var(--rule-soft)] last:border-b-0 ${
                i < 2 ? "md:border-r" : ""
              }`}
            >
              <span className="inline-block mb-3 px-2.5 py-1.5 text-[12px] font-mono font-medium text-[var(--primary)] border border-[var(--primary)] rounded-[2px] tracking-[1px]">
                {n}
              </span>
              <h4 className="mb-2.5 mt-1.5 text-[22px] font-sans font-medium tracking-[-0.5px]">
                {title}
              </h4>
              <p className="text-[14px] leading-relaxed max-w-xs text-[var(--slate-text)] mb-8 md:mb-0">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
