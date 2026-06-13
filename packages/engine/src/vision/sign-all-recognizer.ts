import type { TrainedSign } from "./canonical-landmarks";
import { LETTER_TEMPLATES } from "./letter-templates";
import { mirrorX, normalizeHand } from "./normalize";
import type { ClassificationResult, HandLandmarks, Point3D, SignRecognizer } from "./types";

/**
 * Template-matching fingerspelling recognizer.
 *
 * - Multi-template: a letter may have several templates (style clusters);
 *   the letter's score is its best template's score.
 * - Chirality-invariant: the input is scored as-is and mirrored, best wins —
 *   this absorbs the capture pipeline's selfie mirroring and supports
 *   left-handed signers with the same template set.
 * - Margin acceptance: a match requires both an absolute score and a lead over
 *   the runner-up letter, which suppresses flicker between confusable pairs
 *   (M/N/S/T, U/R, K/V).
 *
 * Constants calibrated on held-out sid220/asl-now-fingerspelling samples —
 * see scripts/eval-recognition.ts.
 */

// Fingertips carry most of the discriminative signal.
const TIP_WEIGHT = 3;
const TIPS = new Set([4, 8, 12, 16, 20]);
// MediaPipe image-landmark depth is noisy; let x/y dominate.
const Z_WEIGHT = 0.5;

/** Weighted RMS distance between two normalized hands. */
export function handDistance(a: HandLandmarks, b: HandLandmarks): number {
  let sum = 0;
  let totalWeight = 0;
  const count = Math.min(a.length, b.length);
  for (let i = 0; i < count; i++) {
    const w = TIPS.has(i) ? TIP_WEIGHT : 1;
    const dx = a[i]!.x - b[i]!.x;
    const dy = a[i]!.y - b[i]!.y;
    const dz = (a[i]!.z - b[i]!.z) * Z_WEIGHT;
    sum += w * (dx * dx + dy * dy + dz * dz);
    totalWeight += w;
  }
  return Math.sqrt(sum / Math.max(totalWeight, 1));
}

export class SignAllRecognizer implements SignRecognizer {
  private dataset: TrainedSign[];

  // Calibrated on held-out data (eval-recognition.ts):
  private similarityScale = 2.0; // similarity = 1 - distance * scale
  private threshold = 0.48; // ≈ p10 of true-match scores on held-out data
  private margin = 0.05; // ≈ p10 of true-match lead over the runner-up

  private history: HandLandmarks[] = [];
  private windowSize = 10;

  constructor(dataset: TrainedSign[] = LETTER_TEMPLATES) {
    this.dataset = dataset;
  }

  process(worldLandmarks: HandLandmarks, _imageLandmarks?: HandLandmarks): ClassificationResult {
    if (worldLandmarks.length < 21) {
      this.history = [];
      return this.noMatch();
    }

    const normalized = normalizeHand(worldLandmarks);
    const mirrored = mirrorX(normalized);

    this.history.push(normalized);
    if (this.history.length > this.windowSize) this.history.shift();

    // Best score per letter across its templates and both chiralities.
    const byLetter = new Map<string, number>();
    for (const trained of this.dataset) {
      const d = Math.min(
        handDistance(normalized, trained.landmarks),
        handDistance(mirrored, trained.landmarks),
      );
      const similarity = Math.max(0, 1 - d * this.similarityScale);
      const prev = byLetter.get(trained.name);
      if (prev === undefined || similarity > prev) byLetter.set(trained.name, similarity);
    }

    const ranked = [...byLetter.entries()].sort((a, b) => b[1] - a[1]);
    const best = ranked[0];
    const second = ranked[1];

    const isMatch =
      best !== undefined &&
      best[1] >= this.threshold &&
      (second === undefined || best[1] - second[1] >= this.margin);

    return {
      sign: isMatch ? best[0] : null,
      confidence: isMatch ? best[1] : 0,
      velocity: this.getVelocity(),
      isMoving: this.detectIsMoving(),
      candidates: ranked.slice(0, 3).map(([name, score]) => ({ name, score })),
    };
  }

  reset(): void {
    this.history = [];
  }

  private detectIsMoving(): boolean {
    if (this.history.length < 2) return false;
    const v = this.getVelocity();
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2) > 0.08;
  }

  private getVelocity(): Point3D {
    if (this.history.length < 2) return { x: 0, y: 0, z: 0 };
    const curr = this.history[this.history.length - 1]![0]!;
    const prev = this.history[this.history.length - 2]![0]!;
    return { x: curr.x - prev.x, y: curr.y - prev.y, z: curr.z - prev.z };
  }

  private noMatch(): ClassificationResult {
    return {
      sign: null,
      confidence: 0,
      velocity: { x: 0, y: 0, z: 0 },
      isMoving: false,
      candidates: [],
    };
  }
}
