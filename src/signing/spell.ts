import { ALPHABET } from "./alphabet.ts";
import type { Letter } from "./alphabet.ts";
import { HOME, PALM, REST } from "./body.ts";
import type { Pose } from "./body.ts";
import { blend } from "./hand.ts";
import { add, angleBetween, clamp, mix, qslerp, scale } from "./math.ts";

/**
 * Fingerspelling as a pure function of time. `spell` lays a text out as keys,
 * one per letter; `poseAt` says where the hand is at any moment. Nothing here
 * holds state, so playback can be paused, scrubbed, reversed or tested freely.
 */

/** Seconds, at normal speed. */
const TRAVEL = 0.2;
/** Turning the whole hand takes longer than re-forming it: seconds added per radian turned. */
const TURN = 0.13;
const HOLD = 0.22;
const MOVING_HOLD = 0.75;
const RAISE = 0.6;
const LOWER = 0.65;
const WORD_GAP = 0.3;
/** A repeated letter slides this far outwards, in palm lengths, instead of being re-formed. */
const REPEAT_SLIDE = 0.45;
/** How far, as a share of a transition, the last finger starts behind the first. */
const STAGGER = 0.24;
/** Fingers do not move together: the index leads, then thumb and middle, then the rest. */
const FINGER_ORDER = [1, 0, 1, 2, 3];

type Key = {
  /** Index of the character this key signs, or -1 for the resting hand. */
  char: number;
  pose: Pose;
  letter?: Letter;
  /** The hand leaves the previous key at `from`, arrives at `at` and holds until `until`. */
  from: number;
  at: number;
  until: number;
};

export type Spelling = { text: string; keys: readonly Key[]; duration: number };

export type Moment = Pose & {
  /** Index into the text of the letter on the hand, or -1 while it is at rest. */
  char: number;
};

/** A text as the characters that `Moment.char` indexes. */
export const characters = (text: string): string[] => Array.from(text);

export function spell(text: string): Spelling {
  const keys: Key[] = [{ char: -1, pose: REST, from: 0, at: 0, until: 0 }];
  let clock = 0;
  let slide = 0;
  let previous = "";
  characters(text).forEach((raw, char) => {
    const symbol = raw.toUpperCase();
    const letter = ALPHABET[symbol];
    const last = keys.at(-1)!;
    if (!letter) {
      // Anything that is not a letter is a pause, once, however long the run.
      if (previous !== "" && last.char >= 0) clock = last.until += WORD_GAP;
      previous = "";
      slide = 0;
      return;
    }
    slide = symbol === previous ? slide + 1 : 0;
    previous = symbol;
    const from = clock;
    const turned = angleBetween(last.letter?.turnTo ?? last.pose.turn, letter.turn);
    const at = from + (last.char < 0 ? RAISE : TRAVEL + TURN * turned);
    clock = at + (letter.path ? MOVING_HOLD : HOLD);
    keys.push({
      char,
      letter,
      pose: {
        shape: letter.shape,
        turn: letter.turn,
        place: add(HOME, [-slide * REPEAT_SLIDE * PALM, 0, 0]),
      },
      from,
      at,
      until: clock,
    });
  });
  if (keys.length > 1) {
    keys.push({ char: -1, pose: REST, from: clock, at: clock + LOWER, until: clock + LOWER });
  }
  return { text, keys, duration: keys.at(-1)!.until };
}

/** Minimum-jerk easing, the velocity profile of an unhurried human reach. */
const ease = (u: number): number => u * u * u * (10 - 15 * u + 6 * u * u);

/** The pose a key holds, `u` of the way through its hold. Movement letters travel during it. */
function held(key: Key, u: number): Pose {
  const { letter, pose } = key;
  if (!letter?.path) return pose;
  return {
    shape: pose.shape,
    turn: letter.turnTo ? qslerp(pose.turn, letter.turnTo, ease(u)) : pose.turn,
    place: add(pose.place, scale(letter.path(u), PALM)),
  };
}

export function poseAt(spelling: Spelling, time: number): Moment {
  const { keys, duration } = spelling;
  const t = clamp(time, 0, duration);
  let index = keys.length - 1;
  while (index > 0 && keys[index]!.from > t) index--;
  const key = keys[index]!;

  if (t >= key.at || index === 0) {
    const u = key.until > key.at ? (t - key.at) / (key.until - key.at) : 0;
    return { ...held(key, clamp(u)), char: key.char };
  }

  const before = keys[index - 1]!;
  const a = held(before, 1);
  const b = held(key, 0);
  const u = (t - key.from) / (key.at - key.from);
  const whole = ease(u);
  const finger = (f: number) => ease(clamp((u - (FINGER_ORDER[f]! / 3) * STAGGER) / (1 - STAGGER)));
  return {
    shape: blend(a.shape, b.shape, finger),
    turn: qslerp(a.turn, b.turn, whole),
    place: mix(a.place, b.place, whole),
    char: u < 0.5 ? before.char : key.char,
  };
}
