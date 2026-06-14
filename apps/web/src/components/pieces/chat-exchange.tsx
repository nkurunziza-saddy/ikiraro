"use client";

import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }}
      className={cn("relative w-full", className)}
    >
      <div className="flex w-full flex-col gap-2">
        {user && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }}
            className="ml-auto max-w-64 rounded-2xl rounded-br-xs bg-foreground px-2.5 py-1.5 text-[13px] text-background"
          >
            {user}
          </motion.div>
        )}
        {assistant && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }}
            className="flex items-start gap-2"
          >
            <div className="max-w-64 rounded-2xl rounded-bl-xs border border-border/60 bg-muted px-2.5 py-1.5 text-[13px] text-foreground">
              {assistant}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
