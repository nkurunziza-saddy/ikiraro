import { getDistance } from "../math";
import type { HandLandmarks } from "./types";

const FINGER_SEGMENTS: Array<[number, number]> = [
  [1, 2],
  [2, 3],
  [3, 4],
  [5, 6],
  [6, 7],
  [7, 8],
  [9, 10],
  [10, 11],
  [11, 12],
  [13, 14],
  [14, 15],
  [15, 16],
  [17, 18],
  [18, 19],
  [19, 20],
] as const;
export interface HandBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  area: number;
  centerX: number;
  centerY: number;
}
export interface HandGeometryQuality {
  isValid: boolean;
  score: number;
  reasons: string[];
  bounds: HandBounds;
  palmWidth: number;
  middleFingerRatio: number;
  wristToMiddleTipRatio: number;
  palmTriangleRatio: number;
  minSegmentRatio: number;
}
function getBounds(landmarks: HandLandmarks): HandBounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of landmarks) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    area: width * height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}
function getTriangleArea2D(
  a: HandLandmarks[number],
  b: HandLandmarks[number],
  c: HandLandmarks[number],
): number {
  return Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2;
}
const EMPTY_BOUNDS: HandBounds = {
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
  width: 0,
  height: 0,
  area: 0,
  centerX: 0,
  centerY: 0,
};
export function evaluateHandGeometry(landmarks: HandLandmarks): HandGeometryQuality {
  if (landmarks.length < 21) {
    return {
      isValid: false,
      score: 0,
      reasons: ["missing-landmarks"],
      bounds: EMPTY_BOUNDS,
      palmWidth: 0,
      middleFingerRatio: 0,
      wristToMiddleTipRatio: 0,
      palmTriangleRatio: 0,
      minSegmentRatio: 0,
    };
  }
  const bounds = getBounds(landmarks);
  const palmWidth = getDistance(landmarks[5]!, landmarks[17]!);
  const middleFingerLength =
    getDistance(landmarks[9]!, landmarks[10]!) +
    getDistance(landmarks[10]!, landmarks[11]!) +
    getDistance(landmarks[11]!, landmarks[12]!);
  const wristToMiddleTip = getDistance(landmarks[0]!, landmarks[12]!);
  const palmTriangleArea = getTriangleArea2D(landmarks[0]!, landmarks[5]!, landmarks[17]!);
  const normPalm = palmWidth > 0 ? palmWidth : 1;
  const middleFingerRatio = middleFingerLength / normPalm;
  const wristToMiddleTipRatio = wristToMiddleTip / normPalm;
  const palmTriangleRatio = palmTriangleArea / (normPalm * normPalm);
  const minSegmentRatio = Math.min(
    ...FINGER_SEGMENTS.map(([s, e]) => getDistance(landmarks[s]!, landmarks[e]!) / normPalm),
  );
  const checks: Array<[string, boolean]> = [
    [
      "landmarks-outside-frame",
      bounds.minX >= -0.02 && bounds.minY >= -0.02 && bounds.maxX <= 1.02 && bounds.maxY <= 1.02,
    ],
    ["hand-too-small", bounds.area >= 0.004 && bounds.width >= 0.05 && bounds.height >= 0.07],
    ["palm-width-out-of-range", palmWidth >= 0.025 && palmWidth <= 0.45],
    ["finger-length-out-of-range", middleFingerRatio >= 0.45 && middleFingerRatio <= 3.4],
    ["reach-out-of-range", wristToMiddleTipRatio >= 0.55 && wristToMiddleTipRatio <= 4.2],
    ["palm-shape-out-of-range", palmTriangleRatio >= 0.01 && palmTriangleRatio <= 1.6],
    ["finger-segments-collapsed", minSegmentRatio >= 0.015],
  ];
  const reasons = checks.filter(([, passed]) => !passed).map(([reason]) => reason);
  const score = (checks.length - reasons.length) / checks.length;
  return {
    isValid: score >= 0.5,
    score,
    reasons,
    bounds,
    palmWidth,
    middleFingerRatio,
    wristToMiddleTipRatio,
    palmTriangleRatio,
    minSegmentRatio,
  };
}
