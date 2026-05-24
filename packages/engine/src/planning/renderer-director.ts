import type { FrameItem, MotionType } from "../types";
import type { SignCanvas, RendererState, PlaybackOptions } from "./renderer-types";
import { resolveHandshape, mixHandshapes } from "./pose-library";
import { resolveLexemePose } from "./lexeme-poses";
import { coarticulationBlend, computeCoarticulationOffsets } from "./coarticulation";
import type { MotionInstruction } from "../types";
/**
 * The RendererDirector coordinates the playback of a SignPlan.
 * It implements the 'Director' pattern, where a logic-heavy orchestrator
 * drives a shallow 'Canvas' implementation.
 *
 * Responsibilities:
 * 1. Managing playback state (playing, paused, time, progress).
 * 2. Calculating the active frame and interpolation factor.
 * 3. Driving the Canvas adapter with high-level pose and overlay commands.
 * 4. Handling looping and playback speed.
 *
 * This separation allows the playback logic to remain identical regardless
 * of whether we are rendering SVG silhouettes, 2D Canvas, or a 3D Avatar.
 */
export class RendererDirector {
  private queue: FrameItem[] = [];
  private instructions: MotionInstruction[] = [];
  private isUsingInstructions = false;

  private state: RendererState = {
    time: 0,
    frameIndex: 0,
    progress: 0,
    isPlaying: false,
  };
  private options: PlaybackOptions = {
    speed: 1,
    loop: false,
  };
  private lastTick = 0;
  private animationId: number | null = null;
  private stateHandlers = new Set<(state: RendererState) => void>();

  constructor(private canvas: SignCanvas) {}

  setQueue(queue: FrameItem[]) {
    this.queue = queue;
    this.isUsingInstructions = false;
    this.reset();
  }

  setInstructions(instructions: MotionInstruction[]) {
    this.instructions = instructions;
    this.isUsingInstructions = true;
    this.reset();
  }
  setOptions(options: Partial<PlaybackOptions>) {
    this.options = { ...this.options, ...options };
  }
  play() {
    if (this.state.isPlaying) return;
    this.state.isPlaying = true;
    this.lastTick = performance.now();
    this.tick();
    this.notify();
  }
  getState() {
    return this.state;
  }
  pause() {
    this.state.isPlaying = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.notify();
  }
  reset() {
    this.state.time = 0;
    this.state.frameIndex = 0;
    this.state.progress = 0;
    this.updateCanvas();
    this.notify();
  }
  seek(time: number) {
    this.state.time = time;
    this.updateStateFromTime();
    this.updateCanvas();
    this.notify();
  }
  /**
   * Subscribe to state changes. Multiple subscribers are supported.
   * Immediately calls the callback with the current state.
   * Returns an unsubscribe function.
   */
  subscribe(cb: (state: RendererState) => void): () => void {
    this.stateHandlers.add(cb);
    cb({ ...this.state });
    return () => this.stateHandlers.delete(cb);
  }
  private tick() {
    if (!this.state.isPlaying) return;
    const now = performance.now();
    const dt = (now - this.lastTick) * this.options.speed;
    this.lastTick = now;
    this.state.time += dt;
    this.updateStateFromTime();
    this.updateCanvas();
    this.notify();
    if (this.state.isPlaying) {
      this.animationId = requestAnimationFrame(() => this.tick());
    }
  }
  private updateStateFromTime() {
    if (this.isUsingInstructions) {
      if (this.instructions.length === 0) return;
      let found = false;
      for (let i = 0; i < this.instructions.length; i++) {
        const inst = this.instructions[i]!;
        if (this.state.time >= inst.startTime && this.state.time <= inst.endTime) {
          this.state.frameIndex = i;
          this.state.progress =
            (this.state.time - inst.startTime) / (inst.endTime - inst.startTime);
          found = true;
          break;
        }
      }
      if (!found) {
        const last = this.instructions[this.instructions.length - 1]!;
        if (this.options.loop) {
          this.state.time %= last.endTime;
          this.updateStateFromTime();
        } else {
          this.state.time = last.endTime;
          this.state.frameIndex = this.instructions.length - 1;
          this.state.progress = 1;
          this.pause();
        }
      }
    } else {
      if (this.queue.length === 0) return;
      let totalTime = 0;
      let found = false;
      for (let i = 0; i < this.queue.length; i++) {
        const frame = this.queue[i]!;
        if (this.state.time >= totalTime && this.state.time < totalTime + frame.duration) {
          this.state.frameIndex = i;
          this.state.progress = (this.state.time - totalTime) / frame.duration;
          found = true;
          break;
        }
        totalTime += frame.duration;
      }
      if (!found) {
        if (this.options.loop) {
          this.state.time %= totalTime;
          this.updateStateFromTime();
        } else {
          this.state.time = totalTime;
          this.state.frameIndex = this.queue.length - 1;
          this.state.progress = 1;
          this.pause();
        }
      }
    }
  }
  private resolveHandshapeForFrame(frame: FrameItem) {
    if (frame.type === "lexeme") {
      return resolveLexemePose(frame.label)?.handshape ?? resolveHandshape(frame.value);
    }
    return resolveHandshape(frame.value);
  }
  private updateCanvas() {
    if (this.isUsingInstructions) {
      const inst = this.instructions[this.state.frameIndex];
      if (!inst) {
        this.canvas.clear();
        return;
      }

      this.canvas.setOverlay(inst.handshape, inst.bodyMotion);

      if (this.canvas.setExpression && inst.facial) {
        this.canvas.setExpression(inst.facial);
      }

      if (this.canvas.setSpatialTarget) {
        this.canvas.setSpatialTarget(inst.spatialTarget ?? null);
      }

      this.canvas.setMotion?.(inst.bodyMotion, this.state.progress, inst.armTarget);

      const nextInst = this.instructions[this.state.frameIndex + 1] ?? null;
      const coart = computeCoarticulationOffsets(inst, nextInst, this.state.progress);

      if (this.canvas.setCoarticulationState) {
        this.canvas.setCoarticulationState(coart);
      }

      const currentHandshape = resolveHandshape(inst.handshape);
      if (coart.blendWeight > 0 && nextInst) {
        const nextHandshape = resolveHandshape(nextInst.handshape);
        this.canvas.setPose(mixHandshapes(currentHandshape, nextHandshape, coart.blendWeight));
      } else {
        this.canvas.setPose(currentHandshape);
      }
    } else {
      const frame = this.queue[this.state.frameIndex];
      if (!frame) {
        this.canvas.clear();
        return;
      }
      if (frame.type === "pause") {
        this.canvas.clear();
        this.canvas.setOverlay("Pause");
        this.canvas.setMotion?.("none", 0);
        this.canvas.setMotionClip?.(null, 0);
        return;
      }
      const currentHandshape = this.resolveHandshapeForFrame(frame);
      this.canvas.setOverlay(frame.label, frame.sublabel);
      if (this.canvas.setExpression && frame.facialExpression) {
        this.canvas.setExpression(frame.facialExpression);
      }
      this.canvas.setMotion?.(
        (frame.motion ?? "none") as MotionType,
        this.state.progress,
        frame.armTarget,
      );
      if (this.canvas.setMotionClip) {
        this.canvas.setMotionClip(frame.motionClip ?? null, this.state.progress);
      }
      const hasNext = this.state.frameIndex < this.queue.length - 1;
      const blend = coarticulationBlend(
        frame.coarticulation ?? "blend",
        this.state.progress,
        hasNext,
      );
      if (blend !== null) {
        const nextHandshape = this.resolveHandshapeForFrame(this.queue[this.state.frameIndex + 1]!);
        this.canvas.setPose(mixHandshapes(currentHandshape, nextHandshape, blend));
      } else {
        this.canvas.setPose(currentHandshape);
      }
    }
  }
  private notify() {
    const snap = { ...this.state };
    this.stateHandlers.forEach((h) => h(snap));
  }
}
