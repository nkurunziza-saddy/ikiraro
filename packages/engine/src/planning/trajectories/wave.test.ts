import { describe, expect, it } from "vite-plus/test";
import { WaveTrajectory } from "./implementations";

describe("restrained wave", () => {
  it("enters and leaves still, keeps the shoulder stable, and moves both ways", () => {
    const wave = new WaveTrajectory();
    expect(Math.abs(wave.evaluate(0).rHandZDelta!)).toBeLessThan(1e-8);
    expect(Math.abs(wave.evaluate(1).rHandZDelta!)).toBeLessThan(1e-8);
    expect(Math.abs(wave.evaluate(0.001).rHandZDelta!)).toBeLessThan(1e-6);
    const samples = Array.from({ length: 101 }, (_, i) => wave.evaluate(i / 100));
    expect(samples.some((s) => s.rHandZDelta! > 0.1)).toBe(true);
    expect(samples.some((s) => s.rHandZDelta! < -0.1)).toBe(true);
    for (const s of samples) {
      expect(Math.abs(s.rArmZDelta)).toBeLessThanOrEqual(0.035);
      expect(s.rArmXDelta).toBe(0);
      expect(s.rArmYDelta).toBe(0);
    }
  });
});
