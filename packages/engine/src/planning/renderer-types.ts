import type { ArmTarget, MotionType } from "../types";
import type { Handshape } from "./pose-library";

export interface SignCanvas {
  setPose(pose: Handshape): void;
  setOverlay(label: string, sublabel?: string): void;
  setExpression?(expression: string): void;
  setMotion?(motion: MotionType, progress: number, armTarget?: ArmTarget): void;

  setMotionClip?(clipUrl: string | null, progress: number): void;
  setSpatialTarget?(target: { x: number; y: number; z: number } | null): void;
  setCoarticulationState?(state: { blendWeight: number; amplitudeScale: number } | null): void;
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
