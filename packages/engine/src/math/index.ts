import type { HandLandmarks, Point3D } from "../types";

export function getDistance(p1: Point3D, p2: Point3D): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2));
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

export function normalizeHand(landmarks: HandLandmarks): HandLandmarks {
  if (landmarks.length < 21) return landmarks;

  const wrist = landmarks[0]!;
  const translated = landmarks.map((point) => subtract(point, wrist));
  const vY = normalizeVector(translated[9]!);
  const vTemp = normalizeVector(translated[5]!);
  const vZ = normalizeVector(crossProduct(vY, vTemp));
  const vX = crossProduct(vY, vZ);

  const rotated = translated.map((point) => ({
    x: point.x * vX.x + point.y * vX.y + point.z * vX.z,
    y: point.x * vY.x + point.y * vY.y + point.z * vY.z,
    z: point.x * vZ.x + point.y * vZ.y + point.z * vZ.z,
  }));

  const palmWidth = getDistance(rotated[5]!, rotated[17]!);
  const scaleFactor = palmWidth > 0 ? 1 / palmWidth : 1;
  return rotated.map((point) => scale(point, scaleFactor));
}
