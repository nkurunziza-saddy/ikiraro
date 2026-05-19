import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/sdk")({
  component: SdkLayout,
});

const NAV = [
  {
    group: "Getting Started",
    items: [{ label: "Overview", to: "/sdk" as const, exact: true }],
  },
  {
    group: "API Reference",
    items: [
      { label: "useIkiraro", to: "/sdk/hooks" as const, exact: false },
      { label: "useHandTracking", to: "/sdk/vision" as const, exact: false },
    ],
  },
  {
    group: "Components",
    items: [{ label: "UI Components", to: "/sdk/components" as const, exact: false }],
  },
  {
    group: "Advanced",
    items: [
      { label: "Runtime API", to: "/sdk/runtime" as const, exact: false },
      { label: "Event Reference", to: "/sdk/events" as const, exact: false },
      { label: "Key Types", to: "/sdk/types" as const, exact: false },
    ],
  },
];

function SdkLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex gap-12 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:block w-44 shrink-0 sticky top-24 self-start">
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-foreground text-background rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest">
                SDK
              </span>
              <span className="text-muted-foreground font-mono text-[10px]">v0.3.1</span>
            </div>

            <nav className="flex flex-col gap-5">
              {NAV.map(({ group, items }) => (
                <div key={group}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50 mb-2">
                    {group}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {items.map(({ label, to, exact }) => {
                      const active = exact ? pathname === to : pathname.startsWith(to);
                      return (
                        <Link
                          key={to}
                          to={to}
                          className={`text-[12px] py-1 px-2 rounded transition-colors ${
                            active
                              ? "text-foreground bg-secondary font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-border">
              <Link
                to="/"
                className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                ← Home
              </Link>
            </div>
          </aside>

          {/* Page content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
