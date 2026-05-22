import type { HandLandmarks, Point3D, ILandmarkSmoother } from "./types";
class LowPassFilter {
  y: number = 0;
  initialized: boolean = false;
  filter(value: number, alpha: number): number {
    if (!this.initialized) {
      this.y = value;
      this.initialized = true;
      return value;
    }
    this.y = alpha * value + (1 - alpha) * this.y;
    return this.y;
  }
}
class OneEuroFilter3D {
  private x = new LowPassFilter();
  private y = new LowPassFilter();
  private z = new LowPassFilter();
  private dx = new LowPassFilter();
  private dy = new LowPassFilter();
  private dz = new LowPassFilter();
  private lastX: number = 0;
  private lastY: number = 0;
  private lastZ: number = 0;
  private initialized: boolean = false;
  constructor(
    private minCutoff: number = 1.0,
    private beta: number = 0.007,
    private dCutoff: number = 1.0,
  ) {}
  filter(value: Point3D): Point3D {
    const freq = 30;
    const dxVal = !this.initialized ? 0 : (value.x - this.lastX) * freq;
    const dyVal = !this.initialized ? 0 : (value.y - this.lastY) * freq;
    const dzVal = !this.initialized ? 0 : (value.z - this.lastZ) * freq;
    this.lastX = value.x;
    this.lastY = value.y;
    this.lastZ = value.z;
    this.initialized = true;
    const alphaD = this.getAlpha(freq, this.dCutoff);
    const edx = this.dx.filter(dxVal, alphaD);
    const edy = this.dy.filter(dyVal, alphaD);
    const edz = this.dz.filter(dzVal, alphaD);
    return {
      x: this.x.filter(value.x, this.getAlpha(freq, this.minCutoff + this.beta * Math.abs(edx))),
      y: this.y.filter(value.y, this.getAlpha(freq, this.minCutoff + this.beta * Math.abs(edy))),
      z: this.z.filter(value.z, this.getAlpha(freq, this.minCutoff + this.beta * Math.abs(edz))),
    };
  }
  getDerivative(): Point3D {
    return { x: this.dx.y, y: this.dy.y, z: this.dz.y };
  }
  private getAlpha(freq: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / freq;
    return 1.0 / (1.0 + tau / te);
  }
  reset(): void {
    this.initialized = false;
    this.x.initialized = false;
    this.y.initialized = false;
    this.z.initialized = false;
    this.dx.initialized = false;
    this.dy.initialized = false;
    this.dz.initialized = false;
  }
}
export class LandmarkSmoother implements ILandmarkSmoother {
  private filters: OneEuroFilter3D[] = [];
  private lastSmoothed: HandLandmarks | null = null;
  smooth(current: HandLandmarks): HandLandmarks {
    if (this.filters.length !== current.length) {
      this.filters = current.map(() => new OneEuroFilter3D());
    }
    const smoothed: HandLandmarks = [];
    for (let i = 0; i < current.length; i++) {
      smoothed.push(this.filters[i]!.filter(current[i]!));
    }
    this.lastSmoothed = smoothed;
    return smoothed;
  }
  getVelocity(): Point3D {
    if (!this.lastSmoothed || this.lastSmoothed.length < 21) {
      return { x: 0, y: 0, z: 0 };
    }
    const filter = this.filters[9];
    return filter ? filter.getDerivative() : { x: 0, y: 0, z: 0 };
  }
  reset(): void {
    for (const filter of this.filters) filter.reset();
    this.lastSmoothed = null;
  }
}
