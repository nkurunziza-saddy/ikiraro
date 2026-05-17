import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Overview" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-border/70 bg-background/75 px-3 py-3 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="group flex items-center gap-3 rounded-full px-2 py-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/12 text-primary transition-transform duration-200 ease-out group-hover:scale-[1.02]">
              <HugeiconsIcon icon={SparklesIcon} size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">Sensa Bridge</p>
              <p className="hidden text-[11px] tracking-[0.2em] text-muted-foreground uppercase sm:block">
                Translation Console
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                activeProps={{
                  className:
                    "bg-muted/70 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
