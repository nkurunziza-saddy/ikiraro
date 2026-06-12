import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/" as const, label: "What it is", exact: true },
  { to: "/playground" as const, label: "Playground", exact: false },
  { to: "/docs" as const, label: "Docs", exact: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="max-w-[440px] mx-auto px-3 py-2 flex gap-1">
        {LINKS.map(({ to, label, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={exact ? { exact: true } : undefined}
            className="text-[12.5px] font-normal px-3.5 py-[5px] rounded-full border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-[180ms] letter-spacing-[0.01em]"
            activeProps={{
              className:
                "text-[12.5px] font-medium px-3.5 py-[5px] rounded-full border border-border bg-card text-foreground transition-all duration-[180ms]",
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
