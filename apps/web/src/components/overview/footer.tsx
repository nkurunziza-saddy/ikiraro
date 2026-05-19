import { Link } from "@tanstack/react-router";

export function OverviewFooter() {
  const sections = [
    {
      head: "Product",
      links: [
        { label: "Interactive Demo", href: "/demo" },
        { label: "Documentation", href: "/" },
      ],
    },
    {
      head: "SDK",
      links: [
        { label: "@ikiraro/sdk", href: "/" },
        { label: "@ikiraro/communication", href: "/" },
        { label: "@ikiraro/engine", href: "/" },
      ],
    },
    {
      head: "Resources",
      links: [
        { label: "Architecture", href: "/" },
        { label: "Data flows", href: "/" },
        { label: "Event system", href: "/" },
      ],
    },
  ];

  return (
    <footer className="bg-[var(--paper-deep)] pt-20 pb-9 border-t border-[#CFC2A0]">
      <div className="mx-auto max-w-7xl px-6">
        {/* Footer top */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-14 pb-9 border-b border-[var(--rule)]">
          <div className="text-[48px] font-sans font-semibold leading-[.9] flex items-center gap-4 tracking-[-2.8px]">
            <div className="flex h-10 w-10 items-center justify-center shrink-0 rounded-[2px] bg-[var(--ink)]">
              <span className="font-mono text-[12px] text-[var(--on-dark)] tracking-[0.5px] font-semibold">
                IK
              </span>
            </div>
            Ikiraro
          </div>
          <p className="text-left md:text-right text-[16px] max-w-xs leading-relaxed text-[var(--charcoal)]">
            A local-first SDK for real-time hearing-to-signer communication.
          </p>
        </div>

        {/* Footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <p className="text-[15px] leading-relaxed italic text-[var(--slate-text)] max-w-[320px]">
              Built to bridge speech and sign — fully in the browser, with no server required for
              vision.
            </p>
          </div>
          {sections.map(({ head, links }) => (
            <div key={head}>
              <h6 className="text-[11px] font-semibold uppercase mb-5 tracking-[2px] text-[var(--steel)]">
                {head}
              </h6>
              <ul className="flex flex-col gap-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href as "/"}
                      className="text-[15px] text-[var(--ink-soft)] transition-colors hover:text-[var(--primary)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer bottom */}
        <div className="flex items-center justify-between flex-wrap gap-4 mt-16 pt-7 border-t border-[var(--rule)]">
          <p className="text-[13px] text-[var(--steel)]">© 2026 Ikiraro. Open source under MIT.</p>
          <span className="text-[12px] font-mono text-[var(--stone)]">v0.3.0</span>
        </div>
      </div>
    </footer>
  );
}
