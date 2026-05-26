import type { MotionType } from "../../types";

export type MotionDelta = {
  rArmXDelta: number;
  rArmYDelta?: number;
  rArmZDelta: number;
  rForeZDelta: number;
  rForeYDelta: number;
  rHandXDelta?: number;
  rHandYDelta?: number;
  rHandZDelta?: number;
  lArmXDelta?: number;
  lArmYDelta?: number;
  lArmZDelta?: number;
  lForeZDelta?: number;
  lForeYDelta?: number;
  lHandXDelta?: number;
  lHandYDelta?: number;
  lHandZDelta?: number;
};

export const ZERO_DELTA: MotionDelta = {
  rArmXDelta: 0,
  rArmYDelta: 0,
  rArmZDelta: 0,
  rForeZDelta: 0,
  rForeYDelta: 0,
  rHandXDelta: 0,
  rHandYDelta: 0,
  rHandZDelta: 0,
  lArmXDelta: 0,
  lArmYDelta: 0,
  lArmZDelta: 0,
  lForeZDelta: 0,
  lForeYDelta: 0,
  lHandXDelta: 0,
  lHandYDelta: 0,
  lHandZDelta: 0,
};

export interface ITrajectory {
  evaluate(p: number): MotionDelta;
}

export type RhythmResult = {
  p: number; // Spatial progress [0, 1]
  scale: number; // Amplitude scale [0, 1]
};

export interface IRhythmEngine {
  remap(progress: number, motion: MotionType): RhythmResult;
}
