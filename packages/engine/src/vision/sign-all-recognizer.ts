import type { ClassificationResult, HandLandmarks, SignRecognizer, Point3D } from "./types";
import { ASL_CANONICAL_DATASET, type TrainedSign } from "./canonical-landmarks";

/**
 * SignAllRecognizer implements a professional, data-driven recognition engine.
 *
 * Capabilities:
 * 1. Procrustes Alignment: Invariant to scale and rotation.
 * 2. Average Landmark Matching: Matches against research centroids (Kaggle/Google).
 * 3. Dynamic Trajectory Matching: Handlers motion-dependent signs like J and Z.
 * 4. Weighted Similarity: Tips are prioritized for higher differentiation.
 */
export class SignAllRecognizer implements SignRecognizer {
  private dataset: TrainedSign[];
  private threshold = 0.84;

  // Temporal history for motion detection and trajectory matching
  private history: HandLandmarks[] = [];
  private windowSize = 10;

  constructor(dataset: TrainedSign[] = ASL_CANONICAL_DATASET) {
    this.dataset = dataset;
  }

  process(worldLandmarks: HandLandmarks, _imageLandmarks?: HandLandmarks): ClassificationResult {
    if (worldLandmarks.length < 21) {
      this.history = [];
      return this.noMatch();
    }

    // 1. Normalize and Align (Orientation-Invariant)
    const normalized = this.normalizeAndAlign(worldLandmarks);

    // 2. Update temporal window
    this.history.push(normalized);
    if (this.history.length > this.windowSize) this.history.shift();

    // 3. Find matches in dataset
    let bestMatch: TrainedSign | null = null;
    let maxSimilarity = 0;

    for (const trained of this.dataset) {
      let similarity = this.calculatePoseSimilarity(normalized, trained.landmarks);

      // 4. Refine with Motion Signature if applicable
      if (trained.motionSignature && trained.motionLandmarkIndex !== undefined) {
        const motionSim = this.calculateMotionSimilarity(trained);
        // Blend pose and motion similarity
        similarity = similarity * 0.4 + motionSim * 0.6;
      }

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = trained;
      }
    }

    const isMatch = maxSimilarity >= this.threshold;
    const sign = isMatch ? (bestMatch?.name ?? null) : null;
    const confidence = isMatch ? maxSimilarity : 0;
    const isMoving = this.detectIsMoving();

    return {
      sign,
      confidence,
      velocity: this.getVelocity(),
      isMoving,
      candidates: bestMatch ? [{ name: bestMatch.name, score: maxSimilarity }] : [],
    };
  }

  reset(): void {
    this.history = [];
  }

  private normalizeAndAlign(landmarks: HandLandmarks): HandLandmarks {
    const wrist = landmarks[0]!;
    const middleBase = landmarks[9]!;

    const centered = landmarks.map((p) => ({
      x: p.x - wrist.x,
      y: p.y - wrist.y,
      z: p.z - wrist.z,
    }));

    let maxDist = 0.0001;
    for (const p of centered) {
      const d = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2);
      if (d > maxDist) maxDist = d;
    }

    const alignX = middleBase.x - wrist.x;
    const alignY = middleBase.y - wrist.y;
    const angle = Math.atan2(alignY, alignX);

    const cos = Math.cos(-angle + Math.PI / 2);
    const sin = Math.sin(-angle + Math.PI / 2);

    return centered.map((p) => ({
      x: (p.x * cos - p.y * sin) / maxDist,
      y: (p.x * sin + p.y * cos) / maxDist,
      z: p.z / maxDist,
    }));
  }

  private calculatePoseSimilarity(a: HandLandmarks, b: HandLandmarks): number {
    let weightedDist = 0;
    let totalWeight = 0;
    const count = Math.min(a.length, b.length);

    for (let i = 0; i < count; i++) {
      const weight = i % 4 === 0 && i > 0 ? 3 : 1;
      const dx = a[i]!.x - b[i]!.x;
      const dy = a[i]!.y - b[i]!.y;
      const dz = a[i]!.z - b[i]!.z;
      weightedDist += Math.sqrt(dx * dx + dy * dy + dz * dz) * weight;
      totalWeight += weight;
    }
    return Math.max(0, 1 - (weightedDist / totalWeight) * 1.6);
  }

  /**
   * Compares the history of a specific landmark against the trained motion signature.
   */
  private calculateMotionSimilarity(trained: TrainedSign): number {
    if (this.history.length < 3 || !trained.motionSignature) return 0;

    const index = trained.motionLandmarkIndex!;
    if (index < 0 || this.history.some((h) => index >= h.length)) return 0;
    const livePath = this.history.map((h) => h[index]!);

    // Simple path correlation (normalized Euclidean distance of points)
    let totalDist = 0;
    const sig = trained.motionSignature;
    const pathCount = Math.min(livePath.length, sig.length);

    for (let i = 0; i < pathCount; i++) {
      const dx = livePath[livePath.length - 1 - i]!.x - sig[sig.length - 1 - i]!.x;
      const dy = livePath[livePath.length - 1 - i]!.y - sig[sig.length - 1 - i]!.y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }

    return Math.max(0, 1 - (totalDist / pathCount) * 2.0);
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
