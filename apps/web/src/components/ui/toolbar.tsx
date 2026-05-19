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
      className="inline-flex items-center gap-1 bg-ink rounded-full p-1.5 shadow-[var(--sh-3)]"
    >
      {items.map((item, i) => {
        if (item.type === "divider") {
          return (
            <span
              key={i}
              className="w-px mx-0.5 self-stretch my-1.5"
              style={{ background: "rgba(241,236,227,0.14)" }}
            />
          );
        }
        return (
          <button
            key={item.label}
            onClick={item.onClick}
            aria-label={item.label}
            aria-pressed={item.active}
            className={`w-8 h-8 rounded-full grid place-items-center transition-colors border-0 cursor-pointer ${
              item.active
                ? "bg-primary text-on-primary"
                : "bg-transparent text-on-dark/60 hover:bg-white/[0.08] hover:text-on-dark"
            }`}
          >
            <span className="w-[15px] h-[15px] [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-[1.8]">
              {item.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}
