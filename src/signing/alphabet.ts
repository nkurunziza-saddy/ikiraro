import { blend, FINGERS } from "./hand.ts";
import type { Handshape } from "./hand.ts";
import { MEASURED } from "./letters.ts";
import { axisAngle, basis, IDENTITY, mix, normalize, X, Y } from "./math.ts";
import type { Quat, V3 } from "./math.ts";

type Finger = (typeof FINGERS)[number];

export type Letter = {
  shape: Handshape;
  /** Where the hand points: the rotation from hand space to the signer's space. */
  turn: Quat;
  /** Where the wrist goes, in palm lengths from the usual place, for letters signed elsewhere. */
  reach?: V3;
  /** For letters that are a movement: the wrist's path in palm lengths, `u` running 0 to 1. */
  path?: (u: number) => V3;
  /** For letters that end turned: the orientation reached at the end of the path. */
  turnTo?: Quat;
};

const unpack = (row: readonly number[]): Handshape =>
  Array.from({ length: row.length / 3 }, (_, i) =>
    normalize([row[i * 3]!, row[i * 3 + 1]!, row[i * 3 + 2]!]),
  );

const measured = Object.fromEntries(
  Object.entries(MEASURED).map(([letter, row]) => [letter, unpack(row)]),
) as Record<keyof typeof MEASURED, Handshape>;

/** Take whole fingers from other handshapes: `fingers(A, { index: L })` is a fist that points. */
function fingers(base: Handshape, swaps: Partial<Record<Finger, Handshape>>): Handshape {
  return base.map((direction, bone) => swaps[FINGERS[bone >> 2]!]?.[bone] ?? direction);
}

// The signer faces the viewer: +X is the viewer's right, +Y is up, +Z is towards the viewer.
/** Fingers up, palm to the viewer. */
const UPRIGHT = IDENTITY;
/** Palm turned towards the signer's other side, so the curve of C and O shows. */
const QUARTER = axisAngle(Y, 0.7);
/** Fingers across the body, palm towards the signer. */
const ACROSS = basis([1, 0.12, 0], [0, 0, -1]);
/** Fingers hanging down, back of the hand to the viewer. */
const DOWN = axisAngle(X, 2.4);
/** A hand can only hang from a wrist that has dropped and come forwards. */
const DROPPED: V3 = [0.2, -0.8, 0.65];
/** Palm turned part of the way in, where the hand ends up after the little finger draws a J. */
const HOOKED = axisAngle(Y, 1.1);

const { A, D, I, K, L, S, U } = measured;
/** A fist with the index finger up. */
const pointing = fingers(S, { index: D });
/** A fist with the index finger out and the thumb lying alongside it. */
const pinch = fingers(A, { index: L });

/** A path through points, each leg eased so the hand pauses at the corners. */
function strokes(points: readonly V3[]): (u: number) => V3 {
  return (u) => {
    const legs = points.length - 1;
    const leg = Math.min(legs - 1, Math.floor(u * legs));
    const t = u * legs - leg;
    return mix(points[leg]!, points[leg + 1]!, t * t * (3 - 2 * t));
  };
}

const upright = (shape: Handshape): Letter => ({ shape, turn: UPRIGHT });

export const ALPHABET: Record<string, Letter> = {
  ...Object.fromEntries(
    Object.entries(measured).map(([letter, shape]) => [letter, upright(shape)]),
  ),
  C: { shape: measured.C, turn: QUARTER },
  O: { shape: measured.O, turn: QUARTER },
  // Six letters the dataset cannot give: four are signed edge-on to the
  // camera and two are movements. Each is built from measured fingers.
  G: { shape: pinch, turn: ACROSS },
  H: { shape: U, turn: ACROSS },
  P: { shape: K, turn: DOWN, reach: DROPPED },
  Q: { shape: pinch, turn: DOWN, reach: DROPPED },
  J: {
    shape: I,
    turn: UPRIGHT,
    turnTo: HOOKED,
    path: strokes([
      [0, 0.25, 0],
      [0, -0.45, 0],
      [0.3, -0.7, 0.1],
      [0.6, -0.45, 0.2],
    ]),
  },
  // Drawn as the signer reads it, so mirrored for the viewer.
  Z: {
    shape: pointing,
    turn: UPRIGHT,
    path: strokes([
      [0.45, 0.35, 0],
      [-0.45, 0.35, 0],
      [0.45, -0.35, 0],
      [-0.45, -0.35, 0],
    ]),
  },
};

/** A loose, half-open hand for when nothing is being signed. */
export const RELAXED: Handshape = blend(measured.B, measured.C, 0.45);
