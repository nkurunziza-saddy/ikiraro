import { extractFeatureVector } from "./feature-vector";
import { ASL_ALPHABET } from "./handshapes";
import { LandmarkSmoother } from "./smoothing";
import type {
  ClassificationResult,
  ClassifierConfig,
  HandLandmarks,
  HandshapeDefinition,
} from "./types";

export const DEFAULT_CLASSIFIER_CONFIG: ClassifierConfig = {
  windowSize: 9,
  rawScoreThreshold: 0.68,
  lockThreshold: 3,
  unlockThreshold: 3,
  motionVelocityThreshold: 0.15,
};

export class SensaSurgicalClassifier {
  private smoother = new LandmarkSmoother();
  private history: Array<string | null> = [];
  private config: ClassifierConfig;
  private lockedSign: string | null = null;
  private lockFrames = 0;
  private definitionsByFingerprint = new Map<string, HandshapeDefinition[]>();

  constructor(config: Partial<ClassifierConfig> = {}) {
    this.config = { ...DEFAULT_CLASSIFIER_CONFIG, ...config };
    for (const def of ASL_ALPHABET) {
      const list = this.definitionsByFingerprint.get(def.fingerprint) ?? [];
      list.push(def);
      this.definitionsByFingerprint.set(def.fingerprint, list);
    }
  }

  process(landmarks: HandLandmarks, imageLandmarks?: HandLandmarks): ClassificationResult {
    const smoothed = this.smoother.smooth(landmarks);
    const vector = extractFeatureVector(smoothed, imageLandmarks);

    vector.velocity = this.smoother.getVelocity();
    const speed = Math.sqrt(
      vector.velocity.x ** 2 + vector.velocity.y ** 2 + vector.velocity.z ** 2,
    );
    vector.isMoving = speed > this.config.motionVelocityThreshold;

    const relevantDefs = this.definitionsByFingerprint.get(vector.fingerprint) ?? [];
    const candidates: Array<{ name: string; score: number }> = [];

    for (const def of relevantDefs) {
      let score = def.disambiguate ? def.disambiguate(vector) : 0.7;
      // requiresMotion was previously defined but never enforced — this fixes that.
      if (def.requiresMotion && !vector.isMoving) score *= 0.2;
      candidates.push({ name: def.name, score });
    }

    candidates.sort((a, b) => b.score - a.score);

    const match = candidates[0] ?? null;
    const rawSign = match && match.score >= this.config.rawScoreThreshold ? match.name : null;

    this.history.push(rawSign);
    if (this.history.length > this.config.windowSize) this.history.shift();

    const consensusSign = this.getConsensus();
    const stableSign = this.applyHysteresis(consensusSign);
    const confidence = this.getConfidence(stableSign);

    return { sign: stableSign, confidence, vector, candidates: candidates.slice(0, 3) };
  }

  private getConsensus(): string | null {
    const counts: Record<string, number> = {};
    for (const sign of this.history) {
      if (sign) counts[sign] = (counts[sign] ?? 0) + 1;
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
      if (candidate === sign) count++;
    }
    return count / this.config.windowSize;
  }

  reset(): void {
    this.smoother.reset();
    this.history = [];
    this.lockedSign = null;
    this.lockFrames = 0;
  }
}
