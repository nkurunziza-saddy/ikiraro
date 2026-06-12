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
    if (sign.length !== 1) return null;
    const now = performance.now();

    // SOTA Plateau: If the hand stopped moving and the sign is the same,
    // we can accept it much faster than minHoldMs.
    const holdDuration = now - this.lastLetterTime;
    const canAccept = context.isPlateauReached || holdDuration > this.minHoldMs;

    if (sign !== this.lastLetter) {
      if (canAccept) {
        this.buffer += sign;
        this.lastLetter = sign;
        this.lastLetterTime = now;
        this.doubleLetterCommitted = false;
      }
      return null;
    }

    if (!this.doubleLetterCommitted && now - this.lastLetterTime > this.doubleLetterHoldMs) {
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
  getInProgress(): string {
    return this.buffer;
  }
  overrideLast(sign: string): void {
    if (this.buffer.length > 0) {
      this.buffer = this.buffer.slice(0, -1) + sign;
    } else {
      this.buffer = sign;
    }
    this.lastLetter = sign;
  }
  reset(): void {
    this.buffer = "";
    this.lastLetter = "";
    this.lastLetterTime = 0;
    this.doubleLetterCommitted = false;
  }
}
