import { crossProduct, dotProduct, getAngle, getDistance, normalizeVector, subtract } from "./math";
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
  thumbToPinkyDist: 0,
  indexMiddleSpread: 0,
  ringPinkySpread: 0,
  palmOrientation: 0,
  thumbPosition: 0,
  fingerAngles: [0, 0, 0, 0, 0],
  wristAngle: 0,
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
  const thumbToPinkyDist = getDistance(landmarks[4]!, landmarks[20]!) / normalizedPalm;
  const indexMiddleSpread = getDistance(landmarks[8]!, landmarks[12]!) / normalizedPalm;
  const ringPinkySpread = getDistance(landmarks[16]!, landmarks[20]!) / normalizedPalm;

  const v05 = subtract(landmarks[5]!, landmarks[0]!);
  const v017 = subtract(landmarks[17]!, landmarks[0]!);
  const palmNormal = normalizeVector(crossProduct(v05, v017));
  const palmOrientation = Math.abs(dotProduct(palmNormal, { x: 0, y: 0, z: 1 }));

  const thumbPosition = landmarks[4]!.y < landmarks[5]!.y ? 1 : 0;

  const fingerAngles: [number, number, number, number, number] = [
    getAngle(landmarks[2]!, landmarks[3]!, landmarks[4]!),
    getAngle(landmarks[5]!, landmarks[6]!, landmarks[7]!),
    getAngle(landmarks[9]!, landmarks[10]!, landmarks[11]!),
    getAngle(landmarks[13]!, landmarks[14]!, landmarks[15]!),
    getAngle(landmarks[17]!, landmarks[18]!, landmarks[19]!),
  ];

  const wristAngle = getAngle(landmarks[9]!, landmarks[0]!, {
    x: landmarks[0]!.x,
    y: landmarks[0]!.y - 1,
    z: landmarks[0]!.z,
  });

  const fingerprint = fingerStates.map((state) => (state ? "1" : "0")).join("");

  return {
    fingerStates,
    fingerCurls,
    thumbToIndexDist,
    thumbToMiddleDist,
    thumbToPinkyDist,
    indexMiddleSpread,
    ringPinkySpread,
    palmOrientation,
    thumbPosition,
    fingerAngles,
    wristAngle,
    fingerprint,
  };
}
