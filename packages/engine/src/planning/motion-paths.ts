import type { MotionType } from "../types";

export type MotionDelta = {
  rArmXDelta: number;
  rArmZDelta: number;
  rForeZDelta: number;
  rForeYDelta: number;
};

const ZERO: MotionDelta = { rArmXDelta: 0, rArmZDelta: 0, rForeZDelta: 0, rForeYDelta: 0 };

// ─── Axis conventions (Mixamo Michelle, right arm) ───────────────────────────
//
// From the VIEWER's front perspective (camera at z = +2.4):
//
//   rArmX  positive → arm swings DOWN from raised position.
//          negative → arm rises (raises toward horizontal or above).
//          ** Most visible axis — pure vertical swing. **
//
//   rArmZ  positive → arm retracts OUTWARD to the side (away from forward).
//                     Viewer sees hand moving RIGHTWARD (for right arm).
//          negative → arm pushes toward the camera (depth — less visible).
//          ** Second most visible — produces lateral hand travel. **
//
//   rForeY positive → wrist SUPINATES (palm rotates outward/toward viewer).
//          ** Highly visible — palm orientation is easy to read. **
//
//   rForeZ negative → elbow flexes. Positive → extends.
//          ** Depth-only from front camera — avoid for primary motions. **
//
// Design rule: prefer rArmX + rArmZ (vertical + lateral) over rArmZ + rForeZ
// (two depth axes). Wrist accent via rForeY adds polish.

export function computeMotionDelta(motion: MotionType, progress: number): MotionDelta {
  const p = Math.max(0, Math.min(1, progress));

  switch (motion) {
    // ── Whole-word motions ───────────────────────────────────────────────────

    // HELLO, THANK-YOU, GO, LEARN — outward salute sweep.
    // Arm moves DOWN (rArmX +) and OUTWARD (rArmZ +) while wrist opens.
    // FOREHEAD armTarget positions the arm at temple; this sweeps it out.
    case "arc":
      return {
        rArmXDelta: Math.sin(p * Math.PI) * 0.44,
        rArmZDelta: Math.sin(p * Math.PI) * 0.58,
        rForeZDelta: 0,
        rForeYDelta: Math.sin(p * Math.PI) * 0.42,
      };

    // YES, NAME, WATER, FOOD — fist/hand dips down twice.
    // Two-beat downward bounce on rArmX; wrist rocks in sync.
    case "tap":
      return {
        rArmXDelta: Math.sin(p * Math.PI * 4) * 0.4,
        rArmZDelta: 0,
        rForeZDelta: 0,
        rForeYDelta: Math.sin(p * Math.PI * 4) * 0.2,
      };

    // WHERE, WHAT, BATHROOM — wrist twists side-to-side twice.
    // rForeY drives supination/pronation — clearly visible palm flip.
    case "shake":
      return { ...ZERO, rForeYDelta: Math.sin(p * Math.PI * 4) * 0.72 };

    // PLEASE, FAMILY, MEDICINE, WHEN — oval on the chest.
    // rArmX (up/down) + rArmZ (outward/inward, 90° offset) traces an
    // ellipse in the frontal plane — readable from the front camera.
    case "circle":
      return {
        rArmXDelta: Math.sin(p * Math.PI * 2) * -0.3,
        rArmZDelta: Math.cos(p * Math.PI * 2) * 0.34,
        rForeZDelta: 0,
        rForeYDelta: 0,
      };

    // ── Letter traces ────────────────────────────────────────────────────────

    // Z: right stroke → diagonal left-down → right stroke.
    // rArmZ drives the lateral sweep (positive = rightward from viewer).
    case "z-trace": {
      let armZ: number;
      let armX: number;
      if (p < 0.33) {
        const t = p / 0.33;
        armZ = t * 0.55; // sweep right
        armX = 0;
      } else if (p < 0.66) {
        const t = (p - 0.33) / 0.33;
        armZ = 0.55 - t * 1.1; // sweep left: +0.55 → −0.55
        armX = t * 0.22; // drop diagonally
      } else {
        const t = (p - 0.66) / 0.34;
        armZ = -0.55 + t * 0.55; // sweep right: −0.55 → 0
        armX = 0.22 - t * 0.1; // slight rise
      }
      return { rArmXDelta: armX, rArmZDelta: armZ, rForeZDelta: 0, rForeYDelta: 0 };
    }

    // J: downward stroke then hook inward.
    // rArmX drops the arm; rArmZ swings inward for the hook.
    case "j-trace": {
      let armX: number;
      let armZ: number;
      if (p < 0.55) {
        const t = p / 0.55;
        armX = t * 0.52; // arm drops
        armZ = 0;
      } else {
        const t = (p - 0.55) / 0.45;
        armX = 0.52;
        armZ = -(t * 0.44); // hook inward (negative = toward center)
      }
      return { rArmXDelta: armX, rArmZDelta: armZ, rForeZDelta: 0, rForeYDelta: 0 };
    }

    // G: index/thumb push toward the viewer and return.
    // rArmZ negative = arm pushes forward (toward camera) — intentional depth.
    case "g-push":
      return { ...ZERO, rArmZDelta: Math.sin(p * Math.PI) * -0.48 };

    // H: two-finger lateral slide.
    // rArmZ positive = hand slides outward to the right.
    case "h-slide":
      return { ...ZERO, rArmZDelta: Math.sin(p * Math.PI) * 0.42 };

    // D: small wrist loop — index traces a circle.
    // Mini rArmX + rArmZ oval (same logic as "circle" but smaller).
    case "d-arc":
      return {
        rArmXDelta: Math.sin(p * Math.PI * 2) * -0.18,
        rArmZDelta: Math.cos(p * Math.PI * 2) * 0.22,
        rForeZDelta: 0,
        rForeYDelta: 0,
      };

    // N: two-finger tap down once.
    case "n-dip":
      return { ...ZERO, rArmXDelta: Math.sin(p * Math.PI) * 0.34 };

    // K: two-finger push toward the viewer.
    case "k-push":
      return { ...ZERO, rArmZDelta: Math.sin(p * Math.PI) * -0.48 };

    default:
      return ZERO;
  }
}
