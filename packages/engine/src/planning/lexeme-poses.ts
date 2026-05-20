import type { ArmTarget, MotionType } from "../types";
import type { Handshape } from "./pose-library";
import { ASL_HAND_POSES } from "./pose-library";

export type LexemePose = {
  handshape: Handshape;
  armTarget?: ArmTarget;
  motion: MotionType;
};

// Arm height presets. rArmX/lArmX: lower value = arm raised higher from T-pose.
// Forearm Z is mirrored: right bends negative, left bends positive.
const NEUTRAL: ArmTarget = { rArmX: 0.76, rArmZ: -0.52, rForeZ: -1.5, rForeY: 0.48 };
const FOREHEAD: ArmTarget = { rArmX: 0.42, rArmZ: -0.48, rForeZ: -1.25, rForeY: 0.42 };
const CHIN: ArmTarget = { rArmX: 0.58, rArmZ: -0.48, rForeZ: -1.38, rForeY: 0.45 };
const CHEST: ArmTarget = { rArmX: 0.78, rArmZ: -0.42, rForeZ: -1.42, rForeY: 0.4 };
const LOW: ArmTarget = { rArmX: 0.92, rArmZ: -0.44, rForeZ: -1.42, rForeY: 0.35 };

const LEFT_SUPPORT: ArmTarget = {
  lArmX: 0.82,
  lArmY: -0.28,
  lArmZ: 0.34,
  lForeX: 0,
  lForeZ: 1.42,
  lForeY: -0.34,
  lHandX: -0.18,
};

const LEFT_LOW_PALM: ArmTarget = {
  lArmX: 0.94,
  lArmY: -0.24,
  lArmZ: 0.28,
  lForeX: 0,
  lForeZ: 1.26,
  lForeY: -0.24,
  lHandX: -0.1,
};

const BOTH_CENTER: ArmTarget = {
  ...NEUTRAL,
  ...LEFT_SUPPORT,
};

const BOTH_CHEST: ArmTarget = {
  ...CHEST,
  ...LEFT_SUPPORT,
  lArmX: 0.78,
  lArmZ: 0.42,
  lForeZ: 1.42,
};

const B = ASL_HAND_POSES.B!;
const A = ASL_HAND_POSES.A!;
const C = ASL_HAND_POSES.C!;
const D = ASL_HAND_POSES.D!;
const E = ASL_HAND_POSES.E!;
const F = ASL_HAND_POSES.F!;
const H = ASL_HAND_POSES.H!;
const I = ASL_HAND_POSES.I!;
const L = ASL_HAND_POSES.L!;
const M = ASL_HAND_POSES.M!;
const N = ASL_HAND_POSES.N!;
const O = ASL_HAND_POSES.O!;
const T = ASL_HAND_POSES.T!;
const V = ASL_HAND_POSES.V!;
const W = ASL_HAND_POSES.W!;
const X = ASL_HAND_POSES.X!;
const Y = ASL_HAND_POSES.Y!;
const FIVE = ASL_HAND_POSES["5"]!;

export const LEXEME_POSES: Record<string, LexemePose> = {
  // Original registry
  AGAIN: { handshape: A, armTarget: NEUTRAL, motion: "outward-sweep" },
  BATHROOM: { handshape: T, armTarget: NEUTRAL, motion: "shake" },
  DOCTOR: { handshape: M, armTarget: LOW, motion: "none" },
  DRINK: { handshape: C, armTarget: CHIN, motion: "tap" },
  EMERGENCY: { handshape: E, armTarget: NEUTRAL, motion: "shake" },
  FAMILY: { handshape: F, armTarget: BOTH_CENTER, motion: "circle" },
  FIND: { handshape: F, armTarget: NEUTRAL, motion: "pull-back" },
  FOOD: { handshape: O, armTarget: CHIN, motion: "tap" },
  GO: { handshape: D, armTarget: NEUTRAL, motion: "outward-sweep" },
  HELLO: { handshape: B, armTarget: FOREHEAD, motion: "salute" },
  HELP: { handshape: A, armTarget: { ...BOTH_CENTER, rArmX: 0.7 }, motion: "forward-push" },
  INTERPRETER: { handshape: I, armTarget: BOTH_CENTER, motion: "circle" },
  LEARN: { handshape: B, armTarget: { ...FOREHEAD, ...LEFT_LOW_PALM }, motion: "pull-back" },
  MEDICINE: { handshape: M, armTarget: { ...LOW, ...LEFT_LOW_PALM }, motion: "circle" },
  NAME: { handshape: H, armTarget: BOTH_CENTER, motion: "two-hand-tap" },
  NEED: { handshape: X, armTarget: NEUTRAL, motion: "tap" },
  NO: { handshape: N, motion: "tap" },
  NURSE: { handshape: N, armTarget: LOW, motion: "tap" },
  PAIN: { handshape: D, armTarget: BOTH_CENTER, motion: "two-hand-tap" },
  PLEASE: { handshape: B, armTarget: CHEST, motion: "circle" },
  SCHOOL: { handshape: B, armTarget: BOTH_CENTER, motion: "two-hand-tap" },
  STOP: { handshape: B, armTarget: NEUTRAL, motion: "chest-pat" },
  "THANK-YOU": { handshape: B, armTarget: CHIN, motion: "forward-push" },
  UNDERSTAND: { handshape: X, armTarget: FOREHEAD, motion: "wrist-twist" },
  WAIT: { handshape: FIVE, armTarget: BOTH_CENTER, motion: "shake" },
  WATER: { handshape: W, armTarget: CHIN, motion: "tap" },
  WHAT: { handshape: W, armTarget: BOTH_CENTER, motion: "shake" },
  WHEN: { handshape: D, armTarget: NEUTRAL, motion: "circle" },
  WHERE: { handshape: D, armTarget: NEUTRAL, motion: "shake" },
  WHO: { handshape: L, armTarget: CHIN, motion: "circle" },
  YES: { handshape: A, armTarget: NEUTRAL, motion: "tap" },

  // ─── Expanded everyday vocabulary ────────────────────────────────────────
  BAD: { handshape: B, armTarget: CHIN, motion: "forward-push" },
  COME: { handshape: D, armTarget: BOTH_CENTER, motion: "pull-back" },
  GOOD: { handshape: B, armTarget: CHIN, motion: "forward-push" },
  HAVE: { handshape: B, armTarget: BOTH_CHEST, motion: "chest-pat" },
  HOW: { handshape: H, armTarget: BOTH_CENTER, motion: "circle" },
  KNOW: { handshape: B, armTarget: FOREHEAD, motion: "tap" },
  // LIKE: F-handshape (pinch) pulls away from chest — closest is F
  LIKE: { handshape: F, armTarget: CHEST, motion: "pull-back" },
  // LOVE: A-hands crossed on chest, hold
  LOVE: { handshape: A, armTarget: BOTH_CHEST, motion: "none" },
  MORE: { handshape: O, armTarget: BOTH_CENTER, motion: "two-hand-tap" },
  // MUSIC: B-hand waves over forearm
  MUSIC: { handshape: B, armTarget: { ...LOW, ...LEFT_LOW_PALM }, motion: "music-sweep" },
  // MY: flat-B pressed to chest (possessive)
  MY: { handshape: B, armTarget: CHEST, motion: "chest-pat" },
  PLAY: { handshape: Y, armTarget: BOTH_CENTER, motion: "shake" },
  // SEE: V from eyes forward
  SEE: { handshape: V, armTarget: FOREHEAD, motion: "forward-push" },
  // SIGN (as in signing / ASL): alternating index fingers
  SIGN: { handshape: D, armTarget: BOTH_CENTER, motion: "circle" },
  // WANT: open-5 hands pull toward self
  WANT: { handshape: FIVE, armTarget: BOTH_CENTER, motion: "pull-back" },
  // WORK: S-hand taps wrist of other hand
  WORK: { handshape: A, armTarget: BOTH_CENTER, motion: "two-hand-tap" },
};

export function resolveLexemePose(lexemeId: string): LexemePose | null {
  return LEXEME_POSES[lexemeId.toUpperCase()] ?? null;
}
