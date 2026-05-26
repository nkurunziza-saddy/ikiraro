import type { MotionType } from "../types";
import { globalTrajectoryEngine } from "./trajectories";
import type { MotionDelta } from "./trajectories/types";

export type { MotionDelta };

export function computeMotionDelta(motion: MotionType, progress: number): MotionDelta {
  return globalTrajectoryEngine.computeDelta(motion, progress);
}
