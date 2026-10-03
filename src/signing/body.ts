import { RELAXED } from "./alphabet.ts";
import { BONE_COUNT, boneStart, toJoints } from "./hand.ts";
import type { Handshape } from "./hand.ts";
import { add, basis, cross, distance, dot, mix, normalize, rotate, scale, sub } from "./math.ts";
import type { Quat, V3 } from "./math.ts";

/**
 * The figure, in metres. The origin is the middle of the chest; the signer
 * faces the viewer, so +X is the viewer's right, +Y is up and +Z is towards
 * the viewer. The signing hand is the signer's right, on the viewer's left.
 */

/** Wrist to middle knuckle. Half as large again as life, so handshapes read at a distance. */
export const PALM = 0.145;
export const UPPER_ARM = 0.27;
export const FOREARM = 0.25;
export const SHOULDER: V3 = [-0.185, 0, 0];

/** Everything the body needs to know about one hand. */
export type Pose = {
  shape: Handshape;
  /** Rotation from hand space to body space. */
  turn: Quat;
  /** Where the wrist is. */
  place: V3;
};

/** Where fingerspelling happens: in front of the shoulder, clear of the face. */
export const HOME: V3 = [-0.25, -0.08, 0.2];

/** The arm hanging at the side, fingers down, palm towards the leg. */
export const REST: Pose = {
  shape: RELAXED,
  turn: basis([0.05, -1, 0.12], [1, 0, 0]),
  place: [-0.25, -0.47, 0.06],
};

/** A capsule: a rounded bone from `a` to `b`. The renderer draws nothing else. */
export type Capsule = { a: V3; b: V3; radius: number; skin: boolean };

/**
 * Two-bone IK. The elbow can sit anywhere on a circle around the line from
 * shoulder to wrist; it takes the point on that circle nearest to `hint`.
 */
export function elbow(shoulder: V3, wrist: V3, hint: V3): V3 {
  const reach = Math.min(distance(shoulder, wrist), (UPPER_ARM + FOREARM) * 0.999);
  const axis = normalize(sub(wrist, shoulder));
  const along = (UPPER_ARM ** 2 - FOREARM ** 2 + reach ** 2) / (2 * reach);
  const centre = add(shoulder, scale(axis, along));
  const out = sub(hint, centre);
  const side = normalize(sub(out, scale(axis, dot(out, axis))), normalize(cross(axis, [0, 0, 1])));
  return add(centre, scale(side, Math.sqrt(Math.max(0, UPPER_ARM ** 2 - along ** 2))));
}

// Radii in palm lengths. Knuckle bones are wide enough to merge into a palm.
const boneRadius = (bone: number): number => {
  const thumb = bone < 4;
  const segment = bone % 4;
  if (segment === 0) return thumb ? 0.16 : 0.145;
  return (thumb ? 0.145 : 0.125) - (segment - 1) * 0.012;
};

function arm(pose: Pose, mirror: boolean): Capsule[] {
  const flip = (p: V3): V3 => (mirror ? [-p[0], p[1], p[2]] : p);
  const joints = toJoints(pose.shape).map((joint) =>
    add(pose.place, rotate(pose.turn, scale(joint, PALM))),
  );
  // A wrist cannot fold back on itself, so the elbow trails behind the hand;
  // and an arm is heavy, so it also hangs down and a little out.
  const behind = sub(pose.place, scale(rotate(pose.turn, [0, 1, 0]), FOREARM));
  const wrist = joints[0]!;
  const bend = elbow(SHOULDER, wrist, add(behind, [-0.06, -0.3, -0.06]));
  const capsules: Capsule[] = [
    { a: SHOULDER, b: bend, radius: 0.043, skin: false },
    { a: bend, b: wrist, radius: 0.03, skin: false },
    // The heel of the hand, a little wider than the sleeve it comes out of.
    { a: wrist, b: wrist, radius: 0.23 * PALM, skin: true },
  ];
  for (let bone = 0; bone < BONE_COUNT; bone++) {
    capsules.push({
      a: joints[boneStart(bone)]!,
      b: joints[bone + 1]!,
      radius: boneRadius(bone) * PALM,
      skin: true,
    });
  }
  // Three bars across the knuckle bones fill them in to make a palm.
  for (const [along, radius] of [
    [1, 0.13],
    [0.62, 0.16],
    [0.3, 0.17],
  ] as const) {
    capsules.push({
      a: mix(wrist, joints[5]!, along),
      b: mix(wrist, joints[17]!, along),
      radius: radius * PALM,
      skin: true,
    });
  }
  return capsules.map((c) => ({ ...c, a: flip(c.a), b: flip(c.b) }));
}

const TORSO: Capsule[] = [
  // Head, neck, shoulders, and a trunk that runs out of frame.
  { a: [0, 0.265, 0.02], b: [0, 0.31, 0.015], radius: 0.098, skin: false },
  { a: [0, 0.08, 0], b: [0, 0.18, 0.01], radius: 0.04, skin: false },
  { a: [-0.13, -0.03, 0], b: [0.13, -0.03, 0], radius: 0.08, skin: false },
  { a: [0, -0.12, 0], b: [0, -2, 0], radius: 0.15, skin: false },
];

/** The other hand, at rest. Posed in the signing hand's space, then mirrored. */
const IDLE = arm(REST, true);

/** The whole figure for one pose of the signing hand. Always the same number of capsules. */
export function figure(pose: Pose): Capsule[] {
  return [...TORSO, ...IDLE, ...arm(pose, false)];
}
