import { HANDSHAPES } from "./alphabet.ts";
import { HOME } from "./body.ts";
import type { Handshape } from "./hand.ts";
import { add, axisAngle, basis, IDENTITY, normalize, scale, X } from "./math.ts";
import type { Quat, V3 } from "./math.ts";

/**
 * Words that have a sign of their own are signed, not spelled. A sign is a
 * short run of stations: a handshape, which way it faces, and where the wrist
 * is, in metres from the middle of the chest. The hand travels from one
 * station to the next and may move while it holds one.
 *
 * These are written from published descriptions of each sign, not recorded
 * from a signer, and have not been reviewed by one.
 */
export type Station = {
  shape: Handshape;
  turn: Quat;
  place: V3;
  /** The wrist's path while holding, in palm lengths, `u` running 0 to 1. */
  path?: (u: number) => V3;
  /** Seconds to get here, when the usual pace is wrong, and to stay. */
  travel?: number;
  hold?: number;
};
export type Sign = readonly Station[];

const { A, B, S, ONE } = HANDSHAPES;
/** A turn that points the fingers one way and faces the palm, as nearly as it can, another. */
const facing = (fingers: V3, palm: V3): Quat => basis(fingers, palm);
/** The wrist position that puts a fingertip `length` metres along `fingers` at `tip`. */
const reaching = (tip: V3, fingers: V3, length: number): V3 =>
  add(tip, scale(normalize(fingers), -length));

const CHEST: V3 = [-0.01, -0.11, 0.115];
const TEMPLE: V3 = [-0.085, 0.3, 0.075];
const CHIN: V3 = [0, 0.165, 0.1];
/** Wrist to the tip of an extended index or middle finger. */
const FINGER = 0.2;

/** Circles on the chest, in the plane of the chest. */
const circling =
  (radius: number, turns: number) =>
  (u: number): V3 => {
    const angle = u * turns * 2 * Math.PI;
    return [radius * (Math.cos(angle) - 1), radius * Math.sin(angle), 0];
  };

// HELLO: a flat hand leaves the temple, outwards and a little forwards, like a loose salute.
const saluting: V3 = [0.6, 0.78, -0.17];
const HELLO: Sign = [
  {
    shape: B,
    turn: facing(saluting, [0.2, -0.2, 1]),
    place: reaching(TEMPLE, saluting, FINGER),
    hold: 0.12,
  },
  {
    shape: B,
    turn: facing([-0.28, 0.94, 0.18], [0, 0, 1]),
    place: [-0.37, 0.19, 0.2],
    travel: 0.42,
    hold: 0.32,
  },
];

// ME: the index finger comes in from the side and touches the chest.
const inwards: V3 = [0.9, 0.05, -0.42];
const ME: Sign = [
  {
    shape: ONE,
    turn: facing(inwards, [0, -0.4, -1]),
    place: reaching(CHEST, inwards, FINGER + 0.035),
    path: (u) => scale(normalize(inwards), 0.33 * Math.sin(Math.PI * Math.min(1, u * 1.6))),
    hold: 0.55,
  },
];

// YOU: the index finger points at whoever is watching, with a small push towards them.
const YOU: Sign = [
  {
    shape: ONE,
    turn: facing([0.12, -0.08, 1], [0, -1, 0]),
    place: [-0.2, -0.09, 0.24],
    path: (u) => [0, 0, 0.5 * Math.sin((Math.PI / 2) * Math.min(1, u * 2))],
    hold: 0.55,
  },
];

// YES: a fist nods at the wrist, twice, as a head would.
const nodding = { shape: S, place: add(HOME, [0.02, -0.02, 0.03]) };
const up = { ...nodding, turn: IDENTITY, travel: 0.14, hold: 0.04 };
const down = { ...nodding, turn: axisAngle(X, 0.95), travel: 0.14, hold: 0.04 };
const YES: Sign = [{ ...up, travel: undefined }, down, up, down, { ...up, hold: 0.2 }];

// PLEASE, SORRY and MY all sit on the chest: a flat hand circling, a fist circling, a flat hand still.
const onChest = { turn: facing([0.76, 0.63, -0.1], [0, 0, -1]), place: [-0.09, -0.21, 0.15] as V3 };
const PLEASE: Sign = [{ ...onChest, shape: B, path: circling(0.45, 1.5), hold: 1 }];
const SORRY: Sign = [{ ...onChest, shape: A, path: circling(0.4, 1.5), hold: 1 }];
const MY: Sign = [{ ...onChest, shape: B, hold: 0.5 }];

// THANK YOU: a flat hand starts with its fingertips at the chin and falls forwards, palm up.
const toChin: V3 = [0.14, 0.87, -0.47];
const THANK_YOU: Sign = [
  {
    shape: B,
    turn: facing(toChin, [0, -0.3, -1]),
    place: reaching(CHIN, toChin, FINGER),
    hold: 0.12,
  },
  {
    shape: B,
    turn: facing([0.1, 0.35, 0.93], [0, 1, -0.3]),
    place: [-0.06, -0.1, 0.34],
    travel: 0.45,
    hold: 0.32,
  },
];

/** Signs by the word or phrase that calls for them, in capitals. */
export const LEXICON: Record<string, Sign> = {
  HELLO,
  HI: HELLO,
  ME,
  I: ME,
  YOU,
  YES,
  PLEASE,
  SORRY,
  MY,
  MINE: MY,
  "THANK YOU": THANK_YOU,
  THANKS: THANK_YOU,
};
