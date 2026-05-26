import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ui/theme-toggle";
const nav = [
  {
    head: "Product",
    links: [
      { label: "Overview", href: "/" },
      { label: "Playground", href: "/playground" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    head: "Architecture",
    links: [
      { label: "Runtime", href: "/docs/runtime" },
      { label: "Engine", href: "/docs/engine" },
      { label: "Renderer", href: "/docs/renderer" },
    ],
  },
  {
    head: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Research", href: "/research" },
      { label: "Contact", href: "/contact" },
    ],
  },
];
export function OverviewFooter() {
  return (
    <footer className="relative w-full bg-background pt-[120px] pb-12 border-t border-border">
      <div className="bento-container">
        <div className="bento-grid md:grid-cols-12 mb-12">
          <div className="md:col-span-4 bento-cell p-10 md:p-12 relative overflow-hidden group">
            <div className="absolute inset-0 blueprint-grid opacity-[0.1] pointer-events-none"></div>
            <div className="relative z-10">
              <Link
                to="/"
                className="font-semibold tracking-tight text-[22px] text-foreground flex items-center gap-3 mb-6 w-fit"
              >
                Sensa
              </Link>
              <p className="text-[14px] text-secondary-foreground max-w-[240px] leading-relaxed mb-12">
                Translating human intention into physical motion. Built for the edge.
              </p>
              <div className="flex items-center gap-3 bento-label">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34d399]"></span>
                </span>
                All Systems Nominal
              </div>
            </div>
          </div>

          <div className="md:col-span-8 bento-grid grid-cols-2 md:grid-cols-3 border-none">
            {nav.map(({ head, links }) => (
              <div key={head} className="flex flex-col bento-cell bento-cell-hover p-10 md:p-12">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold mb-6">
                  {head}
                </h4>
                <ul className="flex flex-col gap-4">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        to={href}
                        className="text-[14px] text-secondary-foreground hover:text-foreground transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between text-[12px] text-muted-foreground font-mono uppercase tracking-widest">
          <p>Sensa Inc. © 2026</p>
          <div className="flex items-center gap-8 mt-6 md:mt-0">
            <ThemeToggle />
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
