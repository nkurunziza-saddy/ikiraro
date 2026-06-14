"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TokenOption {
  token: string;
  probability: number;
}

interface TopKLogitsProps {
  title?: string;
  context?: string;
  tokens?: TokenOption[];
  topPrefix?: string;
  className?: string;
}

export const topKLogitsDemo: TopKLogitsProps = {
  title: "next_token",
  context: "The capital of France is",
  topPrefix: "top",
  tokens: [
    { token: "Paris", probability: 0.643 },
    { token: "the", probability: 0.187 },
    { token: "located", probability: 0.081 },
    { token: "also", probability: 0.042 },
    { token: "a", probability: 0.021 },
  ],
};

export function TopKLogits({
  title = "next_token",
  context,
  tokens = [],
  topPrefix = "top",
  className,
}: TopKLogitsProps) {
  const top = tokens.reduce((m, t) => Math.max(m, t.probability), 0);

  return (
    <div className={cn("relative w-full", className)}>
      <Card className="w-full overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 bg-muted/20">
          <span className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {topPrefix} {tokens.length}
          </span>
        </div>
        {context && (
          <div className="border-b border-border/40 px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
            {context}
            <span
              className="ml-0.5 inline-block h-3 w-0.5 -translate-y-px bg-foreground align-middle animate-pulse"
              aria-hidden="true"
            />
          </div>
        )}
        <ul className="flex flex-col divide-y divide-border/40">
          {tokens.map((t, i) => {
            const pctWidth = top > 0 ? (t.probability / top) * 100 : 0;
            const pct = (t.probability * 100).toFixed(1);
            const isTop = i === 0;
            return (
              <li key={t.token} className="relative px-3 py-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pctWidth}%` }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as any }}
                  className={cn(
                    "absolute inset-y-0.5 left-0",
                    isTop ? "bg-emerald-500/15" : "bg-muted/80",
                  )}
                  aria-hidden="true"
                />
                <div className="relative flex items-center justify-between gap-3 font-mono text-xs">
                  <span className="flex min-w-0 items-center">
                    <span
                      className={cn(
                        "truncate",
                        isTop
                          ? "font-semibold text-emerald-700 dark:text-emerald-400"
                          : "text-foreground",
                      )}
                    >
                      {t.token}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
