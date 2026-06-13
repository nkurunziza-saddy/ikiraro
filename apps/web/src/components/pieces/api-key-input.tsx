"use client";

import { Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ApiKeyInputProps {
  label?: string;
  value?: string;
  className?: string;
}

export const apiKeyInputDemo: ApiKeyInputProps = {
  label: "OPENAI_API_KEY",
  value: "sk-proj-8fK2p3nR4vX7qW9sL1mT6bY0aZ",
};

export function ApiKeyInput({
  label = "API_KEY",
  value = "sk-••••••••••••••••",
  className,
}: ApiKeyInputProps) {
  const [shown, setShown] = useState(false);
  const masked = value.slice(0, 3) + "•".repeat(Math.max(8, value.length - 3));

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex w-full  flex-col gap-1.5">
        <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <KeyRound className="size-3" aria-hidden="true" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 shadow-sm">
          <span className="flex-1 truncate font-mono text-xs text-card-foreground">
            {shown ? value : masked}
          </span>
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={shown ? "Hide" : "Show"}
          >
            {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Copy"
          >
            <Copy className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
