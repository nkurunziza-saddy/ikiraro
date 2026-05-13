import { Link } from "@tanstack/react-router";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-800 bg-black">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-700 bg-stone-950 text-white">
              <HugeiconsIcon icon={SparklesIcon} size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Sensa</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="relative rounded-full px-4 py-2 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-900 hover:text-white"
                activeProps={{
                  className: "bg-stone-900 font-semibold text-white hover:bg-stone-900",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
