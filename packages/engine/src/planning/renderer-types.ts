export interface HandPose {
  letter: string;
  motion: string;
}

import type { Handshape } from "./pose-library";
import type { ArmTarget, MotionType } from "../types";

export interface SignCanvas {
  setPose(pose: Handshape): void;
  setOverlay(label: string, sublabel?: string): void;
  setExpression?(expression: string): void;
  setMotion?(motion: MotionType, progress: number, armTarget?: ArmTarget): void;
  clear(): void;
}

export interface RendererState {
  time: number;
  frameIndex: number;
  progress: number;
  isPlaying: boolean;
}

export interface PlaybackOptions {
  speed: number;
  loop: boolean;
}
