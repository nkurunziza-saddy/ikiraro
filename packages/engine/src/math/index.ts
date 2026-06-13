import type { Point3D } from "../types";
export function getDistance(p1: Point3D, p2: Point3D): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2 + (p2.z - p1.z) ** 2);
}
export function subtract(p1: Point3D, p2: Point3D): Point3D {
  return { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
}
export function scale(p: Point3D, factor: number): Point3D {
  return { x: p.x * factor, y: p.y * factor, z: p.z * factor };
}
export function crossProduct(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
export function normalizeVector(vector: Point3D): Point3D {
  const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
  return magnitude > 0
    ? { x: vector.x / magnitude, y: vector.y / magnitude, z: vector.z / magnitude }
    : vector;
}
export function dotProduct(v1: Point3D, v2: Point3D): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}
export function getAngle(a: Point3D, b: Point3D, c: Point3D): number {
  const v1 = subtract(a, b);
  const v2 = subtract(c, b);
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cosine = dot / (mag1 * mag2);
  return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
}
export * from "./smoothing";
