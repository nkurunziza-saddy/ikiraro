import * as THREE from "three";

/** Engine reference pose against which an avatar's calibrated rest was authored. */
export const SIGNING_REFERENCE: Record<string, readonly [number, number, number]> = {
  RightArm: [0.76, 0, -0.52],
  RightForeArm: [0, 0.48, -1.5],
  RightHand: [0, 0, 0],
  LeftArm: [0.82, -0.28, 0.34],
  LeftForeArm: [0, -0.34, 1.42],
  LeftHand: [-0.18, 0, 0],
};

/** Blend in local quaternion space; preserve the imported bind orientation. */
export function applySigningPose(
  output: THREE.Quaternion,
  bind: THREE.Quaternion,
  calibration: THREE.Quaternion | undefined,
  idle: readonly [number, number, number],
  target: readonly [number, number, number],
  reference: readonly [number, number, number],
  weight: number,
  scratch: THREE.Quaternion,
  euler: THREE.Euler,
) {
  euler.set(...idle, "XYZ");
  output.copy(bind).multiply(scratch.setFromEuler(euler));
  euler.set(
    target[0] - (calibration ? reference[0] : 0),
    target[1] - (calibration ? reference[1] : 0),
    target[2] - (calibration ? reference[2] : 0),
    "XYZ",
  );
  scratch.setFromEuler(euler);
  if (calibration) scratch.premultiply(calibration);
  scratch.premultiply(bind);
  output.slerp(scratch, Math.max(0, Math.min(1, weight)));
}
