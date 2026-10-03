import {
  add,
  arc,
  IDENTITY,
  normalize,
  qinverse,
  qmul,
  rotate,
  scale,
  slerp,
  sub,
  Y,
} from "./math.ts";
import type { Quat, V3 } from "./math.ts";

/**
 * A hand is 21 joints in MediaPipe order: the wrist, then four joints each for
 * thumb, index, middle, ring and pinky. That makes 20 bones, bone `i` ending at
 * joint `i + 1`.
 *
 * Hand space has the wrist at the origin, +Y towards the middle knuckle, +X
 * towards the thumb side and +Z out of the palm, for a right hand.
 */
export const JOINT_COUNT = 21;
export const BONE_COUNT = 20;
export const FINGERS = ["thumb", "index", "middle", "ring", "pinky"] as const;

/** The joint a bone starts from. The first bone of every finger starts at the wrist. */
export const boneStart = (bone: number): number => (bone % 4 === 0 ? 0 : bone);
export const fingerOf = (bone: number): number => bone >> 2;

/**
 * A handshape is one unit direction per bone. The first bone of each finger is
 * expressed in hand space; every other bone is expressed in the frame of the
 * bone before it, where "straight on" is +Y. Storing bends relative to the
 * parent keeps every joint well under a half turn, so blending two shapes
 * never has to guess which way round a finger should travel.
 */
export type Handshape = readonly V3[];

/**
 * Bone lengths in palm lengths (wrist to middle knuckle = 1). Measured from
 * dataset samples where the bone lies flat to the camera: fingers from B,
 * the thumb from L and Y.
 */
// prettier-ignore
export const BONE_LENGTHS: readonly number[] = [
  0.4, 0.45, 0.35, 0.27, // thumb
  1.03, 0.385, 0.25, 0.22, // index
  1, 0.42, 0.265, 0.225, // middle
  0.94, 0.375, 0.25, 0.21, // ring
  0.88, 0.295, 0.2, 0.185, // pinky
];

/** Read a handshape off 21 joint positions given in hand space. */
export function fromJoints(joints: readonly V3[]): Handshape {
  const shape: V3[] = [];
  let frame: Quat = IDENTITY;
  for (let bone = 0; bone < BONE_COUNT; bone++) {
    if (bone % 4 === 0) frame = IDENTITY;
    const direction = normalize(sub(joints[bone + 1]!, joints[boneStart(bone)]!));
    const local = rotate(qinverse(frame), direction);
    shape.push(local);
    frame = qmul(frame, arc(Y, local));
  }
  return shape;
}

/** Forward kinematics: 21 joint positions in hand space, in palm lengths. */
export function toJoints(shape: Handshape, lengths: readonly number[] = BONE_LENGTHS): V3[] {
  const joints: V3[] = [[0, 0, 0]];
  let frame: Quat = IDENTITY;
  for (let bone = 0; bone < BONE_COUNT; bone++) {
    if (bone % 4 === 0) frame = IDENTITY;
    frame = qmul(frame, arc(Y, shape[bone]!));
    joints.push(add(joints[boneStart(bone)]!, scale(rotate(frame, Y), lengths[bone]!)));
  }
  return joints;
}

/**
 * Blend two handshapes. `t` is either one amount for the whole hand or a
 * function giving each finger its own, which is how fingers get to lead or lag.
 */
export function blend(
  a: Handshape,
  b: Handshape,
  t: number | ((finger: number) => number),
): Handshape {
  return a.map((direction, bone) =>
    slerp(direction, b[bone]!, typeof t === "number" ? t : t(fingerOf(bone))),
  );
}
