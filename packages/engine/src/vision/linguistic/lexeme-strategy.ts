import type { ILinguisticStrategy, WordBufferContext } from "../types";
import type { SignToken } from "../../types";
import { lexemeToken } from "../../planning/tokens";
export class LexemeStrategy implements ILinguisticStrategy {
  readonly name = "lexeme";
  private lastLexeme = "";
  private lastLexemeTime = 0;
  private readonly minHoldMs = 400;
  update(sign: string, context: WordBufferContext): SignToken | null {
    if (sign.length <= 1) return null;
    const now = performance.now();
    if (sign !== this.lastLexeme) {
      this.lastLexeme = sign;
      this.lastLexemeTime = now;
      return null;
    }

    const holdDuration = now - this.lastLexemeTime;
    const canAccept = context.isPlateauReached || holdDuration > this.minHoldMs;

    if (canAccept) {
      const token = lexemeToken(sign);
      this.reset();
      return token;
    }
    return null;
  }

  reset(): void {
    this.lastLexeme = "";
    this.lastLexemeTime = 0;
  }
}
