/** Minimal vector and quaternion maths on plain tuples. */

export type V3 = readonly [number, number, number];
/** Unit quaternion as x, y, z, w. */
export type Quat = readonly [number, number, number, number];

export const X: V3 = [1, 0, 0];
export const Y: V3 = [0, 1, 0];
export const Z: V3 = [0, 0, 1];
export const ZERO: V3 = [0, 0, 0];
export const IDENTITY: Quat = [0, 0, 0, 1];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const length = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
export const distance = (a: V3, b: V3): number => length(sub(a, b));
export const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const mix = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export function normalize(a: V3, fallback: V3 = Y): V3 {
  const l = length(a);
  return l > 1e-9 ? scale(a, 1 / l) : fallback;
}

export const clamp = (x: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, x));

/** Any unit vector perpendicular to the unit vector `a`. */
function perpendicular(a: V3): V3 {
  return normalize(cross(a, Math.abs(a[0]) < 0.9 ? X : Y));
}

/** Rotate `v` about the unit `axis` by `angle` radians. */
export function rotateAbout(v: V3, axis: V3, angle: number): V3 {
  return rotate(axisAngle(axis, angle), v);
}

/** Interpolate between two unit vectors along the great circle joining them. */
export function slerp(a: V3, b: V3, t: number): V3 {
  const d = clamp(dot(a, b), -1, 1);
  if (d > 0.9995) return normalize(mix(a, b, t));
  const axis = d < -0.9995 ? perpendicular(a) : normalize(cross(a, b));
  return rotateAbout(a, axis, Math.acos(d) * t);
}

export function axisAngle(axis: V3, angle: number): Quat {
  const s = Math.sin(angle / 2);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
}

/** The shortest rotation taking unit vector `a` onto unit vector `b`. */
export function arc(a: V3, b: V3): Quat {
  const d = dot(a, b);
  if (d < -0.999999) return axisAngle(perpendicular(a), Math.PI);
  const c = cross(a, b);
  return qnormalize([c[0], c[1], c[2], 1 + d]);
}

export function qnormalize(q: Quat): Quat {
  const l = Math.hypot(q[0], q[1], q[2], q[3]);
  return l > 1e-12 ? [q[0] / l, q[1] / l, q[2] / l, q[3] / l] : IDENTITY;
}

/** Compose rotations: the result applies `b` first, then `a`. */
export function qmul(a: Quat, b: Quat): Quat {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

export const qinverse = (q: Quat): Quat => [-q[0], -q[1], -q[2], q[3]];

export function rotate(q: Quat, v: V3): V3 {
  const u: V3 = [q[0], q[1], q[2]];
  const t = scale(cross(u, v), 2);
  return add(add(v, scale(t, q[3])), cross(u, t));
}

/** The angle, in radians, of the rotation that takes orientation `a` to `b`. */
export function angleBetween(a: Quat, b: Quat): number {
  return (
    2 * Math.acos(clamp(Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]), 0, 1))
  );
}

export function qslerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const sign = d < 0 ? -1 : 1;
  d *= sign;
  let wa = 1 - t;
  let wb = t;
  if (d < 0.9995) {
    const theta = Math.acos(d);
    wa = Math.sin((1 - t) * theta) / Math.sin(theta);
    wb = Math.sin(t * theta) / Math.sin(theta);
  }
  wb *= sign;
  return qnormalize([
    a[0] * wa + b[0] * wb,
    a[1] * wa + b[1] * wb,
    a[2] * wa + b[2] * wb,
    a[3] * wa + b[3] * wb,
  ]);
}

/** The rotation whose local +Y and +Z axes land on the given directions. */
export function basis(up: V3, forward: V3): Quat {
  const y = normalize(up);
  const x = normalize(cross(y, forward), X);
  const z = cross(x, y);
  const trace = x[0] + y[1] + z[2];
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    return qnormalize([(y[2] - z[1]) / s, (z[0] - x[2]) / s, (x[1] - y[0]) / s, s / 4]);
  }
  if (x[0] > y[1] && x[0] > z[2]) {
    const s = Math.sqrt(1 + x[0] - y[1] - z[2]) * 2;
    return qnormalize([s / 4, (y[0] + x[1]) / s, (z[0] + x[2]) / s, (y[2] - z[1]) / s]);
  }
  if (y[1] > z[2]) {
    const s = Math.sqrt(1 + y[1] - x[0] - z[2]) * 2;
    return qnormalize([(y[0] + x[1]) / s, s / 4, (z[1] + y[2]) / s, (z[0] - x[2]) / s]);
  }
  const s = Math.sqrt(1 + z[2] - x[0] - y[1]) * 2;
  return qnormalize([(z[0] + x[2]) / s, (z[1] + y[2]) / s, s / 4, (x[1] - y[0]) / s]);
}
