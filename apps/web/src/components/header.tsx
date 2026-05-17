import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

export default function Header() {
  const links = [
    { to: "/", label: "Overview" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-md px-6 py-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm">
              <HugeiconsIcon icon={SparklesIcon} size={16} />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/80">
              Sensa Bridge
            </p>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors hover:text-foreground"
                activeProps={{
                  className: "text-primary/80 underline underline-offset-8",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
