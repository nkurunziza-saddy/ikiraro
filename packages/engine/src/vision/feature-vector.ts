import {
  crossProduct,
  dotProduct,
  getAngle,
  getDistance,
  normalizeVector,
  subtract,
} from "../math";
import type { FeatureVector, HandLandmarks } from "./types";
import { ASL_DEFAULTS } from "./asl-defaults";
function isFingerExtended(
  landmarks: HandLandmarks,
  tipIndex: number,
  dipIndex: number,
  pipIndex: number,
  mcpIndex: number,
): boolean {
  const pipAngle = getAngle(landmarks[mcpIndex]!, landmarks[pipIndex]!, landmarks[dipIndex]!);
  const dipAngle = getAngle(landmarks[pipIndex]!, landmarks[dipIndex]!, landmarks[tipIndex]!);
  return pipAngle > ASL_DEFAULTS.pipExtensionAngle && dipAngle > ASL_DEFAULTS.dipExtensionAngle;
}
function isThumbExtended(landmarks: HandLandmarks): boolean {
  const ipAngle = getAngle(landmarks[2]!, landmarks[3]!, landmarks[4]!);
  return ipAngle > ASL_DEFAULTS.thumbExtensionAngle;
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
  if (boneLength <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - getDistance(tip, mcp) / boneLength));
}
const EMPTY_VECTOR: FeatureVector = {
  isValid: false,
  fingerStates: [false, false, false, false, false],
  fingerCurls: [0, 0, 0, 0, 0],
  thumbToIndexDist: 0,
  thumbToMiddleDist: 0,
  thumbToPinkyDist: 0,
  indexMiddleSpread: 0,
  ringPinkySpread: 0,
  palmOrientation: 0,
  thumbPosition: 0,
  thumbVsFingerDepth: 0,
  fingerAngles: [0, 0, 0, 0, 0],
  wristAngle: 0,
  fingerprint: "00000",
  spatialZone: "neutral",
  velocity: { x: 0, y: 0, z: 0 },
  isMoving: false,
};
/**
 * Extract a feature vector from hand landmarks.
 *
 * @param landmarks - Structural landmarks for distance/angle features.
 *   Pass worldLandmarks here when available — they are metric 3D and free of
 *   perspective distortion, making distance and angle features more reliable.
 * @param imageLandmarks - Optional image-space landmarks (x/y in [0,1]).
 *   Used only for spatialZone (face/chest/neutral). Falls back to `landmarks`
 *   when not provided, which is fine if you don't use spatialZone.
 */
export function extractFeatureVector(
  landmarks: HandLandmarks,
  imageLandmarks?: HandLandmarks,
): FeatureVector {
  if (landmarks.length < 21) return EMPTY_VECTOR;
  const fingerStates: [boolean, boolean, boolean, boolean, boolean] = [
    isThumbExtended(landmarks),
    isFingerExtended(landmarks, 8, 7, 6, 5),
    isFingerExtended(landmarks, 12, 11, 10, 9),
    isFingerExtended(landmarks, 16, 15, 14, 13),
    isFingerExtended(landmarks, 20, 19, 18, 17),
  ];
  const fingerCurls: [number, number, number, number, number] = [
    getFingerCurl(landmarks, 4, 3, 2, 1),
    getFingerCurl(landmarks, 8, 7, 6, 5),
    getFingerCurl(landmarks, 12, 11, 10, 9),
    getFingerCurl(landmarks, 16, 15, 14, 13),
    getFingerCurl(landmarks, 20, 19, 18, 17),
  ];
  const palmSize = getDistance(landmarks[5]!, landmarks[17]!);
  const normPalm = palmSize > 0 ? palmSize : 1;
  const thumbToIndexDist = getDistance(landmarks[4]!, landmarks[8]!) / normPalm;
  const thumbToMiddleDist = getDistance(landmarks[4]!, landmarks[12]!) / normPalm;
  const thumbToPinkyDist = getDistance(landmarks[4]!, landmarks[20]!) / normPalm;
  const indexMiddleSpread = getDistance(landmarks[8]!, landmarks[12]!) / normPalm;
  const ringPinkySpread = getDistance(landmarks[16]!, landmarks[20]!) / normPalm;
  const v05 = subtract(landmarks[5]!, landmarks[0]!);
  const v017 = subtract(landmarks[17]!, landmarks[0]!);
  const palmNormal = normalizeVector(crossProduct(v05, v017));
  const palmOrientation = Math.abs(dotProduct(palmNormal, { x: 0, y: 0, z: 1 }));
  const thumbPosition = landmarks[4]!.y < landmarks[5]!.y ? 1 : 0;

  const fingerPipZ = (landmarks[6]!.z + landmarks[10]!.z + landmarks[14]!.z + landmarks[18]!.z) / 4;
  const thumbVsFingerDepth = landmarks[4]!.z - fingerPipZ;
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
  const fingerprint = fingerStates.map((s) => (s ? "1" : "0")).join("");

  const zoneLandmarks = imageLandmarks ?? landmarks;
  const centerX = zoneLandmarks[9]!.x;
  const centerY = zoneLandmarks[9]!.y;
  let spatialZone: FeatureVector["spatialZone"] = "neutral";
  if (centerY < 0.25) spatialZone = "forehead";
  else if (centerY < 0.4) spatialZone = "face";
  else if (centerY < 0.55 && centerX > 0.4 && centerX < 0.6) spatialZone = "chin";
  else if (centerY > 0.6) spatialZone = "chest";
  return {
    isValid: true,
    fingerStates,
    fingerCurls,
    thumbToIndexDist,
    thumbToMiddleDist,
    thumbToPinkyDist,
    indexMiddleSpread,
    ringPinkySpread,
    palmOrientation,
    thumbPosition,
    thumbVsFingerDepth,
    fingerAngles,
    wristAngle,
    fingerprint,
    spatialZone,
    velocity: { x: 0, y: 0, z: 0 },
    isMoving: false,
  };
}
