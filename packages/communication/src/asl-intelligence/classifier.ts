import {
  extractFeatureVector,
  LandmarkSmoother,
  type ClassificationResult,
  type HandLandmarks,
} from "@sensa/shared";

import { ASL_ALPHABET, type HandshapeDefinition } from "./handshapes";

export class SensaSurgicalClassifier {
  private smoother = new LandmarkSmoother();

  private history: Array<string | null> = [];

  private readonly windowSize = 7;

  private readonly rawScoreThreshold = 0.55;

  private lockedSign: string | null = null;

  private lockFrames = 0;

  private readonly lockThreshold = 3;

  private readonly unlockThreshold = 3;

  private definitionsByFingerprint = new Map<string, HandshapeDefinition[]>();

  constructor() {
    for (const definition of ASL_ALPHABET) {
      const list = this.definitionsByFingerprint.get(definition.fingerprint) || [];
      list.push(definition);
      this.definitionsByFingerprint.set(definition.fingerprint, list);
    }
  }

  process(landmarks: HandLandmarks): ClassificationResult {
    const smoothed = this.smoother.smooth(landmarks);
    const vector = extractFeatureVector(smoothed);

    // Efficient lookup by fingerprint
    const relevantDefinitions = this.definitionsByFingerprint.get(vector.fingerprint) || [];
    const candidates: Array<{ name: string; score: number }> = [];

    for (const definition of relevantDefinitions) {
      const score = definition.disambiguate ? definition.disambiguate(vector) : 0.7;
      candidates.push({ name: definition.name, score });
    }

    candidates.sort((a, b) => b.score - a.score);

    const match = candidates.length > 0 ? candidates[0]! : null;
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
      candidates: candidates.slice(0, 3),
    };
  }

  getTopCandidates(): Array<{ name: string; score: number }> {
    // This would ideally return candidates from the most recent 'process' call
    // The ClassificationResult already returns them, so this might be for external use.
    return [];
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

    // Require at least 3 frames of consensus in a window of 7
    return bestCount >= 3 ? best : null;
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
