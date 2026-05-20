import { Link } from "@tanstack/react-router";
import { Button } from "@ikiraro/components/ui/button";

export default function Header() {
  const links = [
    { to: "/", label: "Product" },
    { to: "/demo", label: "Interactive" },
    { to: "/sdk", label: "Documentation" },
  ] as const;

  return (
    <header className="bg-background/80 border-b border-border sticky top-0 z-50 w-full backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-3.5 md:px-10">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-foreground flex h-5 w-5 items-center justify-center rounded-sm">
              <span className="text-background text-[10px] font-bold tracking-tighter">S</span>
            </div>
            <span className="text-foreground text-[14px] font-semibold tracking-tight">Sensa</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-muted-foreground text-[13px] font-medium transition-colors hover:text-foreground"
                activeProps={{
                  className: "text-foreground font-semibold",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            render={<Link to="/demo" />}
            className="bg-foreground text-background rounded-md h-8 px-4 text-[12px] font-bold transition-all hover:opacity-90"
          >
            Launch
          </Button>
        </div>
      </div>
    </header>
  );
}
