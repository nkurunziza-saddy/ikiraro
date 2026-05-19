import type { SignPlan, FrameItem, MotionType } from "@ikiraro/engine/types";
import { resolveLexemePose } from "./lexeme-poses";

// ASL fingerspell letters that require a distinct motion path to be legible.
const LETTER_MOTIONS: Partial<Record<string, MotionType>> = {
  J: "j-trace",
  Z: "z-trace",
  G: "g-push",
  H: "h-slide",
  D: "d-arc",
  N: "n-dip",
  K: "k-push",
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
        const pose = resolveLexemePose(token.lexemeId);
        queue.push({
          type: "lexeme",
          value: token.lexemeId.charAt(0),
          label: token.lexemeId,
          sublabel: "Dynamic Sign",
          duration: token.durationMs,
          motion: pose?.motion ?? "none",
          armTarget: pose?.armTarget,
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
          const letter = letters[i]!;
          const motion = LETTER_MOTIONS[letter] ?? "none";
          // Give motion letters a bit more time so the stroke reads clearly.
          const duration = motion !== "none" ? Math.max(400, perLetter) : perLetter;
          queue.push({
            type: "fingerspell",
            value: letter,
            label: letter,
            sublabel: `${i + 1}/${letters.length} · ${token.text}`,
            duration,
            motion,
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
          value: "D",
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
