import type { SignPlan } from "@sensa/engine/types";

export type FrameItem = {
  type: "lexeme" | "fingerspell" | "number" | "pause" | "pointing";
  value: string;
  label: string;
  sublabel?: string;
  duration: number;
  motion?: "none" | "shake" | "arc" | "tap" | "circle";
  facialExpression?: string;
  coarticulation?: "blend" | "snap" | "none";
};

export function buildFrameQueue(plan: SignPlan | null): FrameItem[] {
  if (!plan) return [];

  const queue: FrameItem[] = [];

  for (const clause of plan.clauses) {
    for (const token of clause.tokens) {
      if (token.type === "pause") {
        queue.push({
          type: "pause",
          value: "/",
          label: "Pause",
          duration: token.durationMs,
        });
      } else if (token.type === "lexeme") {
        queue.push({
          type: "lexeme",
          value: token.lexemeId.charAt(0),
          label: token.lexemeId,
          sublabel: "Dynamic Sign",
          duration: token.durationMs,
          motion: "none",
          facialExpression: token.facialExpression,
          coarticulation: token.coarticulationHint,
        });
      } else if (token.type === "fingerspell") {
        const letters = token.text
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .split("");
        const perLetter = Math.max(180, Math.round(token.durationMs / Math.max(letters.length, 1)));
        for (let i = 0; i < letters.length; i++) {
          queue.push({
            type: "fingerspell",
            value: letters[i]!,
            label: letters[i]!,
            sublabel: `${i + 1}/${letters.length} · ${token.text}`,
            duration: perLetter,
            motion: "none",
            facialExpression: token.facialExpression,
            coarticulation: token.coarticulationHint,
          });
        }
      } else if (token.type === "number") {
        const digits = token.value.split("");
        const perDigit = Math.max(180, Math.round(token.durationMs / Math.max(digits.length, 1)));
        for (let i = 0; i < digits.length; i++) {
          queue.push({
            type: "number",
            value: digits[i]!,
            label: `#${digits[i]}`,
            sublabel: `Digit ${i + 1}/${digits.length}`,
            duration: perDigit,
            motion: "none",
            facialExpression: token.facialExpression,
            coarticulation: token.coarticulationHint,
          });
        }
      } else if (token.type === "pointing") {
        queue.push({
          type: "pointing",
          value: "D", // Pointing index
          label: `Point: ${token.target}`,
          duration: token.durationMs,
          facialExpression: token.facialExpression,
          coarticulation: token.coarticulationHint,
        });
      }
    }
  }

  return queue;
}
