"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuardRailProps {
  name?: string;
  policies?: string[];
  className?: string;
}

export const guardRailDemo: GuardRailProps = {
  name: "Guardrails",
  policies: ["PII redaction", "Toxicity", "Prompt injection"],
};

export function GuardRail({ name = "Guardrails", policies = [], className }: GuardRailProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex w-full  flex-col gap-2 rounded-md border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-500" aria-hidden="true" />
          <span className="text-xs font-semibold text-card-foreground">{name}</span>
          <span className="ml-auto rounded-sm bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            active
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {policies.map((p) => (
            <span
              key={p}
              className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-xs text-card-foreground"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
