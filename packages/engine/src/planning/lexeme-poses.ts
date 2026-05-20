import type { ArmTarget, MotionType } from "../types";
import type { Handshape } from "./pose-library";
import { ASL_HAND_POSES } from "./pose-library";

export type LexemePose = {
  handshape: Handshape;
  armTarget?: ArmTarget;
  motion: MotionType;
};

// Arm height presets for the dominant (right) hand.
// rArmX: lower value = arm raised higher from T-pose horizontal.
// rForeZ: how far the forearm bends forward.
const FOREHEAD: ArmTarget = { rArmX: 0.42, rForeZ: -1.25 };
const CHIN: ArmTarget = { rArmX: 0.58, rForeZ: -1.4 };
const LOW: ArmTarget = { rArmX: 0.92, rForeZ: -1.42 };

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
  AGAIN: { handshape: A, motion: "arc" },
  BATHROOM: { handshape: T, motion: "shake" },
  DOCTOR: { handshape: M, armTarget: LOW, motion: "none" },
  DRINK: { handshape: C, armTarget: CHIN, motion: "arc" },
  EMERGENCY: { handshape: E, motion: "shake" },
  FAMILY: { handshape: F, motion: "circle" },
  FIND: { handshape: F, motion: "arc" },
  FOOD: { handshape: O, armTarget: CHIN, motion: "tap" },
  GO: { handshape: D, motion: "arc" },
  HELLO: { handshape: B, armTarget: FOREHEAD, motion: "arc" },
  HELP: { handshape: A, motion: "arc" },
  INTERPRETER: { handshape: I, motion: "circle" },
  LEARN: { handshape: B, armTarget: FOREHEAD, motion: "arc" },
  MEDICINE: { handshape: M, motion: "circle" },
  NAME: { handshape: H, motion: "tap" },
  NEED: { handshape: X, motion: "tap" },
  NO: { handshape: N, motion: "tap" },
  NURSE: { handshape: N, armTarget: LOW, motion: "tap" },
  PAIN: { handshape: D, motion: "tap" },
  PLEASE: { handshape: B, motion: "circle" },
  SCHOOL: { handshape: B, motion: "tap" },
  STOP: { handshape: B, motion: "none" },
  "THANK-YOU": { handshape: B, armTarget: CHIN, motion: "arc" },
  UNDERSTAND: { handshape: X, armTarget: FOREHEAD, motion: "arc" },
  WAIT: { handshape: FIVE, motion: "shake" },
  WATER: { handshape: W, armTarget: CHIN, motion: "tap" },
  WHAT: { handshape: W, motion: "shake" },
  WHEN: { handshape: D, motion: "circle" },
  WHERE: { handshape: D, motion: "shake" },
  WHO: { handshape: L, armTarget: CHIN, motion: "circle" },
  YES: { handshape: A, motion: "tap" },

  // ─── Expanded everyday vocabulary ────────────────────────────────────────
  BAD: { handshape: B, armTarget: CHIN, motion: "arc" },
  COME: { handshape: D, motion: "arc" },
  GOOD: { handshape: B, armTarget: CHIN, motion: "arc" },
  HAVE: { handshape: B, motion: "arc" },
  HOW: { handshape: H, motion: "circle" },
  KNOW: { handshape: B, armTarget: FOREHEAD, motion: "tap" },
  // LIKE: F-handshape (pinch) pulls away from chest — closest is F
  LIKE: { handshape: F, motion: "arc" },
  // LOVE: A-hands crossed on chest, hold
  LOVE: { handshape: A, motion: "none" },
  MORE: { handshape: O, motion: "tap" },
  // MUSIC: B-hand waves over forearm
  MUSIC: { handshape: B, motion: "arc" },
  // MY: flat-B pressed to chest (possessive)
  MY: { handshape: B, motion: "none" },
  PLAY: { handshape: Y, motion: "shake" },
  // SEE: V from eyes forward
  SEE: { handshape: V, armTarget: FOREHEAD, motion: "arc" },
  // SIGN (as in signing / ASL): alternating index fingers
  SIGN: { handshape: D, motion: "circle" },
  // WANT: open-5 hands pull toward self
  WANT: { handshape: FIVE, motion: "arc" },
  // WORK: S-hand taps wrist of other hand
  WORK: { handshape: A, motion: "tap" },
};

export function resolveLexemePose(lexemeId: string): LexemePose | null {
  return LEXEME_POSES[lexemeId.toUpperCase()] ?? null;
}
