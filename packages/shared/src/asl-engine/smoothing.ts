import type { HandLandmarks } from "./types";

export class LandmarkSmoother {
  private window: HandLandmarks[] = [];

  private readonly windowSize = 5;

  private readonly coeffs = [0.0857, -0.1428, -0.0857, 0.2571, 0.8857];

  smooth(current: HandLandmarks): HandLandmarks {
    this.window.push(current);

    if (this.window.length > this.windowSize) {
      this.window.shift();
    }

    if (this.window.length < this.windowSize) {
      return current;
    }

    const smoothed: HandLandmarks = [];
    const landmarkCount = current.length;

    for (let index = 0; index < landmarkCount; index += 1) {
      let sx = 0;
      let sy = 0;
      let sz = 0;

      for (let coeffIndex = 0; coeffIndex < this.windowSize; coeffIndex += 1) {
        const point = this.window[coeffIndex]![index]!;
        const coeff = this.coeffs[coeffIndex]!;
        sx += point.x * coeff;
        sy += point.y * coeff;
        sz += point.z * coeff;
      }

      smoothed.push({
        x: sx,
        y: sy,
        z: sz,
      });
    }

    return smoothed;
  }

  reset(): void {
    this.window = [];
  }
}
