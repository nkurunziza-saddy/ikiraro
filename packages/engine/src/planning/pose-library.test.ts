import { describe, it, expect } from "vitest";
import { resolveHandshape, mixHandshapes, ASL_HAND_POSES, REST_POSE } from "./pose-library";
describe("Pose Library", () => {
  describe("resolveHandshape", () => {
    it("should resolve known ASL letters", () => {
      const poseA = resolveHandshape("A");
      expect(poseA).toEqual(ASL_HAND_POSES["A"]);
      const poseB = resolveHandshape("b");
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
      const a = resolveHandshape("A");
      const b = resolveHandshape("B");
      const mixed = mixHandshapes(a, b, 0.5);

      expect(mixed.thumb.splay).toBeCloseTo(0.15);

      expect(mixed.index.mcp).toBeCloseTo(0.77);
    });
  });
});
