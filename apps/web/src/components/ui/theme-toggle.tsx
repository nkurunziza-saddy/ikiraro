import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />;
  }
  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-8 h-8 rounded-full border border-border bg-background hover:bg-secondary transition-colors overflow-hidden group"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDark ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
      >
        <Sun className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
      <div
        className={`absolute flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDark ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
      >
        <Moon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </button>
  );
}
