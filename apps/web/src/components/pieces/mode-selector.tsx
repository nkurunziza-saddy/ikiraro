"use client";

import { RiArrowDownSLine } from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ModeOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface ModeSelectorProps {
  model?: string;
  speed?: string;
  className?: string;
  onClick?: () => void;
  items?: ModeOption[];
  value?: string;
  onSelect?: (value: string) => void;
  placeholder?: string;
}

export function ModeSelector({
  model = "Model",
  speed,
  className,
  onClick,
  items = [],
  value,
  onSelect,
  placeholder = "Select mode",
}: ModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const selectedItem = items.find((item) => item.value === value);
  const currentLabel = selectedItem?.label ?? model;
  const currentDescription = selectedItem?.description ?? speed;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const handleToggle = () => {
    if (items.length > 0) {
      setOpen((prev) => !prev);
      return;
    }

    onClick?.();
  };

  const handleSelect = (item: ModeOption) => {
    if (item.disabled) return;

    onSelect?.(item.value);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex w-full items-center justify-between gap-2 rounded-[8px] border border-border/60 bg-transparent px-3 py-2 text-left transition-colors hover:bg-foreground/2"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-medium text-foreground capitalize">{currentLabel}</span>
            {(currentDescription ?? (items.length > 0 ? placeholder : undefined)) && (
              <span className="text-xs text-muted-foreground">
                {currentDescription ?? (items.length > 0 ? placeholder : undefined)}
              </span>
            )}
          </div>
        </div>
        <RiArrowDownSLine
          className={cn(
            "size-3.5 text-muted-foreground/60 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && items.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-[10px] border border-border/60 bg-background shadow-lg shadow-black/5">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelect(item)}
              disabled={item.disabled}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-foreground/2 disabled:cursor-not-allowed disabled:opacity-60",
                item.value === value && "bg-foreground/[0.04]",
              )}
            >
              <span className="text-sm font-medium text-foreground capitalize">{item.label}</span>
              {item.description && (
                <span className="text-xs text-muted-foreground">{item.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
