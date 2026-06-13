import type { MotionType } from "../../types";
import type { IRhythmEngine, RhythmResult } from "./types";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export class DefaultRhythmEngine implements IRhythmEngine {
  remap(progress: number, motion: MotionType): RhythmResult {
    const p = clamp01(progress);

    switch (motion) {
      case "arc":
      case "chest-pat":
      case "wrist-twist":
        return this.peakEnvelope(p);

      case "salute":
      case "forward-push":
      case "outward-sweep":
      case "pull-back":
      case "g-push":
      case "k-push":
        return {
          p: this.heldStrokeProgress(p),
          scale: 1.0,
        };

      case "tap":
      case "two-hand-tap":
        return {
          p: this.pulseProgress(p),
          scale: this.doubleTapPulse(this.pulseProgress(p)),
        };

      case "shake": {
        const q = this.pulseProgress(p, 0.14, 0.88);
        return {
          p: q,
          scale: this.envelopeScale(q, 0.18, 0.82),
        };
      }

      case "wave":
      case "circle":
      case "music-sweep":
      case "z-trace":
      case "j-trace":
      case "d-arc":
      case "n-dip": {
        const b = this.boundedStrokeProgress(p);
        return {
          p: b,
          scale: this.envelopeScale(b, 0.15, 0.85),
        };
      }

      default:
        return { p, scale: 1.0 };
    }
  }

  private peakEnvelope(progress: number, approach = 0.28, release = 0.72): RhythmResult {
    if (progress < approach) return { p: smoothStep(progress / approach), scale: 1.0 };
    if (progress < release) return { p: 1, scale: 1.0 };
    return { p: 1 - smoothStep((progress - release) / (1 - release)), scale: 1.0 };
  }

  private envelopeScale(progress: number, approach: number, release: number): number {
    const p = clamp01(progress);
    if (p < approach) return smoothStep(p / approach);
    if (p < release) return 1.0;
    return 1 - smoothStep((p - release) / (1 - release));
  }

  private heldStrokeProgress(progress: number, approachEnd = 0.2, strokeEnd = 0.82): number {
    if (progress <= approachEnd) return 0;
    if (progress >= strokeEnd) return 1;
    return smoothStep((progress - approachEnd) / (strokeEnd - approachEnd));
  }

  private boundedStrokeProgress(progress: number, approachEnd = 0.12, strokeEnd = 0.92): number {
    if (progress <= approachEnd) return 0;
    if (progress >= strokeEnd) return 1;
    return smoothStep((progress - approachEnd) / (strokeEnd - approachEnd));
  }

  private pulseProgress(progress: number, approachEnd = 0.12, strokeEnd = 0.9): number {
    if (progress <= approachEnd || progress >= strokeEnd) return 0;
    return (progress - approachEnd) / (strokeEnd - approachEnd);
  }

  private doubleTapPulse(progress: number): number {
    return Math.abs(Math.sin(progress * Math.PI * 2)) ** 1.35;
  }
}
