import { Link } from "@tanstack/react-router";

export default function Header() {
  const links = [
    { to: "/", label: "Overview" },
    { to: "/demo", label: "Demo" },
  ] as const;

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "var(--paper)",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="flex h-6 w-6 items-center justify-center"
              style={{ borderRadius: "2px", background: "var(--ink)" }}
            >
              <span
                className="text-[9px] font-bold"
                style={{
                  color: "var(--on-dark)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.5px",
                }}
              >
                IK
              </span>
            </div>
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--ink)", letterSpacing: "-0.3px" }}
            >
              Ikiraro
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-[13px] transition-colors"
                style={{ color: "var(--steel)" }}
                activeProps={{
                  style: { color: "var(--ink)", fontWeight: 500 },
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span
            className="text-[11px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--stone)",
              letterSpacing: "0.3px",
            }}
          >
            v0.3
          </span>
          <Link
            to="/demo"
            className="hidden md:inline-flex px-4 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
              borderRadius: "3px",
            }}
          >
            Launch Demo
          </Link>
        </div>
      </div>
    </header>
  );
}
