import { describe, expect, it } from "vitest";
import "./index";
import { buildFrameQueue } from "./frame-queue";
import { computeMotionDelta } from "./motion-paths";
describe("motion paths", () => {
  it("keeps HELLO as a one-way salute instead of a returning arc", () => {
    const queue = buildFrameQueue({
      clauses: [
        {
          intent: "test",
          tokens: [{ type: "lexeme", lexemeId: "HELLO", durationMs: 100, emphasis: "normal" }],
        },
      ],
      glossText: "HELLO",
      metadata: { confidence: 1, notes: [], reviewNeeded: false },
      normalizedText: "HELLO",
      sourceText: "HELLO",
      strategy: "deterministic",
      track: "deterministic",
    });
    expect(queue[0]?.motion).toBe("wave");
    expect(queue[0]?.duration).toBeGreaterThanOrEqual(100);
    expect(computeMotionDelta("salute", 1).rArmZDelta).toBeGreaterThan(0.4);
  });
  it("delays salute's sweep until the arm has reached the forehead", () => {
    const approach = computeMotionDelta("salute", 0.2);
    const stroke = computeMotionDelta("salute", 0.72);
    expect(approach.rArmZDelta).toBeCloseTo(0);
    expect(stroke.rArmZDelta).toBeGreaterThan(0.6);
    expect(stroke.rHandZDelta ?? 0).not.toBe(0);
  });
  it("starts circular motions from the base arm pose", () => {
    const start = computeMotionDelta("circle", 0);
    const end = computeMotionDelta("circle", 1);
    expect(start.rArmXDelta).toBeCloseTo(0);
    expect(start.rArmZDelta).toBeCloseTo(0);
    expect(end.rArmXDelta).toBeCloseTo(0);
    expect(end.rArmZDelta).toBeCloseTo(0);
  });
  it("includes mirrored left-arm motion for two-handed taps", () => {
    const peak = computeMotionDelta("two-hand-tap", 0.25);
    expect(peak.rArmZDelta).toBeGreaterThan(0.1);
    expect(peak.lArmZDelta ?? 0).toBeLessThan(-0.1);
  });
});
