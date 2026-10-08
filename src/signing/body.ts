import { RELAXED } from "./alphabet.ts";
import { BONE_COUNT, boneStart, toJoints } from "./hand.ts";
import type { Handshape } from "./hand.ts";
import {
  add,
  axisAngle,
  clamp,
  cross,
  distance,
  dot,
  mix,
  normalize,
  qmul,
  rotate,
  scale,
  sub,
  X,
  Y,
  Z,
} from "./math.ts";
import type { Quat, V3 } from "./math.ts";

/**
 * The figure, in metres. The origin is the middle of the chest; the signer
 * faces the viewer, so +X is the viewer's right, +Y is up and +Z is towards
 * the viewer. The signing hand is the signer's right, on the viewer's left.
 */

/** Wrist to middle knuckle. A touch over life size; the camera comes closer instead. */
export const PALM = 0.108;
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
export const HOME: V3 = [-0.25, -0.04, 0.2];

/**
 * The arm hanging at the side, fingers down, palm to the back. From here the
 * shortest turn to an upright hand swings the fingers forwards and up, which is
 * what a forearm does when it is raised.
 */
export const REST: Pose = {
  shape: RELAXED,
  turn: axisAngle(X, 2.9),
  place: [-0.24, -0.47, 0.05],
};

/**
 * Where the elbow wants to be, from the shoulder: underneath, a little out and
 * back. An arm is heavy, so the elbow stays near the body and the wrist does
 * the pointing.
 */
const ELBOW_HANGS: V3 = [-0.06, -0.26, -0.05];

/**
 * A capsule: a rounded bone from `a` to `b`. The renderer draws nothing else.
 * It is `radius` thick at `a` and, if it tapers, `end` thick at `b`. `press`
 * flattens it along a direction, to the share of its width that is the vector's
 * length: neither a trunk nor a palm is round.
 */
export type Capsule = {
  a: V3;
  b: V3;
  radius: number;
  end?: number;
  press?: V3;
  skin: boolean;
  eye?: boolean;
};

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

// How thick a finger is at each joint from the wrist to the tip, in palm
// lengths. The bones inside the palm are thin, because the palm covers them.
const THUMB = [0.12, 0.15, 0.125, 0.11, 0.095];
const FINGER = [0.06, 0.112, 0.102, 0.092, 0.082];

/** How many capsules one arm and its hand come to. */
export const ARM_SIZE = 3 + BONE_COUNT + 1;

/** An arm, posed as a right arm. `mirror` makes it the left. */
function arm(pose: Pose, shoulder: V3, mirror: boolean): Capsule[] {
  const flip = (p: V3): V3 => (mirror ? [-p[0], p[1], p[2]] : p);
  /** Out of the palm. */
  const palmar = rotate(pose.turn, Z);
  const joints = toJoints(pose.shape).map((joint) =>
    add(pose.place, rotate(pose.turn, scale(joint, PALM))),
  );
  const wrist = joints[0]!;
  const bend = elbow(shoulder, wrist, add(shoulder, ELBOW_HANGS));
  const capsules: Capsule[] = [
    { a: shoulder, b: bend, radius: 0.046, end: 0.036, skin: false },
    // A forearm and a wrist are wider than they are deep, and turn with the hand.
    { a: bend, b: wrist, radius: 0.036, end: 0.02, press: scale(palmar, 0.75), skin: false },
    { a: wrist, b: wrist, radius: 0.225 * PALM, press: scale(palmar, 0.68), skin: true },
  ];
  for (let bone = 0; bone < BONE_COUNT; bone++) {
    const thick = bone < 4 ? THUMB : FINGER;
    capsules.push({
      a: joints[boneStart(bone)]!,
      b: joints[bone + 1]!,
      radius: thick[bone % 4]! * PALM,
      end: thick[(bone % 4) + 1]! * PALM,
      skin: true,
    });
  }
  // The palm is one slab, from the heel of the hand to just past the knuckles.
  const knuckles = mix(joints[5]!, joints[17]!, 0.5);
  capsules.push({
    a: mix(wrist, knuckles, 0.3),
    b: mix(wrist, knuckles, 0.7),
    radius: 0.31 * PALM,
    end: 0.42 * PALM,
    press: scale(palmar, 0.36),
    skin: true,
  });
  return capsules.map((c) => ({
    ...c,
    a: flip(c.a),
    b: flip(c.b),
    press: c.press && flip(c.press),
  }));
}

const WAIST = -0.46;
const HEAD: V3 = [0, 0.262, 0.01];
const smooth = (u: number): number => u * u * (3 - 2 * u);

/**
 * The whole figure at one moment. A body that only moved one hand would look
 * like a machine, so everything else answers the hand: the trunk leans and
 * turns towards it, the head tilts, the eyes follow it up and down, and the
 * head rides the beat of the letters. `clock` is wall time in seconds and
 * drives what never stops: breathing, a slow shift of weight, blinking.
 *
 * Nothing is remembered between calls, and the number of capsules never changes.
 */
export function figure(pose: Pose & { beat?: number }, clock = 0): Capsule[] {
  // How far the hand is up, and a bump that peaks while it is on its way.
  const raised = clamp((pose.place[1] - REST.place[1]) / (HOME[1] - REST.place[1]));
  const up = smooth(raised);
  const moving = 4 * raised * (1 - raised);
  const breath = Math.sin(clock * 1.5);
  const sway = 0.6 * Math.sin(clock * 0.47) + 0.4 * Math.sin(clock * 0.83 + 1.3);

  // The trunk bends from the waist: it leans to the signing side, turns that
  // shoulder forwards, and rises with each breath.
  const lean = -0.016 * up + 0.006 * sway;
  const twist = axisAngle(Y, 0.13 * up + 0.02 * sway);
  const bend = (p: V3): V3 => {
    const h = Math.max(0, (p[1] - WAIST) / -WAIST);
    const turned = mix(p, rotate(twist, p), Math.min(1, h));
    return [turned[0] + lean * h * h, turned[1] + 0.004 * breath * h, turned[2] + 0.012 * up * h];
  };
  const shoulder = add(bend(SHOULDER), [0, 0.012 * up, 0]);
  const otherShoulder = bend([-SHOULDER[0], 0, 0]);

  // The head looks at the hand as it comes up and goes down, tilts towards it
  // while it spells, and nods a little with every letter.
  const look = qmul(
    qmul(axisAngle(Y, -0.34 * moving - 0.07 * up), axisAngle(X, 0.2 * moving + 0.03 * breath)),
    axisAngle(Z, 0.06 * up + 0.025 * sway),
  );
  const head = add(bend(HEAD), [0, (pose.beat ?? 0) * 0.35, 0]);
  const face = (p: V3): V3 => add(head, rotate(look, p));
  const blink = (clock + 2) % 4.3 < 0.12 ? 0.05 : 1;
  const eye = (side: number): Capsule => {
    const at = face([side * 0.034, 0.006, 0.086]);
    return { a: at, b: at, radius: 0.0115 * blink, skin: true, eye: true };
  };

  // The other arm hangs from its shoulder and swings a little with the body's weight.
  const hanging: Pose = {
    ...REST,
    place: add(REST.place, [0.006 * sway - lean, 0, 0.012 * Math.sin(clock * 0.7)]),
  };
  const mirrored: V3 = [-otherShoulder[0], otherShoulder[1], otherShoulder[2]];

  return [
    // A jaw that widens into a skull.
    {
      a: face([0, -0.036, 0.006]),
      b: face([0, 0.034, -0.004]),
      radius: 0.074,
      end: 0.093,
      skin: false,
    },
    eye(-1),
    eye(1),
    { a: bend([0, 0.03, 0]), b: face([0, -0.07, -0.01]), radius: 0.052, end: 0.043, skin: false },
    // A yoke for the shoulders, and one trunk under it that narrows to the waist.
    {
      a: bend([-0.125, -0.02, 0]),
      b: bend([0.125, -0.02, 0]),
      radius: 0.075,
      press: [0, 0, 0.75],
      skin: false,
    },
    {
      a: bend([0, -0.125, 0]),
      b: bend([0, -0.41, 0]),
      radius: 0.174,
      end: 0.135,
      press: [0, 0, 0.55],
      skin: false,
    },
    // Hips and legs, which run out of frame.
    { a: [-0.08, -0.53, 0], b: [0.08, -0.53, 0], radius: 0.105, skin: false },
    { a: [-0.088, -0.56, 0], b: [-0.095, -2, 0], radius: 0.084, skin: false },
    { a: [0.088, -0.56, 0], b: [0.095, -2, 0], radius: 0.084, skin: false },
    ...arm(hanging, mirrored, true),
    ...arm(pose, shoulder, false),
  ];
}
