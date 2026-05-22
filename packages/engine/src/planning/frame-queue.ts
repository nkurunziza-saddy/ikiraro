import type { SignPlan, FrameItem, MotionType, ArmTarget } from "@ikiraro/engine/types";
import { resolveLexemePose } from "./lexeme-poses";

const LETTER_MOTIONS: Partial<Record<string, MotionType>> = {
  J: "j-trace",
  Z: "z-trace",
  G: "g-push",
  H: "h-slide",
  D: "d-arc",
  N: "n-dip",
  K: "k-push",
};
const NUMBER_MOTIONS: Partial<Record<string, MotionType>> = {
  "6": "wrist-twist",
  "7": "wrist-twist",
  "8": "wrist-twist",
  "9": "wrist-twist",
};
const NUMBER_ARM_TARGET: ArmTarget = { rArmX: 0.74, rArmZ: -0.5, rForeZ: -1.44, rForeY: 0.46 };
const MOTION_DURATION_FLOORS: Partial<Record<MotionType, number>> = {
  salute: 1100,
  "forward-push": 980,
  "outward-sweep": 960,
  "pull-back": 940,
  "chest-pat": 760,
  "two-hand-tap": 980,
  "music-sweep": 1200,
  "wrist-twist": 680,
  tap: 760,
  shake: 900,
  circle: 1100,
  arc: 900,
  "z-trace": 860,
  "j-trace": 860,
  "g-push": 720,
  "h-slide": 720,
  "d-arc": 720,
  "n-dip": 680,
  "k-push": 720,
};
function durationForMotion(durationMs: number, motion: MotionType): number {
  return Math.max(durationMs, MOTION_DURATION_FLOORS[motion] ?? 0);
}
function resolvePointingTarget(target: string): { armTarget: ArmTarget; motion: MotionType } {
  const key = target.toUpperCase();
  if (key === "SELF") {
    return {
      armTarget: { rArmX: 0.78, rArmZ: -0.38, rForeZ: -1.26, rForeY: 0.22, rHandX: -0.38 },
      motion: "chest-pat",
    };
  }
  if (key === "THAT") {
    return {
      armTarget: { rArmX: 0.66, rArmZ: -0.18, rForeZ: -1.28, rForeY: 0.16, rHandX: -0.1 },
      motion: "outward-sweep",
    };
  }
  return {
    armTarget: { rArmX: 0.68, rArmZ: -0.72, rForeZ: -1.24, rForeY: 0.14, rHandX: -0.08 },
    motion: "forward-push",
  };
}
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
        const motion = pose?.motion ?? "none";
        queue.push({
          type: "lexeme",
          value: token.lexemeId.charAt(0),
          label: token.lexemeId,
          sublabel: "Dynamic Sign",
          duration: durationForMotion(token.durationMs, motion),
          motion,
          armTarget: pose?.armTarget,
          facialExpression: token.facialExpression,
          coarticulation: token.coarticulationHint,
        });
      } else if (token.type === "fingerspell") {
        const letters = token.text
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .split("");
        const perLetter = Math.max(220, Math.round(token.durationMs / Math.max(letters.length, 1)));
        for (let i = 0; i < letters.length; i++) {
          const letter = letters[i]!;
          const motion = LETTER_MOTIONS[letter] ?? "none";
          const duration = motion !== "none" ? durationForMotion(perLetter, motion) : perLetter;
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
        const perDigit = Math.max(240, Math.round(token.durationMs / Math.max(digits.length, 1)));
        for (let i = 0; i < digits.length; i++) {
          const digit = digits[i]!;
          const motion = NUMBER_MOTIONS[digit] ?? "none";
          queue.push({
            type: "number",
            value: digit,
            label: `#${digit}`,
            sublabel: `Digit ${i + 1}/${digits.length}`,
            duration: durationForMotion(perDigit, motion),
            motion,
            armTarget: NUMBER_ARM_TARGET,
            facialExpression: token.facialExpression,
            coarticulation: token.coarticulationHint,
          });
        }
      } else if (token.type === "pointing") {
        const pointing = resolvePointingTarget(token.target);
        queue.push({
          type: "pointing",
          value: "D",
          label: `Point: ${token.target}`,
          duration: durationForMotion(token.durationMs, pointing.motion),
          motion: pointing.motion,
          armTarget: pointing.armTarget,
          facialExpression: token.facialExpression,
          coarticulation: token.coarticulationHint,
        });
      }
    }
  }
  return queue;
}
