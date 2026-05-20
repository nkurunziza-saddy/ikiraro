import { Link } from "@tanstack/react-router";

const nav = [
  {
    head: "Product",
    links: [
      { label: "Overview", href: "/" as const },
      { label: "Playground", href: "/playground" as const },
      { label: "Documentation", href: "/docs" as const },
    ],
  },
  {
    head: "Documentation",
    links: [
      { label: "@ikiraro/communication", href: "/docs/runtime" as const },
      { label: "@ikiraro/engine", href: "/docs/types" as const },
      { label: "@ikiraro/components", href: "/docs/components" as const },
    ],
  },
  {
    head: "Resources",
    links: [
      { label: "Architecture", href: "/docs/types" as const },
      { label: "Event reference", href: "/docs/events" as const },
      { label: "Hook API", href: "/docs/hooks" as const },
    ],
  },
];

export function OverviewFooter() {
  return (
    <footer className="border-t border-border pt-16 pb-10">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Brand + tagline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-foreground flex h-6 w-6 items-center justify-center rounded-sm shrink-0">
              <span className="text-background text-[10px] font-bold tracking-tighter">S</span>
            </div>
            <span className="text-foreground text-[15px] font-semibold tracking-tight">Sensa</span>
          </Link>
          <p className="text-muted-foreground text-[13px]">
            A local-first SDK for real-time hearing-to-signer communication.
          </p>
        </div>

        {/* Nav columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 pb-12 border-b border-border">
          {nav.map(({ head, links }) => (
            <div key={head}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                {head}
              </p>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-4 pt-8">
          <p className="text-[12px] text-muted-foreground">© 2026 Sensa. Open source under MIT.</p>
          <span className="text-[11px] text-muted-foreground">v0.3.0</span>
        </div>
      </div>
    </footer>
  );
}
