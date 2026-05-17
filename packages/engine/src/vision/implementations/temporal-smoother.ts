import type { ITemporalSmoother, ClassifierConfig } from "../../types";

/**
 * Smoothes raw detection candidates over time using consensus and hysteresis.
 * This prevents flickering and ensures stable detections in the UI.
 */
export class SensaTemporalSmoother implements ITemporalSmoother {
  private history: Array<string | null> = [];
  private lockedSign: string | null = null;
  private lockFrames = 0;

  constructor(private config: ClassifierConfig) {}

  smooth(candidates: Array<{ name: string; score: number }>): {
    sign: string | null;
    confidence: number;
  } {
    const match = candidates[0] ?? null;
    const rawSign = match && match.score >= this.config.rawScoreThreshold ? match.name : null;

    this.history.push(rawSign);
    if (this.history.length > this.config.windowSize) {
      this.history.shift();
    }

    const consensusSign = this.getConsensus();
    const stableSign = this.applyHysteresis(consensusSign);
    const confidence = this.getConfidence(stableSign);

    return { sign: stableSign, confidence };
  }

  reset(): void {
    this.history = [];
    this.lockedSign = null;
    this.lockFrames = 0;
  }

  private getConsensus(): string | null {
    const counts: Record<string, number> = {};
    for (const sign of this.history) {
      if (sign) {
        counts[sign] = (counts[sign] ?? 0) + 1;
      }
    }

    let best: string | null = null;
    let bestCount = 0;
    for (const [sign, count] of Object.entries(counts)) {
      if (count > bestCount) {
        best = sign;
        bestCount = count;
      }
    }

    return bestCount >= this.config.lockThreshold ? best : null;
  }

  private applyHysteresis(consensus: string | null): string | null {
    if (consensus === this.lockedSign) {
      this.lockFrames = 0;
      return this.lockedSign;
    }

    this.lockFrames += 1;

    if (consensus === null) {
      if (this.lockFrames >= this.config.unlockThreshold) {
        this.lockedSign = null;
        this.lockFrames = 0;
      }
      return this.lockedSign;
    }

    if (this.lockFrames >= this.config.lockThreshold) {
      this.lockedSign = consensus;
      this.lockFrames = 0;
    }

    return this.lockedSign;
  }

  private getConfidence(sign: string | null): number {
    if (!sign) return 0;
    let count = 0;
    for (const candidate of this.history) {
      if (candidate === sign) {
        count++;
      }
    }
    return count / this.config.windowSize;
  }
}
