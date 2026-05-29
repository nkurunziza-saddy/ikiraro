"use client";
import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function FooterThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <div className="w-7 h-7 border border-border bg-secondary animate-pulse" />;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-7 h-7 border border-border bg-background hover:bg-secondary transition-colors overflow-hidden group"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDark ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
      >
        <Sun className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
      <div
        className={`absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDark ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
      >
        <Moon className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </button>
  );
}

export function OverviewFooter() {
  const currentYear = new Date().getFullYear();

  const links = [
    {
      title: "Product",
      items: [
        { label: "Playground", href: "/playground" },
        { label: "Documentation", href: "/docs" },
        { label: "SDK Download", href: "/docs" },
        { label: "Status", href: "#" },
      ],
    },
    {
      title: "Resources",
      items: [
        { label: "GitHub Repository", href: "https://github.com/nkurunziza-saddy/ikiraro" },
        { label: "Community Discord", href: "#" },
        { label: "Research Papers", href: "#" },
        { label: "API Reference", href: "/docs" },
      ],
    },
    {
      title: "Company",
      items: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Contact Sales", href: "#" },
      ],
    },
  ];

  return (
    <footer className="w-full bg-background py-24 md:py-32 overflow-hidden border-t border-border">
      <div className="bento-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-24 mb-24">
          <div className="lg:col-span-5 space-y-10">
            <div className="flex items-center gap-3">
              <div className="size-5 bg-primary rounded-none"></div>
              <span className="text-[20px] font-bold tracking-[-0.04em] uppercase">Ikiraro.</span>
            </div>
            <p className="text-[16px] text-secondary-foreground leading-relaxed max-w-sm">
              An open-source intelligence engine for browser-native sign language translation. Built
              for low-latency accessibility.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12">
            {links.map((group) => (
              <div key={group.title} className="space-y-6">
                <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] font-bold">
                  {group.title}
                </h4>
                <ul className="space-y-3">
                  {group.items.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href as any}
                        className="text-[14px] text-foreground/70 hover:text-primary transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
          <span className="text-[9px] font-mono uppercase tracking-[0.5em]">
            © {currentYear} IKIRARO SYSTEMS // ALL RIGHTS RESERVED
          </span>
          <div className="flex items-center gap-10">
            <span className="text-[9px] font-mono uppercase tracking-[0.5em]">v0.3.5-STABLE</span>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="size-1 bg-foreground rounded-none"></div>
                ))}
              </div>
              <FooterThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
