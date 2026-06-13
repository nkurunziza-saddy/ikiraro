"use client";

import { cn } from "@/lib/utils";

type Tone = "primary" | "foreground" | "violet" | "emerald" | "sky" | "amber";

interface TokenStreamProps {
  tokens?: string[];
  tokensPerSecond?: number;
  tone?: Tone;
  className?: string;
}

const chipClasses: Record<Tone, string> = {
  primary: "bg-primary/15 text-primary",
  foreground: "bg-foreground/10 text-foreground",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export const tokenStreamDemo: TokenStreamProps = {
  tokens: ["The", " quick", " brown", " fox", " jumps", " over"],
  tokensPerSecond: 142,
  tone: "violet",
};

export function TokenStream({
  tokens = [],
  tokensPerSecond = 0,
  tone = "violet",
  className,
}: TokenStreamProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex w-full  flex-col gap-1.5 rounded-md border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>stream</span>
          <span>{tokensPerSecond} tok/s</span>
        </div>
        <div className="flex flex-wrap gap-0.5">
          {tokens.map((t, i) => (
            <span key={i} className={cn("rounded-sm px-1 font-mono text-xs", chipClasses[tone])}>
              {t.replace(/ /g, "\u00a0")}
            </span>
          ))}
          <span
            className="inline-block h-3.5 w-0.5 animate-pulse bg-foreground align-middle"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
