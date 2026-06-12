import type { CoarticulationMode } from "../types";

const BLEND_WINDOWS: Record<CoarticulationMode, number> = {
  blend: 0.2,
  snap: 0.05,
  none: 0,
};

/**
 * Calculates the blend factor for handshape coarticulation.
 * Used by the RendererDirector to interpolate between the current and next pose.
 */
export function coarticulationBlend(
  mode: CoarticulationMode,
  progress: number,
  hasNext: boolean,
): number | null {
  if (!hasNext) return null;
  const window = BLEND_WINDOWS[mode];
  if (window === 0 || progress <= 1 - window) return null;
  const t = (progress - (1 - window)) / window;
  // Smoothstep for natural easing
  return t * t * (3 - 2 * t);
}
