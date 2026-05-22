import { Link } from "@tanstack/react-router";
export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full pt-[24px] px-6 md:px-12 bg-transparent">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between border-b border-border pb-[24px]">
        <Link
          to="/"
          className="font-semibold tracking-tight text-[22px] text-foreground flex items-center gap-3"
        >
          Sensa
        </Link>
        <div className="flex items-center gap-[32px]">
          <nav className="hidden md:flex items-center gap-[24px]">
            {[
              { label: "Playground", to: "/playground" },
              { label: "Documentation", to: "/docs" },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="font-sans text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link
            to="/playground"
            className="flex items-center justify-center gap-2 h-[36px] px-[16px] bg-primary text-primary-foreground font-semibold text-[13px] hover:opacity-90 transition-opacity"
          >
            Launch Engine
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
