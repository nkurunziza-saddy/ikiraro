import type { ArmTarget } from "../../types";
import type { MotionDelta } from "../trajectories/types";

/**
 * A snapshot of the avatar's kinematic state for the arms.
 */
export type KinematicPose = {
  rArm: { x: number; y: number; z: number };
  rFore: { x: number; y: number; z: number };
  rHand: { x: number; y: number; z: number };
  lArm: { x: number; y: number; z: number };
  lFore: { x: number; y: number; z: number };
  lHand: { x: number; y: number; z: number };
};

export interface IKinematicController {
  /**
   * Updates the high-level intent (target position).
   * This target will be approached smoothly over time via springs.
   */
  setTarget(target: ArmTarget): void;

  /**
   * Sets the instantaneous additive motion delta (e.g., from an 'arc' or 'shake').
   */
  setMotionDelta(delta: MotionDelta): void;

  /**
   * Advances the physical simulation.
   * @param dt Delta time in milliseconds.
   */
  solve(dt: number): KinematicPose;

  /**
   * Resets the controller to a specific pose (or idle).
   */
  reset(pose?: KinematicPose): void;
}
