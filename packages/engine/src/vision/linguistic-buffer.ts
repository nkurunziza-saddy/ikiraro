import type { LinguisticBufferConfig, WordBufferContext, BufferState } from "./types";
import type { SignToken } from "../types";
import { FingerspellStrategy } from "./linguistic/fingerspell-strategy";
import { LexemeStrategy } from "./linguistic/lexeme-strategy";

/**
 * The LinguisticBuffer is a 'Deep' fusion layer.
 * It transforms high-frequency sign detections into high-level SignTokens
 * using polymorphic linguistic strategies.
 */
export class LinguisticBuffer {
  private tokens: SignToken[] = [];
  private currentSign: string | null = null;
  private lastSignTime = 0;
  private config: LinguisticBufferConfig;

  constructor(config?: Partial<LinguisticBufferConfig>) {
    this.config = {
      strategies: config?.strategies ?? [new FingerspellStrategy(), new LexemeStrategy()],
      pauseThresholdMs: config?.pauseThresholdMs ?? 1000,
    };
  }

  /**
   * Updates the buffer with a new sign detection.
   *
   * @param sign - The detected sign (null if none).
   * @param context - Vision context (gestures, transitions).
   * @returns A new SignToken if a strategy triggered a commitment, otherwise null.
   */
  update(sign: string | null, context: WordBufferContext = {}): SignToken | null {
    const now = performance.now();

    // 1. Handle transitions
    if (context.isTransitioning) return null;

    // 2. Handle silence/pauses
    if (!sign) {
      if (this.currentSign && now - this.lastSignTime > this.config.pauseThresholdMs) {
        return this.commitAll();
      }
      return null;
    }

    // 3. Drive strategies
    this.currentSign = sign;
    this.lastSignTime = now;

    for (const strategy of this.config.strategies) {
      const token = strategy.update(sign, context);
      if (token) {
        this.tokens.push(token);
        return token;
      }
    }

    return null;
  }

  private commitAll(): SignToken | null {
    for (const strategy of this.config.strategies) {
      if (strategy.commit) {
        const token = strategy.commit();
        if (token) {
          this.tokens.push(token);
          this.currentSign = null;
          return token;
        }
      }
    }
    this.currentSign = null;
    return null;
  }

  getInProgress(): string {
    for (const strategy of this.config.strategies) {
      const v = strategy.getInProgress?.();
      if (v) return v;
    }
    return "";
  }

  overrideLast(sign: string): void {
    for (const strategy of this.config.strategies) {
      if (strategy.overrideLast) {
        strategy.overrideLast(sign);
        return;
      }
    }
  }

  getState(): BufferState {
    const text = this.tokens
      .map((t) => {
        if (t.type === "fingerspell") return t.text;
        if (t.type === "lexeme") return t.lexemeId;
        return "";
      })
      .join(" ");

    return {
      currentWord: this.getInProgress(),
      sentence: this.tokens.map((t) => (t.type === "lexeme" ? t.lexemeId : (t as any).text)),
      sentenceText: text,
    };
  }

  clear(): void {
    this.tokens = [];
    this.currentSign = null;
    for (const strategy of this.config.strategies) strategy.reset();
  }
}
