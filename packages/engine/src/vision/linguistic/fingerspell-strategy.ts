import { fingerspellToken } from "../../planning/tokens";
import type { SignToken } from "../../types";
import { ASL_DEFAULTS } from "../asl-defaults";
import type { ILinguisticStrategy, WordBufferContext } from "../types";
export class FingerspellStrategy implements ILinguisticStrategy {
  readonly name = "fingerspell";
  private buffer = "";
  private lastLetter = "";
  private lastLetterTime = 0;
  // Stability tracking for the incoming candidate letter: a letter enters the
  // word only after being the consistent detection for minHoldMs across
  // several frames (or a motion plateau). Without this, one misclassified
  // frame inserts a garbage letter.
  private pendingSign = "";
  private pendingSince = 0;
  private pendingFrames = 0;
  private readonly minHoldMs = ASL_DEFAULTS.minLetterHoldMs;
  private readonly minStableFrames = 3;
  private readonly doubleLetterHoldMs = ASL_DEFAULTS.doubleLetterHoldMs;
  private doubleLetterCommitted = false;
  update(sign: string, context: WordBufferContext): SignToken | null {
    if (sign.length !== 1) return null;
    const now = performance.now();

    if (sign !== this.pendingSign) {
      this.pendingSign = sign;
      this.pendingSince = now;
      this.pendingFrames = 1;
    } else {
      this.pendingFrames++;
    }

    const heldMs = now - this.pendingSince;
    const isStable =
      (this.pendingFrames >= this.minStableFrames && heldMs >= this.minHoldMs) ||
      (context.isPlateauReached && this.pendingFrames >= 2);
    if (!isStable) return null;

    if (sign !== this.lastLetter) {
      this.buffer += sign;
      this.lastLetter = sign;
      this.lastLetterTime = now;
      this.doubleLetterCommitted = false;
    } else if (!this.doubleLetterCommitted && now - this.lastLetterTime > this.doubleLetterHoldMs) {
      // Holding the same letter much longer than a normal hold = double letter.
      this.buffer += sign;
      this.doubleLetterCommitted = true;
      this.lastLetterTime = now; // allow triples via another full hold
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
    this.pendingSign = "";
    this.pendingSince = 0;
    this.pendingFrames = 0;
    this.doubleLetterCommitted = false;
  }
}
