import { describe, it, expect } from "vitest";
import { resolveHandshape, mixHandshapes, ASL_HAND_POSES, REST_POSE } from "./pose-library";

describe("Pose Library", () => {
  describe("resolveHandshape", () => {
    it("should resolve known ASL letters", () => {
      const poseA = resolveHandshape("A");
      expect(poseA).toEqual(ASL_HAND_POSES["A"]);

      const poseB = resolveHandshape("b"); // Case insensitive
      expect(poseB).toEqual(ASL_HAND_POSES["B"]);
    });

    it("should return REST_POSE for unknown keys", () => {
      const pose = resolveHandshape("unknown");
      expect(pose).toEqual(REST_POSE);
    });
  });

  describe("mixHandshapes", () => {
    it("should return start pose when factor is 0", () => {
      const a = resolveHandshape("A");
      const b = resolveHandshape("B");
      expect(mixHandshapes(a, b, 0)).toEqual(a);
    });

    it("should return end pose when factor is 1", () => {
      const a = resolveHandshape("A");
      const b = resolveHandshape("B");
      expect(mixHandshapes(a, b, 1)).toEqual(b);
    });

    it("should interpolate between two handshapes", () => {
      const a = resolveHandshape("A"); // Thumb splay -0.25
      const b = resolveHandshape("B"); // Thumb splay 0.55

      const mixed = mixHandshapes(a, b, 0.5);

      // Expected: -0.25 + (0.55 - (-0.25)) * 0.5 = -0.25 + 0.8 * 0.5 = -0.25 + 0.4 = 0.15
      expect(mixed.thumb.splay).toBeCloseTo(0.15);

      // Check a finger too
      // A index: CURL (1.5, 1.3, 0.7, 0)
      // B index: f(0.04, 0.03, 0.03, -0.05)
      // mix: (1.5 + 0.04)/2 = 0.77
      expect(mixed.index.mcp).toBeCloseTo(0.77);
    });
  });
});
