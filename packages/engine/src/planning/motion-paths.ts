import type { MotionType } from "../types";

export type MotionDelta = {
  rArmXDelta: number;
  rArmYDelta?: number;
  rArmZDelta: number;
  rForeZDelta: number;
  rForeYDelta: number;
  rHandXDelta?: number;
  rHandYDelta?: number;
  rHandZDelta?: number;
  lArmXDelta?: number;
  lArmYDelta?: number;
  lArmZDelta?: number;
  lForeZDelta?: number;
  lForeYDelta?: number;
  lHandXDelta?: number;
  lHandYDelta?: number;
  lHandZDelta?: number;
};

const ZERO: MotionDelta = {
  rArmXDelta: 0,
  rArmYDelta: 0,
  rArmZDelta: 0,
  rForeZDelta: 0,
  rForeYDelta: 0,
  rHandXDelta: 0,
  rHandYDelta: 0,
  rHandZDelta: 0,
  lArmXDelta: 0,
  lArmYDelta: 0,
  lArmZDelta: 0,
  lForeZDelta: 0,
  lForeYDelta: 0,
  lHandXDelta: 0,
  lHandYDelta: 0,
  lHandZDelta: 0,
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const delta = (values: Partial<MotionDelta>): MotionDelta => ({ ...ZERO, ...values });

function peakEnvelope(progress: number, approach = 0.35, release = 0.66): number {
  if (progress < approach) return smoothStep(progress / approach);
  if (progress < release) return 1;
  return 1 - smoothStep((progress - release) / (1 - release));
}

function doubleTapPulse(progress: number): number {
  return Math.abs(Math.sin(progress * Math.PI * 2)) ** 1.35;
}

function heldStrokeProgress(progress: number, approachEnd = 0.3, strokeEnd = 0.68): number {
  if (progress <= approachEnd) return 0;
  if (progress >= strokeEnd) return 1;
  return smoothStep((progress - approachEnd) / (strokeEnd - approachEnd));
}

function boundedStrokeProgress(progress: number, approachEnd = 0.16, strokeEnd = 0.88): number {
  if (progress <= approachEnd) return 0;
  if (progress >= strokeEnd) return 1;
  return smoothStep((progress - approachEnd) / (strokeEnd - approachEnd));
}

function pulseProgress(progress: number, approachEnd = 0.12, strokeEnd = 0.9): number {
  if (progress <= approachEnd || progress >= strokeEnd) return 0;
  return (progress - approachEnd) / (strokeEnd - approachEnd);
}

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

    // Legacy returning arc. New lexemes should prefer a more specific motion.
    case "arc": {
      const e = peakEnvelope(p);
      return delta({ rArmXDelta: e * 0.34, rArmZDelta: e * 0.42, rForeYDelta: e * 0.28 });
    }

    // HELLO: one-direction sweep away from the forehead. It does not swing back.
    case "salute": {
      const q = heldStrokeProgress(p, 0.34, 0.7);
      const wristWave = Math.sin(q * Math.PI) * 0.18;
      return delta({
        rArmXDelta: q * 0.03,
        rArmYDelta: q * -0.18,
        rArmZDelta: q * 0.66,
        rForeYDelta: q * 0.36,
        rHandZDelta: q * -0.2 + wristWave,
      });
    }

    // THANK-YOU, SEE: move from the face/chin forward into the viewer's space.
    case "forward-push": {
      const q = heldStrokeProgress(p, 0.28, 0.68);
      return delta({
        rArmXDelta: q * 0.04,
        rArmZDelta: q * -0.62,
        rForeZDelta: q * 0.2,
        rHandXDelta: q * 0.08,
      });
    }

    // GO, COME, AGAIN: clear outward travel across signing space.
    case "outward-sweep": {
      const q = heldStrokeProgress(p, 0.26, 0.68);
      return delta({
        rArmXDelta: q * 0.08,
        rArmYDelta: q * -0.14,
        rArmZDelta: q * 0.58,
        rForeYDelta: q * 0.18,
      });
    }

    // FIND, LIKE, WANT: a visible pull back toward the signer.
    case "pull-back": {
      const q = heldStrokeProgress(p, 0.28, 0.7);
      return delta({ rArmXDelta: q * -0.08, rArmZDelta: q * 0.42, rForeZDelta: q * -0.18 });
    }

    // MY, HAVE: contact on the chest with a real hold.
    case "chest-pat": {
      const e = peakEnvelope(p, 0.28, 0.72);
      return delta({ rArmXDelta: e * 0.08, rArmZDelta: e * -0.16, rForeZDelta: e * 0.1 });
    }

    // MORE, SCHOOL, WORK: both hands come together and separate.
    case "two-hand-tap": {
      const e = doubleTapPulse(pulseProgress(p));
      return delta({
        rArmZDelta: e * 0.18,
        lArmZDelta: e * -0.18,
        rForeYDelta: e * 0.12,
        lForeYDelta: e * -0.12,
      });
    }

    // MUSIC: dominant hand sweeps over the support forearm.
    case "music-sweep": {
      const q = boundedStrokeProgress(p, 0.16, 0.88);
      return delta({
        rArmXDelta: Math.abs(Math.sin(q * Math.PI * 2)) * 0.08,
        rArmZDelta: Math.sin(q * Math.PI * 2) * 0.46,
        rForeYDelta: Math.sin(q * Math.PI * 2) * 0.18,
      });
    }

    // Numbers 6-9: small readable wrist rotation.
    case "wrist-twist": {
      const e = peakEnvelope(p, 0.24, 0.62);
      return delta({ rForeYDelta: e * 0.5 });
    }

    // YES, NAME, WATER, FOOD — two downward dips.
    case "tap": {
      const e = doubleTapPulse(pulseProgress(p, 0.12, 0.88));
      return delta({ rArmXDelta: e * 0.28, rForeYDelta: e * 0.16 });
    }

    // WHERE, WHAT, BATHROOM — side-to-side wrist twists.
    case "shake": {
      const q = pulseProgress(p, 0.14, 0.88);
      const e = peakEnvelope(q, 0.18, 0.82);
      return delta({ rForeYDelta: Math.sin(q * Math.PI * 4) * 0.58 * e });
    }

    // PLEASE, FAMILY, MEDICINE, WHEN — chest circle.
    case "circle": {
      const theta = boundedStrokeProgress(p, 0.16, 0.88) * Math.PI * 2;
      return delta({
        rArmXDelta: Math.sin(theta) * -0.24,
        rArmZDelta: (1 - Math.cos(theta)) * 0.22,
      });
    }

    // Letter traces

    // Z-trace
    case "z-trace": {
      const q = boundedStrokeProgress(p, 0.1, 0.85);
      const e = peakEnvelope(q, 0.1, 0.9);
      let handZ: number;
      let handX: number;
      if (q < 0.33) {
        const t = q / 0.33;
        handZ = t * 0.45;
        handX = 0;
      } else if (q < 0.66) {
        const t = (q - 0.33) / 0.33;
        handZ = 0.45 - t * 0.9;
        handX = t * 0.18;
      } else {
        const t = (q - 0.66) / 0.34;
        handZ = -0.45 + t * 0.45;
        handX = 0.18 - t * 0.18;
      }
      return delta({ rHandXDelta: handX * e, rHandZDelta: handZ * e });
    }

    // J-trace
    case "j-trace": {
      const q = boundedStrokeProgress(p, 0.16, 0.88);
      const e = peakEnvelope(q, 0.2, 0.8);
      let handX: number;
      let foreY: number;
      if (q < 0.5) {
        const t = q / 0.5;
        handX = t * 0.35;
        foreY = t * 0.1;
      } else {
        const t = (q - 0.5) / 0.5;
        handX = 0.35 - t * 0.15;
        foreY = 0.1 + t * 0.5;
      }
      return delta({ rHandXDelta: handX * e, rForeYDelta: foreY * e });
    }

    // G: push toward viewer
    case "g-push": {
      const e = peakEnvelope(boundedStrokeProgress(p, 0.18, 0.82));
      return delta({ rArmZDelta: e * -0.42 });
    }

    // H: lateral slide
    case "h-slide": {
      const e = peakEnvelope(p, 0.2, 0.76);
      return delta({ rArmZDelta: e * 0.38 });
    }

    // D: small loop
    case "d-arc": {
      const theta = boundedStrokeProgress(p, 0.18, 0.86) * Math.PI * 2;
      return delta({
        rHandXDelta: Math.sin(theta) * -0.22,
        rHandZDelta: (1 - Math.cos(theta)) * 0.22,
      });
    }

    // N: two-finger tap down once.
    case "n-dip": {
      const e = peakEnvelope(boundedStrokeProgress(p, 0.18, 0.82), 0.28, 0.72);
      return delta({ rHandXDelta: e * 0.35 });
    }

    // K: two-finger push toward the viewer.
    case "k-push": {
      const e = peakEnvelope(boundedStrokeProgress(p, 0.18, 0.82));
      return delta({ rArmZDelta: e * -0.42 });
    }

    default:
      return ZERO;
  }
}
