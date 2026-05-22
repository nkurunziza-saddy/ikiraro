import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
export const Route = createFileRoute("/docs")({
  component: SdkLayout,
});
const NAV = [
  {
    group: "Getting Started",
    items: [{ label: "Overview", to: "/docs" as const, exact: true }],
  },
  {
    group: "API Reference",
    items: [
      { label: "useIkiraro", to: "/docs/hooks" as const, exact: false },
      { label: "useHandTracking", to: "/docs/vision" as const, exact: false },
    ],
  },
  {
    group: "Components",
    items: [{ label: "UI Components", to: "/docs/components" as const, exact: false }],
  },
  {
    group: "Advanced",
    items: [
      { label: "Runtime API", to: "/docs/runtime" as const, exact: false },
      { label: "Event Reference", to: "/docs/events" as const, exact: false },
      { label: "Key Types", to: "/docs/types" as const, exact: false },
    ],
  },
];
function SdkLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="bg-background min-h-screen pt-[100px] md:pt-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 pb-12">
        <div className="flex gap-12 items-start">
          <aside className="hidden lg:block w-48 shrink-0 sticky top-32 self-start">
            <div className="flex items-center gap-2 mb-8">
              <span className="bg-foreground text-background rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                SDK
              </span>
              <span className="text-muted-foreground text-[10px]">v0.3.2</span>
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
                          className={`text-[13px] py-1.5 px-3 -mx-3 rounded-md transition-colors ${
                            active
                              ? "text-foreground bg-secondary font-medium"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
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
                className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft size={11} /> Home
              </Link>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
