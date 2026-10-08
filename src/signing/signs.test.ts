import { describe, expect, it } from "vite-plus/test";
import { PALM } from "./body.ts";
import type { Pose } from "./body.ts";
import { toJoints } from "./hand.ts";
import { add, rotate, scale } from "./math.ts";
import { LEXICON } from "./signs.ts";
import { poseAt, spell } from "./spell.ts";

/** Where a joint of the hand is in the body's space. Joint 8 is the tip of the index finger. */
const joint = (pose: Pose, index: number) =>
  add(pose.place, rotate(pose.turn, scale(toJoints(pose.shape)[index]!, PALM)));
const during = (text: string, key: number, u = 0.5) => {
  const spelling = spell(text);
  const { at, until } = spelling.keys[key]!;
  return poseAt(spelling, at + (until - at) * u);
};

describe("signs", () => {
  it("signs a word that has a sign, and lights the whole word", () => {
    const { keys } = spell("hello");
    expect(keys.map((key) => key.letter)).toEqual([false, false, false, false]);
    expect(during("hello", 2)).toMatchObject({ char: 0, span: 5 });
  });

  it("spells the words around a sign", () => {
    const spans = spell("hello bob").keys.map((key) => [key.char, key.span]);
    expect(spans).toEqual([
      [-1, 0],
      [0, 5],
      [0, 5],
      [6, 1],
      [7, 1],
      [8, 1],
      [-1, 0],
    ]);
  });

  it("matches a phrase before its words", () => {
    expect(spell("thank you").keys.filter((key) => key.char >= 0)).toHaveLength(
      LEXICON["THANK YOU"]!.length,
    );
    expect(during("thank you", 1)).toMatchObject({ char: 0, span: 9 });
    expect(spell("thank").keys.filter((key) => key.letter)).toHaveLength(5);
  });

  it("signs I as ME but leaves other words that start with I alone", () => {
    expect(spell("i").keys[1]!.pose.shape).toBe(LEXICON.ME![0]!.shape);
    expect(spell("it").keys.filter((key) => key.letter)).toHaveLength(2);
  });

  it("puts ME's index finger on the chest", () => {
    // The touch comes about a third of the way through the hold.
    const tip = joint(during("me", 1, 0.3125), 8);
    expect(Math.abs(tip[0])).toBeLessThan(0.05);
    expect(tip[1]).toBeGreaterThan(-0.2);
    expect(tip[1]).toBeLessThan(0);
    expect(tip[2]).toBeGreaterThan(0.09);
    expect(tip[2]).toBeLessThan(0.14);
  });

  it("starts HELLO at the temple and carries it outwards", () => {
    const [start, end] = [during("hello", 1), during("hello", 2)];
    const tip = joint(start, 12);
    expect(tip[1]).toBeGreaterThan(0.26);
    expect(Math.abs(tip[0])).toBeLessThan(0.12);
    expect(end.place[0]).toBeLessThan(start.place[0] - 0.1);
  });

  it("points YOU at the viewer and nods YES", () => {
    const you = during("you", 1, 0.9);
    expect(rotate(you.turn, [0, 1, 0])[2]).toBeGreaterThan(0.9);
    const tilts = spell("yes").keys.map((key) => rotate(key.pose.turn, [0, 1, 0])[2]);
    expect(tilts.slice(1, 6).map((z) => z > 0.5)).toEqual([false, true, false, true, false]);
  });

  it("circles PLEASE on the chest and comes back for the next word", () => {
    const spelling = spell("please");
    const { at, until } = spelling.keys[1]!;
    const xs = Array.from(
      { length: 40 },
      (_, i) => poseAt(spelling, at + ((until - at) * i) / 39).place[0],
    );
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.07);
  });
});
