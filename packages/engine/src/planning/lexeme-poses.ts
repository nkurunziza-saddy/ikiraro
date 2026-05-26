import type { ArmTarget, MotionType } from "../types";
import type { Handshape } from "./pose-library";
import { ASL_HAND_POSES } from "./pose-library";
import { LanguageRegistry } from "../language-registry";
export type LexemePose = {
  handshape: Handshape;
  armTarget?: ArmTarget;
  motion: MotionType;
};

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
const A = ASL_HAND_POSES.A!;
const B = ASL_HAND_POSES.B!;
const D = ASL_HAND_POSES.D!;
const F = ASL_HAND_POSES.F!;
const H = ASL_HAND_POSES.H!;
const I = ASL_HAND_POSES.I!;
const L = ASL_HAND_POSES.L!;
const M = ASL_HAND_POSES.M!;
const V = ASL_HAND_POSES.V!;

export const LEXEME_POSES: Record<string, LexemePose> = {
  AGAIN: { handshape: A, armTarget: NEUTRAL, motion: "outward-sweep" },
  BAD: { handshape: B, armTarget: CHIN, motion: "forward-push" },
  DOCTOR: { handshape: M, armTarget: LOW, motion: "none" },
  FAMILY: { handshape: F, armTarget: BOTH_CENTER, motion: "circle" },
  GO: { handshape: D, armTarget: NEUTRAL, motion: "outward-sweep" },
  GOOD: { handshape: B, armTarget: CHIN, motion: "forward-push" },
  HELLO: { handshape: B, armTarget: NEUTRAL, motion: "wave" },
  HELP: { handshape: A, armTarget: { ...BOTH_CENTER, rArmX: 0.7 }, motion: "forward-push" },
  HOW: { handshape: H, armTarget: BOTH_CENTER, motion: "circle" },
  INTERPRETER: { handshape: I, armTarget: BOTH_CENTER, motion: "circle" },
  LOVE: { handshape: A, armTarget: BOTH_CHEST, motion: "none" },
  MEDICINE: { handshape: M, armTarget: { ...LOW, ...LEFT_LOW_PALM }, motion: "circle" },
  PLEASE: { handshape: B, armTarget: CHEST, motion: "circle" },
  SEE: { handshape: V, armTarget: FOREHEAD, motion: "forward-push" },
  SIGN: { handshape: D, armTarget: BOTH_CENTER, motion: "circle" },
  "THANK-YOU": { handshape: B, armTarget: CHIN, motion: "forward-push" },
  WHEN: { handshape: D, armTarget: NEUTRAL, motion: "circle" },
  WHO: { handshape: L, armTarget: CHIN, motion: "circle" },
};

export function resolveLexemePose(lexemeId: string): LexemePose | null {
  const lang = LanguageRegistry.getActive();
  return lang.getLexemePose(lexemeId) ?? null;
}
