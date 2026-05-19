import type { ReactNode } from "react";

type ToolbarButton = {
  type: "button";
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
};

type ToolbarDivider = { type: "divider" };

export type ToolbarItem = ToolbarButton | ToolbarDivider;

interface ToolbarProps {
  items: ToolbarItem[];
  "aria-label"?: string;
}

export function Toolbar({ items, "aria-label": ariaLabel }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className="bg-background inline-flex items-center gap-1 p-1 border border-border rounded-lg shadow-sh-1"
    >
      {items.map((item, i) => {
        if (item.type === "divider") {
          return <span key={i} className="bg-border mx-1 w-px h-4 self-center" />;
        }
        return (
          <button
            key={item.label}
            onClick={item.onClick}
            aria-label={item.label}
            aria-pressed={item.active}
            className={`flex items-center gap-1.5 h-7 px-3 cursor-pointer border-0 rounded-md transition-all ${
              item.active
                ? "bg-foreground text-background"
                : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <span className="w-[12px] h-[12px] [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-[2.5]">
              {item.icon}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
