import type { ITemporalSmoother, ClassifierConfig } from "../../types";
type DetectionObservation = {
  name: string;
  score: number;
};
/**
 * Smoothes raw detection candidates over time using consensus and hysteresis.
 * This prevents flickering and ensures stable detections in the UI.
 */
export class IkiraroTemporalSmoother implements ITemporalSmoother {
  private history: Array<DetectionObservation | null> = [];
  private lockedSign: string | null = null;
  private lockFrames = 0;
  constructor(private config: ClassifierConfig) {}
  smooth(candidates: Array<{ name: string; score: number }>): {
    sign: string | null;
    confidence: number;
  } {
    const rawObservation = this.getRawObservation(candidates);
    this.history.push(rawObservation);
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
    const evidence: Record<string, { frames: number; score: number }> = {};
    for (const observation of this.history) {
      if (observation) {
        const current = evidence[observation.name] ?? { frames: 0, score: 0 };
        current.frames += 1;
        current.score += observation.score;
        evidence[observation.name] = current;
      }
    }
    let best: string | null = null;
    let bestScore = 0;
    let bestFrames = 0;
    for (const [sign, value] of Object.entries(evidence)) {
      if (value.score > bestScore) {
        best = sign;
        bestScore = value.score;
        bestFrames = value.frames;
      }
    }
    return bestFrames >= this.config.lockThreshold ? best : null;
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
    this.lockedSign = consensus;
    this.lockFrames = 0;
    return this.lockedSign;
  }
  private getConfidence(sign: string | null): number {
    if (!sign) return 0;
    let weightedScore = 0;
    for (const observation of this.history) {
      if (observation?.name === sign) {
        weightedScore += observation.score;
      }
    }
    return Math.min(1, weightedScore / this.config.lockThreshold);
  }
  private getRawObservation(candidates: Array<{ name: string; score: number }>) {
    const match = candidates[0] ?? null;
    if (!match) return null;
    const runnerUp = candidates.find((candidate) => candidate.name !== match.name);
    const isAmbiguous =
      runnerUp !== undefined &&
      runnerUp.score >= this.config.minCandidateScore &&
      match.score - runnerUp.score < this.config.scoreGapThreshold;
    if (
      match.score < this.config.rawScoreThreshold ||
      match.score < this.config.minCandidateScore ||
      isAmbiguous
    ) {
      return null;
    }
    return { name: match.name, score: match.score };
  }
}
