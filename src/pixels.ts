import type { Capsule, Pose } from "./signing/body.ts";
import { rotate } from "./signing/math.ts";

/**
 * A second renderer, with no GPU and no dependencies: it ray-casts the same
 * capsules straight into a small grid of pixels. The browser shows that grid
 * scaled up; a terminal shows it as coloured half-blocks. Same figure, same
 * code, any screen.
 */

/** What the grid looks at: a point on the figure, in metres, and how much height fits. */
export type View = { centre: readonly [number, number]; height: number };

/** Head to waist. */
export const WHOLE: View = { centre: [-0.07, -0.05], height: 0.92 };

/**
 * A close view that keeps the signing hand in the middle, for grids too small
 * to show fingers otherwise. It follows the hand, so the body drifts past.
 */
export function follow(pose: Pose): View {
  const fingers = rotate(pose.turn, [0, 1, 0]);
  return {
    centre: [pose.place[0] + fingers[0] * 0.09 + 0.03, pose.place[1] + fingers[1] * 0.09],
    height: 0.32,
  };
}

const INK = [66, 66, 74];
const SKIN = [240, 228, 208];
/** Towards the light: up, to the viewer's left, and in front. */
const LIGHT = [-0.37, 0.56, 0.74];
/** Shading is cut into this many flat steps, as pixel art is. */
const STEPS = 4;

/**
 * Paint capsules into `width` x `height` RGBA pixels, transparent where there
 * is nothing. The view is orthographic, from the front.
 */
export function paint(
  capsules: readonly Capsule[],
  width: number,
  height: number,
  view: View,
  pixels = new Uint8ClampedArray(width * height * 4),
): Uint8ClampedArray {
  pixels.fill(0);
  const depth = new Float32Array(width * height).fill(-Infinity);
  const scale = height / view.height;
  const left = view.centre[0] - width / 2 / scale;
  const top = view.centre[1] + view.height / 2;

  for (const { a, b, radius, skin } of capsules) {
    const x0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - radius - left) * scale));
    const x1 = Math.min(width - 1, Math.ceil((Math.max(a[0], b[0]) + radius - left) * scale));
    const y0 = Math.max(0, Math.floor((top - Math.max(a[1], b[1]) - radius) * scale));
    const y1 = Math.min(height - 1, Math.ceil((top - Math.min(a[1], b[1]) + radius) * scale));
    const [bx, by, bz] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const along = bx * bx + by * by + bz * bz;
    const colour = skin ? SKIN : INK;

    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        // A ray through this pixel, travelling away from the viewer. Positions are relative to `a`.
        const ox = left + (px + 0.5) / scale - a[0];
        const oy = top - (py + 0.5) / scale - a[1];
        let z = -Infinity;
        let h = 0;

        // Each end is a sphere. Of its two crossings, the one in front is the one that shows.
        const near = radius * radius - ox * ox - oy * oy;
        if (near >= 0) z = Math.sqrt(near);
        const ex = ox - bx;
        const ey = oy - by;
        const far = radius * radius - ex * ex - ey * ey;
        if (far >= 0 && bz + Math.sqrt(far) > z) {
          z = bz + Math.sqrt(far);
          h = 1;
        }
        // The wall between them: points on the ray at `radius` from the axis, a quadratic in z.
        const across = along - bz * bz;
        const flat = ox * bx + oy * by;
        const c = (ox * ox + oy * oy - radius * radius) * along - flat * flat;
        const root = flat * flat * bz * bz - across * c;
        if (across > 1e-12 && root >= 0) {
          const hit = (flat * bz + Math.sqrt(root)) / across;
          const share = (flat + hit * bz) / along;
          if (share > 0 && share < 1 && hit > z) {
            z = hit;
            h = share;
          }
        }
        if (z === -Infinity) continue;

        const i = py * width + px;
        if (z + a[2] <= depth[i]!) continue;
        depth[i] = z + a[2];

        // The surface normal points from the axis to the hit.
        const nx = (ox - bx * h) / radius;
        const ny = (oy - by * h) / radius;
        const nz = (z - bz * h) / radius;
        const lit = Math.max(0, nx * LIGHT[0]! + ny * LIGHT[1]! + nz * LIGHT[2]!);
        // Surfaces turning away from the viewer darken, which draws an outline round every finger.
        const tone = (0.42 + 0.58 * lit) * (0.5 + 0.5 * Math.min(1, nz * 1.6));
        const step = Math.ceil(tone * STEPS) / STEPS;
        pixels[i * 4] = colour[0]! * step;
        pixels[i * 4 + 1] = colour[1]! * step;
        pixels[i * 4 + 2] = colour[2]! * step;
        pixels[i * 4 + 3] = 255;
      }
    }
  }
  return pixels;
}
