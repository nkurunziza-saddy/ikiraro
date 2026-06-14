import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="max-w-[900px] mx-auto px-4 md:px-6 pb-24 pt-12 w-full mt-8 md:mt-12 border-t border-border/20">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-4 md:gap-y-8 text-[13px]">
        <div className="flex flex-col gap-1.5">
          <Link
            to="/"
            className="font-medium text-foreground hover:opacity-70 transition-opacity tracking-tight"
          >
            Ikiraro Bridge
          </Link>
          <span className="text-muted-foreground/50 font-light">Built for the web.</span>
        </div>
        <nav className="flex flex-wrap gap-8 font-medium text-muted-foreground/70 items-start pt-0.5">
          <Link to="/docs" className="hover:text-foreground transition-colors">
            Documentation
          </Link>
          <Link to="/what" className="hover:text-foreground transition-colors">
            What
          </Link>
          <Link to="/playground" className="hover:text-foreground transition-colors">
            Playground
          </Link>
        </nav>
      </div>
    </footer>
  );
}
