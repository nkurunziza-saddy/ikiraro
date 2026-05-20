import type { MotionType } from "../types";

export type MotionDelta = {
  rArmXDelta: number;
  rArmZDelta: number;
  rForeZDelta: number;
  rForeYDelta: number;
};

const ZERO: MotionDelta = { rArmXDelta: 0, rArmZDelta: 0, rForeZDelta: 0, rForeYDelta: 0 };

// Axis conventions (Mixamo Michelle, right arm)
// From viewer perspective (camera at z = +2.4):
// - rArmX (+ down, - up): Vertical swing (primary).
// - rArmZ (+ outward, - forward/depth): Lateral travel (secondary).
// - rForeY (+ supination): Palm rotates toward viewer.
// - rForeZ (- flex, + extend): Elbow bend (depth-only).
// Design rule: Prefer vertical (rArmX) and lateral (rArmZ) swings.

export function computeMotionDelta(motion: MotionType, progress: number): MotionDelta {
  const p = Math.max(0, Math.min(1, progress));

  switch (motion) {
    // Whole-word motions

    // HELLO, THANK-YOU, GO, LEARN — outward sweep.
    case "arc":
      return {
        rArmXDelta: Math.sin(p * Math.PI) * 0.44,
        rArmZDelta: Math.sin(p * Math.PI) * 0.58,
        rForeZDelta: 0,
        rForeYDelta: Math.sin(p * Math.PI) * 0.42,
      };

    // YES, NAME, WATER, FOOD — two downward dips.
    case "tap":
      return {
        rArmXDelta: Math.sin(p * Math.PI * 4) * 0.4,
        rArmZDelta: 0,
        rForeZDelta: 0,
        rForeYDelta: Math.sin(p * Math.PI * 4) * 0.2,
      };

    // WHERE, WHAT, BATHROOM — side-to-side wrist twists.
    case "shake":
      return { ...ZERO, rForeYDelta: Math.sin(p * Math.PI * 4) * 0.72 };

    // PLEASE, FAMILY, MEDICINE, WHEN — chest circle.
    case "circle":
      return {
        rArmXDelta: Math.sin(p * Math.PI * 2) * -0.3,
        rArmZDelta: Math.cos(p * Math.PI * 2) * 0.34,
        rForeZDelta: 0,
        rForeYDelta: 0,
      };

    // Letter traces

    // Z-trace
    case "z-trace": {
      let armZ: number;
      let armX: number;
      if (p < 0.33) {
        const t = p / 0.33;
        armZ = t * 0.55;
        armX = 0;
      } else if (p < 0.66) {
        const t = (p - 0.33) / 0.33;
        armZ = 0.55 - t * 1.1;
        armX = t * 0.22;
      } else {
        const t = (p - 0.66) / 0.34;
        armZ = -0.55 + t * 0.55;
        armX = 0.22 - t * 0.1;
      }
      return { rArmXDelta: armX, rArmZDelta: armZ, rForeZDelta: 0, rForeYDelta: 0 };
    }

    // J-trace
    case "j-trace": {
      let armX: number;
      let armZ: number;
      if (p < 0.55) {
        const t = p / 0.55;
        armX = t * 0.52;
        armZ = 0;
      } else {
        const t = (p - 0.55) / 0.45;
        armX = 0.52;
        armZ = -(t * 0.44);
      }
      return { rArmXDelta: armX, rArmZDelta: armZ, rForeZDelta: 0, rForeYDelta: 0 };
    }

    // G: push toward viewer
    case "g-push":
      return { ...ZERO, rArmZDelta: Math.sin(p * Math.PI) * -0.48 };

    // H: lateral slide
    case "h-slide":
      return { ...ZERO, rArmZDelta: Math.sin(p * Math.PI) * 0.42 };

    // D: small loop
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
