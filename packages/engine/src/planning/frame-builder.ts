import type {
  SignPlan,
  FrameItem,
  MotionType,
  ArmTarget,
  SignToken,
  CoarticulationMode,
} from "../types";

import { LanguageRegistry } from "../language-registry";

const DEFAULT_ARM_TARGET: ArmTarget = { rArmX: 0.76, rArmZ: -0.52, rForeZ: -1.5, rForeY: 0.48 };

/**
 * Deep module that transforms a high-level SignPlan into a concrete queue of frames
 * for the renderer. It handles timing normalization, spatial anchor resolution,
 * and plugin-driven motion selection.
 */
export class FrameBuilder {
  /**
   * Main entry point: transforms a Plan into Frames.
   */
  public build(plan: SignPlan): FrameItem[] {
    const queue: FrameItem[] = [];
    const intent = plan.clauses[0]?.intent ?? "statement";

    for (const clause of plan.clauses) {
      for (const token of clause.tokens) {
        if (token.type === "pause") {
          queue.push(this.buildPause(token));
        } else {
          queue.push(...this.buildTokenFrames(token, intent));
        }
      }
    }

    return queue;
  }

  private buildPause(token: SignToken & { type: "pause" }): FrameItem {
    return {
      type: "pause",
      value: "/",
      label: "Pause",
      duration: token.durationMs,
    };
  }

  private buildTokenFrames(
    token: Exclude<SignToken, { type: "pause" }>,
    intent: string,
  ): FrameItem[] {
    const lang = LanguageRegistry.getActive();
    const frames: FrameItem[] = [];

    // Facial expression logic based on sign intent and emphasis
    let facial = token.facialExpression ?? "neutral";
    if (intent === "question") facial = "inquisitive";
    else if (token.emphasis === "high") facial = "assertive";

    const baseDuration = token.durationMs;
    const coarticulation: CoarticulationMode = token.coarticulationHint ?? "blend";

    if (token.type === "lexeme") {
      const pose = lang.getLexemePose(token.lexemeId);
      frames.push({
        type: "lexeme",
        value: token.lexemeId,
        label: token.lexemeId,
        duration: baseDuration,
        motion: pose?.motion ?? "none",
        armTarget: pose?.armTarget ?? DEFAULT_ARM_TARGET,
        facialExpression: facial,
        coarticulation,
      });
    } else if (token.type === "fingerspell") {
      const letters = token.text
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .split("");

      const perLetter = Math.round(baseDuration / Math.max(letters.length, 1));

      for (const char of letters) {
        frames.push({
          type: "fingerspell",
          value: char,
          label: char,
          duration: perLetter,
          motion: lang.fingerspellMotions[char] ?? "none",
          facialExpression: facial,
          coarticulation: "blend",
        });
      }
    } else if (token.type === "number") {
      const digits = token.value.split("");
      const perDigit = Math.round(baseDuration / Math.max(digits.length, 1));

      for (const digit of digits) {
        frames.push({
          type: "number",
          value: digit,
          label: `#${digit}`,
          duration: perDigit,
          motion: lang.numberMotions[digit] ?? "none",
          armTarget: lang.numberArmTarget,
          facialExpression: facial,
          coarticulation: "blend",
        });
      }
    } else if (token.type === "pointing") {
      // Resolve pointing targets to concrete arm positions and motions
      const target = token.target.toUpperCase();

      let armTarget: ArmTarget = DEFAULT_ARM_TARGET;
      let motion: MotionType = "forward-push";

      if (target === "SELF") {
        armTarget = { rArmX: 0.78, rArmZ: -0.38, rForeZ: -1.26, rForeY: 0.22, rHandX: -0.38 };
        motion = "chest-pat";
      } else if (target === "THAT") {
        armTarget = { rArmX: 0.66, rArmZ: -0.18, rForeZ: -1.28, rForeY: 0.16, rHandX: -0.1 };
        motion = "outward-sweep";
      }

      frames.push({
        type: "pointing",
        value: "D", // Pointing handshape
        label: `Point: ${token.target}`,
        duration: baseDuration,
        motion,
        armTarget,
        facialExpression: facial,
        coarticulation: "snap",
      });
    }

    return frames;
  }
}

/**
 * Singleton instance for the engine.
 */
export const frameBuilder = new FrameBuilder();
