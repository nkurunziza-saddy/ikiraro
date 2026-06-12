import type { FrameItem, MotionType } from "../types";
import type { SignCanvas, RendererState, PlaybackOptions } from "./renderer-types";
import { resolveHandshape, mixHandshapes } from "./pose-library";
import { resolveLexemePose } from "./lexeme-poses";
import { coarticulationBlend } from "./coarticulation";

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
      if (this.options.loop && totalTime > 0) {
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
  private resolveHandshapeForFrame(frame: FrameItem) {
    if (frame.type === "lexeme") {
      return resolveLexemePose(frame.label)?.handshape ?? resolveHandshape(frame.value);
    }
    return resolveHandshape(frame.value);
  }
  private updateCanvas() {
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
  /**
   * Permanently stops the director, cancels any active animation frames,
   * and clears all state handlers.
   */
  dispose() {
    this.pause();
    this.stateHandlers.clear();
  }
  private notify() {
    const snap = { ...this.state };
    this.stateHandlers.forEach((h) => h(snap));
  }
}
