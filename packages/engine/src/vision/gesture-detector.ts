import type { Point3D, IGestureDetector } from "./types";

export interface GestureDetection {
  type: "double-letter-slide" | "double-letter-bounce" | "none";
  confidence: number;
}

/**
 * Detects subtle gestures during fingerspelling, such as those used for double letters.
 */
export class IkiraroGestureDetector implements IGestureDetector {
  private history: Point3D[] = [];
  private readonly WINDOW_SIZE = 15;
  private readonly PULSE_THRESHOLD = 0.4;

  update(velocity: Point3D): GestureDetection {
    this.history.push(velocity);
    if (this.history.length > this.WINDOW_SIZE) {
      this.history.shift();
    }

    if (this.history.length < this.WINDOW_SIZE) {
      return { type: "none", confidence: 0 };
    }

    const slide = this.detectPulse("x");
    const bounce = this.detectPulse("y");

    if (slide > bounce && slide > 0) {
      return { type: "double-letter-slide", confidence: slide };
    }

    if (bounce > 0) {
      return { type: "double-letter-bounce", confidence: bounce };
    }

    return { type: "none", confidence: 0 };
  }

  reset(): void {
    this.history = [];
  }

  private detectPulse(axis: "x" | "y"): number {
    const velocities = this.history.map((v) => v[axis]);
    const magnitudes = velocities.map(Math.abs);
    const peak = Math.max(...magnitudes);
    if (peak <= this.PULSE_THRESHOLD) return 0;

    const peakIndex = magnitudes.indexOf(peak);
    if (peakIndex < 2 || peakIndex > this.WINDOW_SIZE - 3) return 0;

    const start = Math.max(...magnitudes.slice(0, 3));
    const end = Math.max(...magnitudes.slice(-3));
    const isPulse = peak > start * 1.8 && peak > end * 1.8;
    if (!isPulse) return 0;

    const signedPeak = velocities[peakIndex]!;
    const sameDirectionEnergy = velocities.reduce((sum, value) => {
      if (Math.sign(value) === Math.sign(signedPeak)) return sum + Math.abs(value);
      return sum;
    }, 0);
    const totalEnergy = magnitudes.reduce((sum, value) => sum + value, 0);
    const directionConsistency = totalEnergy > 0 ? sameDirectionEnergy / totalEnergy : 0;

    return directionConsistency >= 0.65 ? Math.min(1, peak) : 0;
  }
}
