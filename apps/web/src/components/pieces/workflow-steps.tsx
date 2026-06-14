"use client";

import { RiCheckLine, RiLoader2Line } from "@remixicon/react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  label: string;
  status: "done" | "active" | "pending";
}

interface WorkflowStepsProps {
  steps?: WorkflowStep[];
  className?: string;
}

export const workflowStepsDemo: WorkflowStepsProps = {
  steps: [
    { label: "Parse user intent", status: "done" },
    { label: "Search knowledge base", status: "done" },
    { label: "Draft response", status: "active" },
    { label: "Format citations", status: "pending" },
  ],
};

export function WorkflowSteps({ steps = [], className }: WorkflowStepsProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Card className="w-full">
        <CardContent className="flex flex-col gap-1.5">
          <AnimatePresence mode="popLayout">
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] as any }}
                className="flex items-center gap-2"
              >
                <motion.span
                  key={s.status}
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    s.status === "done" &&
                      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                    s.status === "active" &&
                      "bg-violet-500/15 text-violet-600 dark:text-violet-400",
                    s.status === "pending" && "bg-muted text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {s.status === "done" && <RiCheckLine className="size-3" />}
                  {s.status === "active" && <RiLoader2Line className="size-3 animate-spin" />}
                  {s.status === "pending" && (
                    <span className="size-1 rounded-full bg-muted-foreground" />
                  )}
                </motion.span>
                <span
                  className={cn(
                    "truncate text-xs",
                    s.status === "pending" ? "text-muted-foreground" : "text-card-foreground",
                    s.status === "active" && "font-medium",
                  )}
                >
                  {s.label}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
