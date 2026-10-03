import { describe, expect, it } from "vite-plus/test";
import { ALPHABET } from "./alphabet.ts";
import { blend, BONE_COUNT, BONE_LENGTHS, boneStart, fromJoints, toJoints } from "./hand.ts";
import { distance, length } from "./math.ts";

const shapes = Object.values(ALPHABET).map((letter) => letter.shape);

describe("hand", () => {
  it("survives a round trip through joint positions", () => {
    for (const shape of shapes) {
      const again = fromJoints(toJoints(shape));
      again.forEach((direction, bone) =>
        expect(distance(direction, shape[bone]!)).toBeLessThan(1e-9),
      );
    }
  });

  it("keeps every bone its length however two shapes are blended", () => {
    for (let i = 0; i < shapes.length; i++) {
      const a = shapes[i]!;
      const b = shapes[(i * 7 + 3) % shapes.length]!;
      for (const t of [0.1, 0.5, 0.9]) {
        const joints = toJoints(blend(a, b, (finger) => t * (1 - finger / 10)));
        for (let bone = 0; bone < BONE_COUNT; bone++) {
          const span = distance(joints[bone + 1]!, joints[boneStart(bone)]!);
          expect(span).toBeCloseTo(BONE_LENGTHS[bone]!, 9);
        }
      }
    }
  });

  it("blends from one shape to the other", () => {
    const [a, b] = [ALPHABET.A!.shape, ALPHABET.B!.shape];
    blend(a, b, 0).forEach((d, bone) => expect(distance(d, a[bone]!)).toBeLessThan(1e-9));
    blend(a, b, 1).forEach((d, bone) => expect(distance(d, b[bone]!)).toBeLessThan(1e-9));
    blend(a, b, 0.5).forEach((d) => expect(length(d)).toBeCloseTo(1, 9));
  });
});
