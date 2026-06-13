"use client";

import { cn } from "@/lib/utils";

interface PromptPillsProps {
  prompts?: string[];
  className?: string;
}

export const promptPillsDemo: PromptPillsProps = {
  prompts: ["Summarize this doc", "Draft a reply", "Extract action items", "Translate to Turkish"],
};

export function PromptPills({ prompts = [], className }: PromptPillsProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex w-full  flex-wrap items-center justify-center gap-1.5">
        {prompts.map((p, i) => (
          <button
            key={i}
            type="button"
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-card-foreground shadow-sm transition-colors hover:bg-muted"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
