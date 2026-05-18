import type { Point3D, IGestureDetector } from "./types";

export interface GestureDetection {
  type: "double-letter-slide" | "double-letter-bounce" | "none";
  confidence: number;
}

/**
 * Detects subtle gestures during fingerspelling, such as those used for double letters.
 */
export class SensaGestureDetector implements IGestureDetector {
  private history: Point3D[] = [];
  private readonly WINDOW_SIZE = 15;

  update(velocity: Point3D): GestureDetection {
    this.history.push(velocity);
    if (this.history.length > this.WINDOW_SIZE) {
      this.history.shift();
    }

    if (this.history.length < this.WINDOW_SIZE) {
      return { type: "none", confidence: 0 };
    }

    // Detect lateral slide (X-axis movement peak)
    const xVelocities = this.history.map((v) => v.x);
    const maxAbsX = Math.max(...xVelocities.map(Math.abs));

    // A slide is typically a quick acceleration and deceleration in one direction.
    if (maxAbsX > 0.4) {
      // Check for 'pulse' shape: low -> high -> low
      const start = Math.abs(xVelocities[0]!);
      const mid = Math.abs(xVelocities[Math.floor(this.WINDOW_SIZE / 2)]!);
      const end = Math.abs(xVelocities[this.WINDOW_SIZE - 1]!);

      if (mid > start * 2 && mid > end * 2) {
        return { type: "double-letter-slide", confidence: Math.min(1, mid) };
      }
    }

    return { type: "none", confidence: 0 };
  }

  reset(): void {
    this.history = [];
  }
}
