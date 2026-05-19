import { Link } from "@tanstack/react-router";

export function FinalCTA() {
  const benefits = ["Open source", "No credit card", "Local-first vision"];

  return (
    <div className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative px-16 py-28 text-center overflow-hidden bg-[var(--paper-soft)] border border-[var(--rule)] rounded-md">
          {/* Decorative background glows */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background: `
                radial-gradient(40% 80% at 50% 0%, rgba(215,83,31,0.1), transparent 60%),
                radial-gradient(50% 60% at 0% 100%, rgba(230,181,50,0.14), transparent 60%)
              `,
            }}
          />

          <div className="relative flex justify-center items-center gap-4 mb-9 text-[12px] font-mono text-[var(--steel)]">
            <span className="w-12 h-px bg-[var(--rule)]" />/ begin /
            <span className="w-12 h-px bg-[var(--rule)]" />
          </div>

          <h2 className="relative mx-auto mb-6 text-[56px] font-sans font-medium tracking-[-2.6px] leading-[1.02] max-w-[17ch]">
            The next translation happens{" "}
            <span className="italic text-[var(--primary-deep)] font-normal">in the browser.</span>
          </h2>

          <p className="relative mx-auto text-[16px] leading-relaxed mb-9 max-w-md text-[var(--slate-text)]">
            Install the SDK and run your first sign plan in under a minute.
          </p>

          <div className="relative flex justify-center items-center gap-4 flex-wrap">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[14px] font-medium transition-all bg-[var(--ink)] text-[var(--on-dark)] rounded-[3px] hover:bg-[var(--ink-soft)]"
            >
              Experience the demo
            </Link>
            <a
              href="https://github.com"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[14px] transition-all bg-[var(--paper-card)] text-[var(--ink)] rounded-[3px] border border-[var(--rule)] hover:border-[var(--ink)]"
            >
              Documentation →
            </a>
          </div>

          <div className="relative flex justify-center gap-8 mt-8 text-[13px] flex-wrap text-[var(--steel)]">
            {benefits.map((t) => (
              <span key={t} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F8F45] shadow-[0_0_0_3px_rgba(79,143,69,0.16)]" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
