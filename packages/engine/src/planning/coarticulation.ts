import type { CoarticulationMode } from "../types";
const BLEND_WINDOWS: Record<CoarticulationMode, number> = {
  blend: 0.2,
  snap: 0.05,
  none: 0,
};
/**
 * Returns a [0,1] sine-eased blend weight toward the next frame, or null when
 * no blending should occur (end of queue, "none" mode, or too early in the frame).
 *
 * Use this to decide whether to interpolate between the current and next handshape.
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
  return 0.5 - 0.5 * Math.cos(t * Math.PI);
}
