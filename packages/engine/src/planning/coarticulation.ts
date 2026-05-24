import type { MotionInstruction } from "../types";

export type CoarticulationState = {
  blendWeight: number; // 0 to 1 for handshape carryover
  amplitudeScale: number; // For movement scaling (emphasis or reduction)
};

/**
 * Computes the runtime coarticulation offsets based on the current and next motion instructions.
 * This handles anticipation timing and movement reduction/expansion.
 */
export function computeCoarticulationOffsets(
  current: MotionInstruction,
  next: MotionInstruction | null,
  progress: number,
): CoarticulationState {
  let blendWeight = 0;
  let amplitudeScale = 1.0;

  // 1. Movement expansion based on emphasis curve
  if (current.emphasisCurve === "impact") {
    amplitudeScale = 1.3;
  } else if (current.emphasisCurve === "accelerate") {
    amplitudeScale = 1.15;
  }

  if (next) {
    // 2. Motion smoothing bias
    // If the next sign is very short (fast speech), reduce the amplitude of the current motion's tail end
    const nextDuration = next.endTime - next.startTime;
    if (nextDuration < 400 && progress > 0.5) {
      // Lerp amplitude scale down slightly
      const reduction = 0.8;
      amplitudeScale =
        amplitudeScale * (1 - (progress - 0.5) * 2) + reduction * ((progress - 0.5) * 2);
    }

    // 3. Anticipation (handshape carryover)
    // Blend window size depends on the hint
    const windowSize = current.coarticulationHint === "blend" ? 0.35 : 0.1;
    if (progress > 1 - windowSize) {
      const t = (progress - (1 - windowSize)) / windowSize;
      // Smoothstep for natural easing
      blendWeight = t * t * (3 - 2 * t);
    }
  }

  return {
    blendWeight,
    amplitudeScale,
  };
}

export type CoarticulationMode = "blend" | "snap" | "none";
const BLEND_WINDOWS: Record<CoarticulationMode, number> = {
  blend: 0.2,
  snap: 0.05,
  none: 0,
};

export function coarticulationBlend(
  mode: CoarticulationMode,
  progress: number,
  hasNext: boolean,
): number | null {
  if (!hasNext) return null;
  const window = BLEND_WINDOWS[mode];
  if (window === 0 || progress <= 1 - window) return null;
  const t = (progress - (1 - window)) / window;
  return t * t * (3 - 2 * t);
}
