import { Link } from "@tanstack/react-router";

export function DeveloperCTA() {
  return (
    <section className="bg-[var(--paper-soft)] border-b border-[var(--rule-soft)] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-[1fr,1.2fr] gap-20 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5 text-[11px] font-mono text-[var(--steel)] tracking-[0.3px]">
              <span className="text-[var(--primary)] font-medium">05 / For developers</span>
              <span className="w-5 h-px bg-[var(--rule)]" />
              <span>@ikiraro/sdk · 38 kb</span>
            </div>
            <h2 className="text-[40px] font-sans font-medium tracking-[-1.6px] leading-[1.06] mb-5">
              One import.{" "}
              <span className="italic text-[var(--primary-deep)] font-normal">Zero refactors.</span>
            </h2>
            <p className="text-[16px] leading-relaxed max-w-md mb-8 text-[var(--slate-text)]">
              Ikiraro runs entirely client-side. The SDK ships only what each user needs — the
              vision worker downloads on demand. Average bundle impact: 38 kb gzipped.
            </p>
            <div className="flex gap-3">
              <Link
                to="/demo"
                className="inline-flex items-center px-5 py-2.5 text-[13px] font-medium transition-all bg-[var(--ink)] text-[var(--on-dark)] rounded-[3px] hover:bg-[var(--ink-soft)]"
              >
                Interactive Demo →
              </Link>
              <a
                href="https://github.com"
                className="inline-flex items-center px-5 py-2.5 text-[13px] transition-all bg-transparent text-[var(--ink)] rounded-[3px] border border-[var(--rule)] hover:border-[var(--ink)]"
              >
                View source →
              </a>
            </div>
          </div>

          {/* Code frame */}
          <div className="bg-[#1A1812] rounded-md overflow-hidden shadow-[0_8px_20px_-8px_rgba(24,22,18,0.2),0_2px_4px_rgba(24,22,18,0.08)] border border-[#2A2620]">
            <div className="flex items-center gap-3 px-5 py-3 bg-[#14110D] border-b border-white/5 font-mono text-[12px] text-white/50">
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#3a342a]" />
                ))}
              </div>
              <span className="px-2.5 py-1 bg-white/5 text-white/80 rounded-[2px] text-[11.5px]">
                your-app.ts
              </span>
            </div>
            <pre className="m-0 px-6 py-6 text-[13.5px] leading-relaxed overflow-x-auto font-mono text-[var(--on-dark)]">
              {`\x1b[38;5;177mimport\x1b[0m { \x1b[38;5;117mcreateIkiraro\x1b[0m, \x1b[38;5;117mSignPlayer3D\x1b[0m }
  \x1b[38;5;177mfrom\x1b[0m \x1b[38;5;221m"@ikiraro/sdk"\x1b[0m;

\x1b[38;5;246m// Bootstrap the runtime\x1b[0m
\x1b[38;5;177mconst\x1b[0m runtime = \x1b[38;5;177mawait\x1b[0m \x1b[38;5;117mcreateIkiraro\x1b[0m({
  sdk: { groqApiKey: \x1b[38;5;221m"gsk_..."\x1b[0m },
});

\x1b[38;5;246m// Listen for sign plan output\x1b[0m
runtime.\x1b[38;5;117msubscribe\x1b[0m(\x1b[38;5;221m"translation:finished"\x1b[0m, (e) => {
  \x1b[38;5;177mconst\x1b[0m { plan, rendererQueue } = e.payload;
  \x1b[38;5;246m// → pass to your 3D renderer\x1b[0m
});`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
