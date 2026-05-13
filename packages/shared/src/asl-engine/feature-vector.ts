import { getDistance } from "./math";
import type { FeatureVector, HandLandmarks } from "./types";

function isFingerExtended(
  landmarks: HandLandmarks,
  tipIndex: number,
  pipIndex: number,
  mcpIndex: number,
): boolean {
  const tip = landmarks[tipIndex]!;
  const pip = landmarks[pipIndex]!;
  const mcp = landmarks[mcpIndex]!;
  const tipToMcp = getDistance(tip, mcp);
  const pipToMcp = getDistance(pip, mcp);
  return tipToMcp > pipToMcp * 1.05;
}

function isThumbExtended(landmarks: HandLandmarks): boolean {
  return (
    getDistance(landmarks[4]!, landmarks[9]!) > getDistance(landmarks[3]!, landmarks[9]!) * 1.15
  );
}

function getFingerCurl(
  landmarks: HandLandmarks,
  tipIndex: number,
  dipIndex: number,
  pipIndex: number,
  mcpIndex: number,
): number {
  const tip = landmarks[tipIndex]!;
  const dip = landmarks[dipIndex]!;
  const pip = landmarks[pipIndex]!;
  const mcp = landmarks[mcpIndex]!;
  const boneLength = getDistance(mcp, pip) + getDistance(pip, dip) + getDistance(dip, tip);
  const tipToBase = getDistance(tip, mcp);

  if (boneLength <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, 1 - tipToBase / boneLength));
}

const EMPTY_VECTOR: FeatureVector = {
  fingerStates: [false, false, false, false, false],
  fingerCurls: [0, 0, 0, 0, 0],
  thumbToIndexDist: 0,
  thumbToMiddleDist: 0,
  indexMiddleSpread: 0,
  fingerprint: "00000",
};

export function extractFeatureVector(landmarks: HandLandmarks): FeatureVector {
  if (landmarks.length < 21) {
    return EMPTY_VECTOR;
  }

  const fingerStates: [boolean, boolean, boolean, boolean, boolean] = [
    isThumbExtended(landmarks),
    isFingerExtended(landmarks, 8, 6, 5),
    isFingerExtended(landmarks, 12, 10, 9),
    isFingerExtended(landmarks, 16, 14, 13),
    isFingerExtended(landmarks, 20, 18, 17),
  ];

  const fingerCurls: [number, number, number, number, number] = [
    getFingerCurl(landmarks, 4, 3, 2, 1),
    getFingerCurl(landmarks, 8, 7, 6, 5),
    getFingerCurl(landmarks, 12, 11, 10, 9),
    getFingerCurl(landmarks, 16, 15, 14, 13),
    getFingerCurl(landmarks, 20, 19, 18, 17),
  ];

  const palmSize = getDistance(landmarks[5]!, landmarks[17]!);
  const normalizedPalm = palmSize > 0 ? palmSize : 1;
  const thumbToIndexDist = getDistance(landmarks[4]!, landmarks[8]!) / normalizedPalm;
  const thumbToMiddleDist = getDistance(landmarks[4]!, landmarks[12]!) / normalizedPalm;
  const indexMiddleSpread = getDistance(landmarks[8]!, landmarks[12]!) / normalizedPalm;
  const fingerprint = fingerStates.map((state) => (state ? "1" : "0")).join("");

  return {
    fingerStates,
    fingerCurls,
    thumbToIndexDist,
    thumbToMiddleDist,
    indexMiddleSpread,
    fingerprint,
  };
}
