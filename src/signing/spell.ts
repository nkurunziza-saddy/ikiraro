import { ALPHABET } from "./alphabet.ts";
import type { Letter } from "./alphabet.ts";
import { HOME, PALM, REST } from "./body.ts";
import type { Pose } from "./body.ts";
import { blend } from "./hand.ts";
import { add, angleBetween, clamp, mix, normalize, qnormalize, qslerp, scale } from "./math.ts";
import type { V3 } from "./math.ts";

/**
 * Fingerspelling as a pure function of time. `spell` lays a text out as keys,
 * one per letter; `poseAt` says where the hand is at any moment. Nothing here
 * holds state, so playback can be paused, scrubbed, reversed or tested freely.
 */

/** Seconds, at normal speed. */
const TRAVEL = 0.22;
/** Turning the whole hand takes longer than re-forming it: seconds added per radian turned. */
const TURN = 0.13;
const HOLD = 0.24;
const MOVING_HOLD = 0.75;
const RAISE = 0.7;
const LOWER = 0.8;
const WORD_GAP = 0.3;
/** A repeated letter slides this far outwards, in palm lengths, instead of being re-formed. */
const REPEAT_SLIDE = 0.45;
/** The hand drifts this far outwards with each letter of a word, in palm lengths. */
const DRIFT = 0.035;
/**
 * A hand has mass, so it never starts or stops dead. The keyed motion is
 * averaged over this many seconds either side of now, which rounds every
 * corner and lets each letter begin before the last has quite finished.
 */
const INERTIA = 0.085;
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
  // The rest at either end lasts as long as the inertia looks ahead, so the
  // hand is truly still at the first and last instant.
  const keys: Key[] = [{ char: -1, pose: REST, from: 0, at: 0, until: INERTIA }];
  let clock = INERTIA;
  let slide = 0;
  let drift = 0;
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
      drift = 0;
      return;
    }
    slide = symbol === previous ? slide + 1 : 0;
    if (previous !== "") drift++;
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
        place: add(
          HOME,
          scale(
            add(letter.reach ?? [0, 0, 0], [-(slide * REPEAT_SLIDE + drift * DRIFT), 0, 0]),
            PALM,
          ),
        ),
      },
      from,
      at,
      until: clock,
    });
  });
  if (keys.length === 1) keys[0]!.until = 0;
  else {
    const at = clock + LOWER;
    keys.push({ char: -1, pose: REST, from: clock, at, until: at + INERTIA });
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

/** The motion exactly as keyed: straight from one key to the next, at rest in between. */
function keyed(spelling: Spelling, time: number): Moment {
  const { keys, duration } = spelling;
  const t = clamp(time, 0, duration);
  let index = keys.length - 1;
  while (index > 0 && keys[index]!.from >= t) index--;
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

/** Hann weights for the taps either side of now. */
const TAPS = [-1, -2 / 3, -1 / 3, 0, 1 / 3, 2 / 3, 1].map((offset) => ({
  offset: offset * INERTIA,
  weight: (1 + Math.cos(Math.PI * offset * 0.85)) / 2,
}));
const TOTAL = TAPS.reduce((sum, tap) => sum + tap.weight, 0);

/** Where the hand is at `time`, in seconds. */
export function poseAt(spelling: Spelling, time: number): Moment {
  const now = keyed(spelling, time);
  const taps = TAPS.map((tap) => keyed(spelling, time + tap.offset));
  // Mid-hold, every tap sees the same pose and there is nothing to average.
  if (
    taps.every((tap) => tap.shape === now.shape && tap.place === now.place && tap.turn === now.turn)
  ) {
    return now;
  }

  let place: V3 = [0, 0, 0];
  const turn = [0, 0, 0, 0];
  const shape = now.shape.map((): V3 => [0, 0, 0]);
  taps.forEach((tap, i) => {
    const weight = TAPS[i]!.weight / TOTAL;
    place = add(place, scale(tap.place, weight));
    // A rotation and its negative are the same turn; keep them on one side before adding.
    const side = tap.turn.reduce((sum, v, k) => sum + v * now.turn[k]!, 0) < 0 ? -weight : weight;
    tap.turn.forEach((v, k) => (turn[k]! += v * side));
    tap.shape.forEach(
      (direction, bone) => (shape[bone] = add(shape[bone]!, scale(direction, weight))),
    );
  });
  return {
    shape: shape.map((direction, bone) => normalize(direction, now.shape[bone])),
    turn: qnormalize([turn[0]!, turn[1]!, turn[2]!, turn[3]!]),
    place,
    char: now.char,
  };
}
