"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  model?: string;
  speed?: string;
  image?: string;
  alt?: string;
  className?: string;
}

export const modeSelectorDemo: ModeSelectorProps = {
  model: "Claude Opus 4.6",
  speed: "Balanced",
  image: "https://oud.pics/sm/l/claude.png",
  alt: "Claude",
};

export function ModeSelector({ model = "Model", speed, image, alt, className }: ModeSelectorProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm transition-colors hover:bg-muted"
      >
        {image ? (
          <span className="relative size-5 shrink-0 overflow-hidden rounded-full bg-card">
            <img src={image} alt={alt ?? model} className="object-cover w-full h-full" />
          </span>
        ) : (
          <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <Sparkles className="size-3" aria-hidden="true" />
          </div>
        )}
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold text-card-foreground">{model}</span>
          {speed && <span className="text-xs text-muted-foreground">{speed}</span>}
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </button>
    </div>
  );
}
