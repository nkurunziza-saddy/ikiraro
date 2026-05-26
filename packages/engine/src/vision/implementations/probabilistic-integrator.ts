import type { ITemporalSmoother, ClassifierConfig } from "../../types";

type ScoreDistribution = Map<string, number>;

/**
 * A deep integrator that maintains a history of score distributions.
 * It uses weighted temporal integration to provide stable, confident detections.
 * This is much more robust than plurality voting on binarized winners.
 */
export class IkiraroProbabilisticIntegrator implements ITemporalSmoother {
  private history: ScoreDistribution[] = [];
  private lockedSign: string | null = null;
  private lockFrames = 0;

  constructor(private config: ClassifierConfig) {}

  smooth(candidates: Array<{ name: string; score: number }>): {
    sign: string | null;
    confidence: number;
  } {
    // 1. Convert candidates to a distribution map
    const distribution: ScoreDistribution = new Map();
    for (const { name, score } of candidates) {
      distribution.set(name, score);
    }

    // 2. Manage history window
    this.history.push(distribution);
    if (this.history.length > this.config.windowSize) {
      this.history.shift();
    }

    // 3. Integrate scores over the window (Weighted Consensus)
    const integratedScores = new Map<string, number>();
    for (const dist of this.history) {
      for (const [name, score] of dist.entries()) {
        const current = integratedScores.get(name) ?? 0;
        integratedScores.set(name, current + score);
      }
    }

    // 4. Find the winner and evaluate signal quality
    let bestSign: string | null = null;
    let bestTotalScore = 0;
    let totalWindowSignal = 0;

    for (const [name, totalScore] of integratedScores.entries()) {
      totalWindowSignal += totalScore;
      if (totalScore > bestTotalScore) {
        bestTotalScore = totalScore;
        bestSign = name;
      }
    }

    // Runner-up check for ambiguity (Score Gap in the integrated space)
    let runnerUpScore = 0;
    for (const [name, totalScore] of integratedScores.entries()) {
      if (name !== bestSign && totalScore > runnerUpScore) {
        runnerUpScore = totalScore;
      }
    }

    const windowSize = this.history.length;
    const avgBestScore = bestTotalScore / windowSize;
    const scoreGap = (bestTotalScore - runnerUpScore) / windowSize;

    // Discard if signal is too weak or too ambiguous
    if (avgBestScore < this.config.minCandidateScore || scoreGap < this.config.scoreGapThreshold) {
      bestSign = null;
    }

    // 5. Apply Hysteresis for stable locking
    const stableSign = this.applyHysteresis(bestSign);

    // Confidence is normalized signal strength for the stable sign
    const confidence = this.calculateConfidence(stableSign, integratedScores);

    return { sign: stableSign, confidence };
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

    // Require consecutive frames of the same new consensus to switch (Lock Threshold)
    if (this.lockFrames >= this.config.lockThreshold) {
      this.lockedSign = consensus;
      this.lockFrames = 0;
    }

    return this.lockedSign;
  }

  private calculateConfidence(sign: string | null, integratedScores: Map<string, number>): number {
    if (!sign) return 0;
    const totalScore = integratedScores.get(sign) ?? 0;
    // Normalize by the window size and a typical "good" score
    const windowSize = this.history.length;
    return Math.min(1.0, totalScore / (windowSize * 0.85));
  }

  reset(): void {
    this.history = [];
    this.lockedSign = null;
    this.lockFrames = 0;
  }
}
