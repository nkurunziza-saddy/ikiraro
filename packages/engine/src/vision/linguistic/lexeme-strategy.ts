import type { ILinguisticStrategy } from "../types";
import type { SignToken } from "../../types";
import { lexemeToken } from "../../planning/tokens";

export class LexemeStrategy implements ILinguisticStrategy {
  readonly name = "lexeme";
  private lastLexeme = "";
  private lastLexemeTime = 0;
  private readonly minHoldMs = 400;

  update(sign: string): SignToken | null {
    if (sign.length <= 1) return null; // Only handle words

    const now = performance.now();

    if (sign !== this.lastLexeme) {
      this.lastLexeme = sign;
      this.lastLexemeTime = now;
      return null;
    }

    if (now - this.lastLexemeTime > this.minHoldMs) {
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
