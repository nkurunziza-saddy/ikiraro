import { Link } from "@tanstack/react-router";

export function OverviewHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-20 pb-28">
      <div className="max-w-5xl">
        <div className="inline-flex items-center gap-3 mb-7 text-[11px] font-mono text-[var(--steel)] tracking-[0.5px]">
          <span className="text-[var(--primary)] font-medium">00</span>
          <span className="w-5 h-px bg-[var(--rule)]" />
          Local-first ASL SDK · Browser-native
        </div>

        <h1
          className="leading-[1.01] mb-7 text-balance font-sans font-medium text-[clamp(52px,7vw,80px)] tracking-[-3px] max-w-[18ch]"
          style={{ fontFeatureSettings: "'ss01', 'cv11'" }}
        >
          Speech &amp; sign.{" "}
          <span className="italic text-[var(--primary-deep)] font-normal">
            Understood together.
          </span>
        </h1>

        <p className="text-[17px] leading-relaxed mb-10 max-w-2xl text-[var(--slate-text)]">
          Ikiraro is a local-first browser SDK that converts speech, typed text, and ASL
          fingerspelling into synchronized 3D sign animation — all in the browser, with no server
          required.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-12">
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-[14px] font-medium transition-all bg-[var(--primary)] text-[var(--on-primary)] rounded-[3px] shadow-[0_1px_0_var(--primary-deep),0_6px_14px_-4px_rgba(180,61,17,0.35)] hover:translate-y-[-1px] active:translate-y-[1px]"
          >
            Launch the demo
          </Link>
          <a
            href="https://github.com"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-[14px] transition-all bg-transparent text-[var(--ink)] rounded-[3px] border border-[var(--rule)] hover:border-[var(--ink)]"
          >
            Read the docs →
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-8 text-[13px] text-[var(--steel)]">
          {["Open source", "Zero backend required", "TypeScript SDK", "WebGPU / WASM"].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[var(--primary)]" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
