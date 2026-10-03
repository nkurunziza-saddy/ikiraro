import type { TrainedSign } from "./canonical-landmarks";
import { LETTER_TEMPLATES } from "./letter-templates";
import { mirrorX, normalizeHand } from "./normalize";
import type { ClassificationResult, HandLandmarks, Point3D, SignRecognizer } from "./types";

/**
 * Template-matching fingerspelling recognizer.
 * - Multi-template: uses style clusters; best template wins.
 * - Chirality-invariant: scores as-is and mirrored.
 * - Margin acceptance: requires an absolute score and a lead over runner-up.
 */

// Fingertips and x/y carry most discriminative signal.
const TIP_WEIGHT = 3;
const TIPS = new Set([4, 8, 12, 16, 20]);
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

  private similarityScale = 2.0;
  private threshold = 0.48;
  private margin = 0.05;

  private previousWrist: Point3D | null = null;
  private velocity: Point3D = { x: 0, y: 0, z: 0 };

  constructor(dataset: TrainedSign[] = LETTER_TEMPLATES) {
    this.dataset = dataset;
  }

  process(worldLandmarks: HandLandmarks, imageLandmarks?: HandLandmarks): ClassificationResult {
    if (
      worldLandmarks.length !== 21 ||
      worldLandmarks.some(
        (point) =>
          !Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z),
      )
    ) {
      this.reset();
      return this.noMatch();
    }

    const normalized = normalizeHand(worldLandmarks);
    const mirrored = mirrorX(normalized);

    // Normalization places the wrist at the origin: motion must be measured
    // before normalization, preferably in camera space (world landmarks are hand-relative).
    const wrist = imageLandmarks?.[0] ?? worldLandmarks[0]!;
    const previous = this.previousWrist;
    this.velocity = previous
      ? { x: wrist.x - previous.x, y: wrist.y - previous.y, z: wrist.z - previous.z }
      : { x: 0, y: 0, z: 0 };
    this.previousWrist = { ...wrist };

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
      isTransitioning: this.detectIsMoving(),
      candidates: ranked.slice(0, 3).map(([name, score]) => ({ name, score })),
    };
  }

  reset(): void {
    this.previousWrist = null;
    this.velocity = { x: 0, y: 0, z: 0 };
  }

  private detectIsMoving(): boolean {
    const v = this.getVelocity();
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2) > 0.08;
  }

  private getVelocity(): Point3D {
    return { ...this.velocity };
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
