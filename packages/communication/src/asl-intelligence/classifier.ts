import {
  extractFeatureVector,
  LandmarkSmoother,
  type ClassificationResult,
  type HandLandmarks,
} from "@sensa/shared";

import { ASL_ALPHABET, matchHandshape } from "./handshapes";

export class SensaSurgicalClassifier {
  private smoother = new LandmarkSmoother();

  private history: Array<string | null> = [];

  private readonly windowSize = 5;

  private readonly rawScoreThreshold = 0.55;

  private lockedSign: string | null = null;

  private lockFrames = 0;

  private readonly lockThreshold = 3;

  private readonly unlockThreshold = 3;

  process(landmarks: HandLandmarks): ClassificationResult {
    const smoothed = this.smoother.smooth(landmarks);
    const vector = extractFeatureVector(smoothed);
    const match = matchHandshape(vector, ASL_ALPHABET);
    const rawSign = match && match.score >= this.rawScoreThreshold ? match.name : null;

    this.history.push(rawSign);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    const consensusSign = this.getConsensus();
    const stableSign = this.applyHysteresis(consensusSign);
    const confidence = this.getConfidence(stableSign);

    return {
      sign: stableSign,
      confidence,
      vector,
      candidates: match?.candidates ?? [],
    };
  }

  private getConsensus(): string | null {
    const counts: Record<string, number> = {};

    for (const sign of this.history) {
      if (sign) {
        counts[sign] = (counts[sign] || 0) + 1;
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

    return bestCount >= 2 ? best : null;
  }

  private applyHysteresis(consensus: string | null): string | null {
    if (consensus === this.lockedSign) {
      this.lockFrames = 0;
      return this.lockedSign;
    }

    this.lockFrames += 1;

    if (consensus === null) {
      if (this.lockFrames >= this.unlockThreshold) {
        this.lockedSign = null;
        this.lockFrames = 0;
      }

      return this.lockedSign;
    }

    if (this.lockFrames >= this.lockThreshold) {
      this.lockedSign = consensus;
      this.lockFrames = 0;
    }

    return this.lockedSign;
  }

  private getConfidence(sign: string | null): number {
    if (!sign) {
      return 0;
    }

    let count = 0;
    for (const candidate of this.history) {
      if (candidate === sign) {
        count += 1;
      }
    }

    return count / this.windowSize;
  }

  reset(): void {
    this.smoother.reset();
    this.history = [];
    this.lockedSign = null;
    this.lockFrames = 0;
  }
}
