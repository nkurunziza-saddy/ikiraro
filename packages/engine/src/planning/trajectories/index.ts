import type { MotionType } from "../../types";
import type { ITrajectory, MotionDelta } from "./types";
import { ZERO_DELTA } from "./types";
import { DefaultRhythmEngine } from "./rhythm-engine";
import {
  ArcTrajectory,
  SaluteTrajectory,
  ForwardPushTrajectory,
  OutwardSweepTrajectory,
  WaveTrajectory,
  CircleTrajectory,
  TapTrajectory,
  TwoHandTapTrajectory,
  ShakeTrajectory,
  WristTwistTrajectory,
  PullBackTrajectory,
  ChestPatTrajectory,
  MusicSweepTrajectory,
  GPushTrajectory,
  HSlideTrajectory,
  DArcTrajectory,
  NDipTrajectory,
  JTraceTrajectory,
  ZTraceTrajectory,
  KPushTrajectory,
} from "./implementations";

export class TrajectoryEngine {
  private trajectories = new Map<MotionType, ITrajectory>();
  private rhythmEngine = new DefaultRhythmEngine();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    this.trajectories.set("arc", new ArcTrajectory());
    this.trajectories.set("salute", new SaluteTrajectory());
    this.trajectories.set("forward-push", new ForwardPushTrajectory());
    this.trajectories.set("outward-sweep", new OutwardSweepTrajectory());
    this.trajectories.set("wave", new WaveTrajectory());
    this.trajectories.set("circle", new CircleTrajectory());
    this.trajectories.set("tap", new TapTrajectory());
    this.trajectories.set("two-hand-tap", new TwoHandTapTrajectory());
    this.trajectories.set("shake", new ShakeTrajectory());
    this.trajectories.set("wrist-twist", new WristTwistTrajectory());
    this.trajectories.set("pull-back", new PullBackTrajectory());
    this.trajectories.set("chest-pat", new ChestPatTrajectory());
    this.trajectories.set("music-sweep", new MusicSweepTrajectory());
    this.trajectories.set("g-push", new GPushTrajectory());
    this.trajectories.set("h-slide", new HSlideTrajectory());
    this.trajectories.set("d-arc", new DArcTrajectory());
    this.trajectories.set("n-dip", new NDipTrajectory());
    this.trajectories.set("j-trace", new JTraceTrajectory());
    this.trajectories.set("z-trace", new ZTraceTrajectory());
    this.trajectories.set("k-push", new KPushTrajectory());
  }

  computeDelta(motion: MotionType, progress: number): MotionDelta {
    const trajectory = this.trajectories.get(motion);
    if (!trajectory) return ZERO_DELTA;

    const rhythm = this.rhythmEngine.remap(progress, motion);
    const rawDelta = trajectory.evaluate(rhythm.p);

    if (rhythm.scale === 1.0) return rawDelta;

    return this.scaleDelta(rawDelta, rhythm.scale);
  }

  private scaleDelta(delta: MotionDelta, scale: number): MotionDelta {
    const scaled = { ...delta };
    (Object.keys(scaled) as Array<keyof MotionDelta>).forEach((key) => {
      const val = scaled[key];
      if (typeof val === "number") {
        (scaled[key] as number) = val * scale;
      }
    });
    return scaled;
  }
}

export const globalTrajectoryEngine = new TrajectoryEngine();
