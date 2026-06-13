import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex bg-card border border-border rounded-full p-1 w-fit h-8 items-center gap-1">
        <div className="size-6 rounded-full" />
        <div className="size-6 rounded-full" />
        <div className="size-6 rounded-full" />
      </div>
    );
  }

  const modes = [
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
    { value: "system", icon: Monitor },
  ] as const;

  return (
    <div className="flex bg-card border border-border rounded-full p-1 w-fit h-8 items-center gap-1 shadow-sm">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => setTheme(mode.value)}
          className={cn(
            "size-6 flex items-center justify-center rounded-full transition-all duration-ui ease-ui",
            theme === mode.value
              ? "bg-background text-primary border border-border shadow-sm"
              : "text-muted-foreground hover:text-primary",
          )}
          aria-label={`${mode.value} theme`}
        >
          <mode.icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
