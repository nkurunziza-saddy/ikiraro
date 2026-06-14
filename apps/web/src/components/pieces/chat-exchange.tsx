"use client";

import { cn } from "@/lib/utils";

interface ChatExchangeProps {
  user?: string;
  assistant?: string;
  className?: string;
}

export const chatExchangeDemo: ChatExchangeProps = {
  user: "What's the capital of Japan?",
  assistant:
    "Tokyo. It's been the capital since 1868, after Kyoto held the title for over a thousand years.",
};

export function ChatExchange({ user, assistant, className }: ChatExchangeProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex w-full flex-col gap-2">
        {user && (
          <div className="ml-auto max-w-64 rounded-2xl rounded-br-xs bg-foreground px-2.5 py-1.5 text-[13px] text-background">
            {user}
          </div>
        )}
        {assistant && (
          <div className="flex items-start gap-2">
            <div className="max-w-64 rounded-2xl rounded-bl-xs border border-border/60 bg-muted px-2.5 py-1.5 text-[13px] text-foreground">
              {assistant}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
