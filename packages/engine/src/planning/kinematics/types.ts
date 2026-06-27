import type { ArmTarget } from "../../types";
import type { MotionDelta } from "../trajectories/types";

/** Snapshot of the avatar's arm kinematics. */
export type KinematicPose = {
  rArm: { x: number; y: number; z: number };
  rFore: { x: number; y: number; z: number };
  rHand: { x: number; y: number; z: number };
  lArm: { x: number; y: number; z: number };
  lFore: { x: number; y: number; z: number };
  lHand: { x: number; y: number; z: number };
};

export interface IKinematicController {
  /** Updates the target position to be approached via springs. */
  setTarget(target: ArmTarget): void;

  /** Sets additive motion delta (e.g., arc or shake). */
  setMotionDelta(delta: MotionDelta): void;

  /** Advances the physical simulation. */
  solve(dt: number): KinematicPose;

  /** Resets the controller. */
  reset(pose?: KinematicPose): void;
}
