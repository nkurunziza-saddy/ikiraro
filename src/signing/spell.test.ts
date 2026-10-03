import { describe, expect, it } from "vite-plus/test";
import { ALPHABET } from "./alphabet.ts";
import { figure, FOREARM, HOME, REST, SHOULDER, UPPER_ARM } from "./body.ts";
import { distance } from "./math.ts";
import { poseAt, spell } from "./spell.ts";

const holding = (text: string, key: number) => {
  const spelling = spell(text);
  const { at, until } = spelling.keys[key]!;
  return poseAt(spelling, (at + until) / 2);
};

describe("spell", () => {
  it("lays out one key per letter between two rests", () => {
    const { keys, duration } = spell("hi");
    expect(keys.map((key) => key.char)).toEqual([-1, 0, 1, -1]);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i]!.from).toBe(keys[i - 1]!.until);
      expect(keys[i]!.at).toBeGreaterThan(keys[i]!.from);
    }
    expect(duration).toBe(keys.at(-1)!.until);
  });

  it("starts and ends at rest, and shows each letter while holding it", () => {
    const spelling = spell("ok");
    expect(poseAt(spelling, 0)).toMatchObject({ ...REST, char: -1 });
    expect(poseAt(spelling, spelling.duration)).toMatchObject({ ...REST, char: -1 });
    expect(poseAt(spelling, 99)).toMatchObject({ ...REST, char: -1 });
    expect(holding("ok", 1)).toMatchObject({ shape: ALPHABET.O!.shape, place: HOME, char: 0 });
    expect(holding("ok", 2)).toMatchObject({ shape: ALPHABET.K!.shape, char: 1 });
  });

  it("slides a repeated letter outwards instead of re-forming it", () => {
    const first = holding("ll", 1);
    const second = holding("ll", 2);
    expect(second.shape).toBe(first.shape);
    expect(second.place[0]).toBeLessThan(first.place[0] - 0.03);
    expect(holding("lol", 3).place[0]).toBeGreaterThan(second.place[0]);
  });

  it("drifts outwards along a word and comes back for the next", () => {
    expect(holding("ab c", 2).place[0]).toBeLessThan(holding("ab c", 1).place[0]);
    expect(holding("ab c", 3).place).toEqual(HOME);
  });

  it("drops the wrist for letters that hang", () => {
    expect(holding("p", 1).place[1]).toBeLessThan(HOME[1] - 0.05);
  });

  it("treats any run of non-letters as one pause", () => {
    expect(spell("a b").duration).toBeGreaterThan(spell("ab").duration);
    expect(spell("a  -  b").duration).toBe(spell("a b").duration);
    expect(spell("  a").duration).toBe(spell("a").duration);
    expect(spell("123").duration).toBe(0);
    expect(poseAt(spell(""), 1)).toMatchObject({ ...REST, char: -1 });
  });

  it("moves the wrist while holding J and Z", () => {
    const spelling = spell("z");
    const { at, until } = spelling.keys[1]!;
    const travelled = distance(poseAt(spelling, at).place, poseAt(spelling, until - 1e-6).place);
    expect(travelled).toBeGreaterThan(0.1);
  });

  it("never jumps or jerks: every joint stays within what a hand can do", () => {
    const spelling = spell("the quick brown fox jumps over a lazy dog");
    const step = 1 / 240;
    let before = figure(poseAt(spelling, 0));
    let speed = 0;
    let fastest = 0;
    let hardest = 0;
    for (let t = step; t <= spelling.duration; t += step) {
      const now = figure(poseAt(spelling, t));
      let moving = 0;
      now.forEach((capsule, i) => {
        moving = Math.max(moving, distance(capsule.b, before[i]!.b) / step);
      });
      fastest = Math.max(fastest, moving);
      hardest = Math.max(hardest, Math.abs(moving - speed) / step);
      speed = moving;
      before = now;
    }
    // Fingertips in fast fingerspelling reach a few metres per second, and a
    // dead stop or start would show up as thousands of metres per second squared.
    expect(fastest).toBeLessThan(4);
    expect(hardest).toBeLessThan(60);
  });
});

describe("body", () => {
  it("keeps the arm bones their length at every moment", () => {
    const spelling = spell("jazz quiz hop");
    const count = figure(REST).length;
    for (let t = 0; t <= spelling.duration; t += 0.05) {
      const capsules = figure(poseAt(spelling, t));
      expect(capsules).toHaveLength(count);
      const arm = capsules.findLast((c) => distance(c.a, SHOULDER) === 0)!;
      const forearm = capsules.find((c) => c.a === arm.b)!;
      expect(distance(arm.a, arm.b)).toBeCloseTo(UPPER_ARM, 9);
      expect(distance(forearm.a, forearm.b)).toBeCloseTo(FOREARM, 6);
      for (const { a, b } of capsules)
        for (const v of [...a, ...b]) expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("keeps the elbow close to the body whatever the hand is doing", () => {
    const spelling = spell("hqgpjz");
    for (let t = 0; t <= spelling.duration; t += 0.02) {
      const arm = figure(poseAt(spelling, t)).findLast((c) => distance(c.a, SHOULDER) === 0)!;
      // Never a wing: the elbow stays below the shoulder and within a hand's width of the side.
      expect(arm.b[1]).toBeLessThan(SHOULDER[1] - 0.1);
      expect(arm.b[0]).toBeGreaterThan(SHOULDER[0] - 0.2);
    }
  });

  it("breathes without moving the hands", () => {
    const [still, full] = [figure(REST), figure(REST, 1)];
    expect(full[0]!.a[1]).toBeGreaterThan(still[0]!.a[1]);
    expect(full.at(-1)!.b).toEqual(still.at(-1)!.b);
  });
});
