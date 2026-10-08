import { ALPHABET } from "./alphabet.ts";
import { HOME, PALM, REST } from "./body.ts";
import type { Pose } from "./body.ts";
import { blend } from "./hand.ts";
import {
  add,
  angleBetween,
  clamp,
  distance,
  mix,
  normalize,
  qnormalize,
  qslerp,
  scale,
} from "./math.ts";
import type { Quat, V3 } from "./math.ts";
import { LEXICON } from "./signs.ts";

/**
 * Fingerspelling as a pure function of time. `spell` lays a text out as keys,
 * one per letter; `poseAt` says where the hand is at any moment. Nothing here
 * holds state, so playback can be paused, scrubbed, reversed or tested freely.
 */

/** Seconds, at normal speed. */
const TRAVEL = 0.26;
/**
 * A hand going somewhere does not go straight there: it swings out in front of
 * the body on the way, by this share of the distance, as a forearm does.
 */
const ARC = 0.3;
/** Carrying the hand somewhere else takes longer too: seconds added per metre. */
const PACE = 0.8;
/** Turning the whole hand takes longer than re-forming it: seconds added per radian turned. */
const TURN = 0.13;
const HOLD = 0.32;
const MOVING_HOLD = 0.75;
const RAISE = 0.7;
const LOWER = 0.8;
const WORD_GAP = 0.3;
/** A repeated letter slides this far outwards, in palm lengths, instead of being re-formed. */
const REPEAT_SLIDE = 0.55;
/** Between letters the hand dips this far, in palm lengths, so every letter lands as a beat. */
const DIP = 0.16;
/** The hand comes up a little past where it is going, then settles: this share of the way. */
const OVERSHOOT = 1.2;
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
  /** The characters this key signs: `span` of them from `char`. The resting hand has `char` -1. */
  char: number;
  span: number;
  pose: Pose;
  /** Whether this is a fingerspelled letter, as opposed to a station of a sign. */
  letter: boolean;
  path?: (u: number) => V3;
  turnTo?: Quat;
  /** The hand leaves the previous key at `from`, arrives at `at` and holds until `until`. */
  from: number;
  at: number;
  until: number;
};

export type Spelling = { text: string; keys: readonly Key[]; duration: number };

export type Moment = Pose & {
  /** The characters on the hand: `span` of them from `char`, or `char` -1 while it is at rest. */
  char: number;
  span: number;
  /** How far, in metres, the hand is off its line for the beat between two letters. */
  beat: number;
};

/** A text as the characters that `Moment.char` indexes. */
export const characters = (text: string): string[] => Array.from(text);

/** Runs of letters, in capitals, with where each starts. */
function words(text: string): { word: string; start: number }[] {
  const found: { word: string; start: number }[] = [];
  let open = false;
  characters(text).forEach((raw, start) => {
    const symbol = raw.toUpperCase();
    if (!ALPHABET[symbol]) open = false;
    else if (open) found.at(-1)!.word += symbol;
    else {
      found.push({ word: symbol, start });
      open = true;
    }
  });
  return found;
}

/** Lay a text out in time: a sign for each word or phrase that has one, letters for the rest. */
export function spell(text: string): Spelling {
  // The rest at either end lasts as long as the inertia looks ahead, so the
  // hand is truly still at the first and last instant.
  const rest = { char: -1, span: 0, pose: REST, letter: false };
  const keys: Key[] = [{ ...rest, from: 0, at: 0, until: INERTIA }];
  let clock = INERTIA;

  const go = (
    key: Pick<Key, "char" | "span" | "pose" | "letter" | "path" | "turnTo">,
    hold: number,
    travel?: number,
  ) => {
    const last = keys.at(-1)!;
    // Further to go, or more to turn, takes longer.
    const usual =
      TRAVEL +
      TURN * angleBetween(last.turnTo ?? last.pose.turn, key.pose.turn) +
      PACE * distance(last.pose.place, key.pose.place);
    const at = clock + (last.char < 0 ? Math.max(RAISE, usual) : (travel ?? usual));
    keys.push({ ...key, from: clock, at, until: at + hold });
    clock = at + hold;
  };

  const all = words(text);
  for (let w = 0; w < all.length; w++) {
    const { word, start } = all[w]!;
    // Anything between two words is a pause, once, however much of it there is.
    if (w > 0) clock = keys.at(-1)!.until += WORD_GAP;

    const next = all[w + 1];
    const phrase = next && LEXICON[`${word} ${next.word}`];
    const sign = phrase ?? LEXICON[word];
    if (sign) {
      const span = (phrase ? next.start + next.word.length : start + word.length) - start;
      for (const { shape, turn, place, path, travel, hold } of sign) {
        go(
          { char: start, span, pose: { shape, turn, place }, letter: false, path },
          hold ?? HOLD,
          travel,
        );
      }
      if (phrase) w++;
      continue;
    }

    let slide = 0;
    characters(word).forEach((symbol, i) => {
      const letter = ALPHABET[symbol]!;
      slide = symbol === word[i - 1] ? slide + 1 : 0;
      const off = add(letter.reach ?? [0, 0, 0], [-(slide * REPEAT_SLIDE + i * DRIFT), 0, 0]);
      go(
        {
          char: start + i,
          span: 1,
          pose: { shape: letter.shape, turn: letter.turn, place: add(HOME, scale(off, PALM)) },
          letter: true,
          path: letter.path,
          turnTo: letter.turnTo,
        },
        letter.path ? MOVING_HOLD : HOLD,
      );
    });
  }

  if (keys.length === 1) keys[0]!.until = 0;
  else {
    const at = clock + LOWER;
    keys.push({ ...rest, from: clock, at, until: at + INERTIA });
  }
  return { text, keys, duration: keys.at(-1)!.until };
}

/** Minimum-jerk easing, the velocity profile of an unhurried human reach. */
const ease = (u: number): number => u * u * u * (10 - 15 * u + 6 * u * u);

/** Easing that runs past its end and comes back, for a movement with some weight behind it. */
const settle = (u: number): number => 1 + (OVERSHOOT + 1) * (u - 1) ** 3 + OVERSHOOT * (u - 1) ** 2;

/** The pose a key holds, `u` of the way through its hold. Movement letters travel during it. */
function held(key: Key, u: number): Pose {
  const { path, pose, turnTo } = key;
  if (!path) return pose;
  return {
    shape: pose.shape,
    turn: turnTo ? qslerp(pose.turn, turnTo, ease(u)) : pose.turn,
    place: add(pose.place, scale(path(u), PALM)),
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
    return { ...held(key, clamp(u)), char: key.char, span: key.span, beat: 0 };
  }

  const before = keys[index - 1]!;
  const a = held(before, 1);
  const b = held(key, 0);
  const u = (t - key.from) / (key.at - key.from);
  const whole = ease(u);
  const finger = (f: number) => ease(clamp((u - (FINGER_ORDER[f]! / 3) * STAGGER) / (1 - STAGGER)));
  // Between two letters the hand dips, so each one lands as a beat.
  const beat = before.letter && key.letter ? -DIP * PALM * Math.sin(Math.PI * u) : 0;
  const showing = u < 0.5 ? before : key;
  return {
    shape: blend(a.shape, b.shape, finger),
    turn: qslerp(a.turn, b.turn, whole),
    place: add(mix(a.place, b.place, before.char < 0 ? settle(whole) : whole), [
      0,
      beat,
      ARC * distance(a.place, b.place) * Math.sin(Math.PI * whole),
    ]),
    char: showing.char,
    span: showing.span,
    beat,
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
  let beat = 0;
  const turn = [0, 0, 0, 0];
  const shape = now.shape.map((): V3 => [0, 0, 0]);
  taps.forEach((tap, i) => {
    const weight = TAPS[i]!.weight / TOTAL;
    place = add(place, scale(tap.place, weight));
    beat += tap.beat * weight;
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
    span: now.span,
    beat,
  };
}
