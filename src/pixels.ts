import type { Capsule, Pose } from "./signing/body.ts";
import {
  add,
  clamp,
  dot,
  length,
  normalize,
  rotate,
  scale as times,
  sub,
  Z,
} from "./signing/math.ts";
import type { V3 } from "./signing/math.ts";

/**
 * A second renderer, with no GPU and no dependencies: it ray-casts the same
 * capsules straight into a small grid of cells. The browser lights that grid
 * up as a field of dots; a terminal prints it as coloured half blocks. Same
 * figure, same code, any screen.
 */

/** What the grid looks at: a point on the figure, in metres, and how much height fits. */
export type View = { centre: readonly [number, number]; height: number };

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

/** What `cast` found in each cell: nothing, the body, bare skin, or an eye. */
export const EMPTY = 0;
export const BODY = 1;
export const BARE = 2;
export const EYE = 3;

/** A grid of cells: what is in each one, and how brightly it is lit, from 0 to 1. */
export type Grid = { width: number; height: number; kind: Uint8Array; light: Float32Array };

export function grid(width: number, height: number): Grid {
  const cells = width * height;
  return { width, height, kind: new Uint8Array(cells), light: new Float32Array(cells) };
}

/** Towards the light: up, to the viewer's left, and in front. */
const LIGHT: V3 = [-0.37, 0.56, 0.74];

/** Look at capsules through `view`, straight on from the front, and fill in the grid. */
export function cast(capsules: readonly Capsule[], view: View, into: Grid): Grid {
  const { width, height, kind, light } = into;
  kind.fill(EMPTY);
  const depth = new Float32Array(width * height).fill(-Infinity);
  const scale = height / view.height;
  const left = view.centre[0] - width / 2 / scale;
  const top = view.centre[1] + view.height / 2;

  for (const { a, b, radius: thick, end = thick, press = Z, skin, eye } of capsules) {
    // A grid this coarse cannot show a taper, so a bone is as thick as its middle.
    const radius = (thick + end) / 2;
    const x0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - radius - left) * scale));
    const x1 = Math.min(width - 1, Math.ceil((Math.max(a[0], b[0]) + radius - left) * scale));
    const y0 = Math.max(0, Math.floor((top - Math.max(a[1], b[1]) - radius) * scale));
    const y1 = Math.min(height - 1, Math.ceil((top - Math.min(a[1], b[1]) + radius) * scale));

    // A flattened capsule is a round one in a space stretched along `k`, so the
    // ray is stretched into that space and meets a round capsule there.
    const share = length(press);
    const k = normalize(press);
    const stretch = (p: V3): V3 => add(p, times(k, (1 / share - 1) * dot(p, k)));
    const from = stretch(a);
    const axis = sub(stretch(b), from);
    // The ray travels away from the viewer.
    const ray = stretch([0, 0, -1]);
    const [along, slant, speed] = [dot(axis, axis), dot(axis, ray), dot(ray, ray)];
    const wall = along * speed - slant * slant;

    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        // The ray through this pixel starts level with the middle of the chest, relative to `from`.
        const o = sub(stretch([left + (px + 0.5) / scale, top - (py + 0.5) / scale, 0]), from);
        // How far along the ray the capsule is first met: the smaller, the nearer the viewer.
        let t = Infinity;

        // Each end is a sphere. Of its two crossings, the one in front is the one that shows.
        for (const end of [o, sub(o, axis)]) {
          const half = dot(ray, end);
          const root = half * half - speed * (dot(end, end) - radius * radius);
          if (root >= 0) t = Math.min(t, (-half - Math.sqrt(root)) / speed);
        }
        // The wall between them: points on the ray at `radius` from the axis, a quadratic.
        const [lead, half] = [dot(axis, o), along * dot(ray, o) - dot(axis, o) * slant];
        const root = half * half - wall * (along * (dot(o, o) - radius * radius) - lead * lead);
        if (wall > 1e-12 && root >= 0) {
          const hit = (-half - Math.sqrt(root)) / wall;
          if (lead + hit * slant > 0 && lead + hit * slant < along) t = Math.min(t, hit);
        }
        if (t === Infinity) continue;

        const i = py * width + px;
        if (-t <= depth[i]!) continue;
        depth[i] = -t;

        // The surface normal points from the axis to the hit, and pressing turns it.
        const hit = add(o, times(ray, t));
        const round = sub(hit, times(axis, along > 0 ? clamp(dot(hit, axis) / along) : 0));
        const n = normalize(add(round, times(k, (1 / share - 1) * dot(round, k))));
        const lit = Math.max(0, dot(n, LIGHT));
        // Surfaces turning away from the viewer darken, which draws an outline round every finger.
        light[i] = (0.42 + 0.58 * lit) * (0.5 + 0.5 * Math.min(1, n[2] * 1.6));
        kind[i] = eye ? EYE : skin ? BARE : BODY;
      }
    }
  }
  return into;
}

const INK = [66, 66, 74];
const SKIN = [240, 228, 208];
/** Shading is cut into this many flat steps, as pixel art is. */
const STEPS = 4;

/** A grid as RGBA pixels with flat steps of shading, transparent where there is nothing. */
export function paint(
  cells: Grid,
  pixels = new Uint8ClampedArray(cells.width * cells.height * 4),
): Uint8ClampedArray {
  pixels.fill(0);
  cells.kind.forEach((kind, i) => {
    if (kind === EMPTY) return;
    const colour = kind === BODY ? INK : SKIN;
    const step = Math.ceil(cells.light[i]! * STEPS) / STEPS;
    pixels.set([colour[0]! * step, colour[1]! * step, colour[2]! * step, 255], i * 4);
  });
  return pixels;
}
