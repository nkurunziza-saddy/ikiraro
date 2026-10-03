import { describe, expect, it } from "vite-plus/test";
import { ALPHABET } from "./alphabet.ts";
import { BONE_COUNT, BONE_LENGTHS, toJoints } from "./hand.ts";
import { distance, length, rotate } from "./math.ts";

const joints = (letter: string) => toJoints(ALPHABET[letter]!.shape);
const [THUMB, INDEX, MIDDLE, RING, PINKY] = [4, 8, 12, 16, 20];
/** How high a fingertip stands above the wrist, as a share of the most that finger can reach. */
const height = (letter: string, tip: number) =>
  joints(letter)[tip]![1] / BONE_LENGTHS.slice(tip - 4, tip).reduce((sum, bone) => sum + bone, 0);

describe("alphabet", () => {
  it("has all 26 letters, each 20 unit directions", () => {
    expect(Object.keys(ALPHABET).sort().join("")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    for (const { shape } of Object.values(ALPHABET)) {
      expect(shape).toHaveLength(BONE_COUNT);
      for (const direction of shape) expect(length(direction)).toBeCloseTo(1, 6);
    }
  });

  it("extends the fingers each letter is known for", () => {
    const up = 0.8;
    const folded = 0.6;
    for (const tip of [INDEX, MIDDLE, RING, PINKY]) expect(height("B", tip)).toBeGreaterThan(up);
    for (const tip of [INDEX, MIDDLE, RING, PINKY]) expect(height("S", tip)).toBeLessThan(folded);
    expect(height("D", INDEX)).toBeGreaterThan(up);
    expect(height("D", MIDDLE)).toBeLessThan(folded);
    expect(height("I", PINKY)).toBeGreaterThan(up);
    expect(height("I", INDEX)).toBeLessThan(folded);
    for (const tip of [INDEX, MIDDLE]) expect(height("V", tip)).toBeGreaterThan(up);
    for (const tip of [RING, PINKY]) expect(height("V", tip)).toBeLessThan(folded);
    for (const tip of [INDEX, MIDDLE, RING]) expect(height("W", tip)).toBeGreaterThan(up);
    expect(height("W", PINKY)).toBeLessThan(folded);
    expect(height("Y", PINKY)).toBeGreaterThan(up);
    expect(height("Y", INDEX)).toBeLessThan(folded);
  });

  it("brings the thumb to the finger it should touch", () => {
    const touching = 0.3;
    expect(distance(joints("F")[THUMB]!, joints("F")[INDEX]!)).toBeLessThan(touching);
    expect(distance(joints("W")[THUMB]!, joints("W")[PINKY]!)).toBeLessThan(touching);
    expect(distance(joints("D")[THUMB]!, joints("D")[MIDDLE]!)).toBeLessThan(touching + 0.1);
    // In L the thumb is as far from the index as it gets.
    expect(distance(joints("L")[THUMB]!, joints("L")[INDEX]!)).toBeGreaterThan(1.2);
  });

  it("spreads V and closes U", () => {
    const gap = (letter: string) => distance(joints(letter)[INDEX]!, joints(letter)[MIDDLE]!);
    expect(gap("V")).toBeGreaterThan(gap("U") * 2);
  });

  it("points the composed letters the right way", () => {
    const fingers = (letter: string) => rotate(ALPHABET[letter]!.turn, [0, 1, 0]);
    const palm = (letter: string) => rotate(ALPHABET[letter]!.turn, [0, 0, 1]);
    expect(fingers("B")[1]).toBeCloseTo(1);
    expect(palm("B")[2]).toBeCloseTo(1);
    for (const letter of ["G", "H"]) {
      expect(fingers(letter)[0]).toBeGreaterThan(0.9);
      expect(palm(letter)[2]).toBeLessThan(-0.9);
    }
    for (const letter of ["P", "Q"]) expect(fingers(letter)[1]).toBeLessThan(-0.8);
    expect(ALPHABET.Q!.shape).toBe(ALPHABET.G!.shape);
    expect(ALPHABET.P!.shape).toBe(ALPHABET.K!.shape);
  });
});
