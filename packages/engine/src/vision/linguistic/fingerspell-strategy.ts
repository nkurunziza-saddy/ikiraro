import type { ILinguisticStrategy, WordBufferContext } from "../types";
import type { SignToken } from "../../types";
import { fingerspellToken } from "../../planning/tokens";
import { ASL_DEFAULTS } from "../asl-defaults";

export class FingerspellStrategy implements ILinguisticStrategy {
  readonly name = "fingerspell";
  private buffer = "";
  private lastLetter = "";
  private lastLetterTime = 0;
  private readonly minHoldMs = ASL_DEFAULTS.minLetterHoldMs;
  private readonly doubleLetterHoldMs = ASL_DEFAULTS.doubleLetterHoldMs;
  private doubleLetterCommitted = false;

  update(sign: string, context: WordBufferContext): SignToken | null {
    if (sign.length !== 1) return null; // Only handle single characters

    const now = performance.now();

    if (sign !== this.lastLetter) {
      if (now - this.lastLetterTime > this.minHoldMs) {
        this.buffer += sign;
        this.lastLetter = sign;
        this.lastLetterTime = now;
        this.doubleLetterCommitted = false;
      }
      return null;
    }

    // Double letter detection
    if (
      !this.doubleLetterCommitted &&
      (context.gesture === "double-letter-slide" ||
        context.gesture === "double-letter-bounce" ||
        now - this.lastLetterTime > this.doubleLetterHoldMs)
    ) {
      this.buffer += sign;
      this.doubleLetterCommitted = true;
    }

    return null;
  }

  commit(): SignToken | null {
    if (!this.buffer) return null;
    const token = fingerspellToken(this.buffer);
    this.reset();
    return token;
  }

  reset(): void {
    this.buffer = "";
    this.lastLetter = "";
    this.lastLetterTime = 0;
    this.doubleLetterCommitted = false;
  }
}
