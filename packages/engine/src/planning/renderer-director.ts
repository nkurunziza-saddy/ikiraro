import type { FrameItem, MotionType } from "../types";
import { coarticulationBlend } from "./coarticulation";
import { resolveLexemePose } from "./lexeme-poses";
import { mixHandshapes, resolveHandshape } from "./pose-library";
import type { PlaybackClock, PlaybackOptions, RendererState, SignCanvas } from "./renderer-types";

/**
 * Coordinates the playback of a SignPlan.
 * Manages playback state, active frame calculation, and Canvas adapter updates.
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

  constructor(
    private canvas: SignCanvas,
    private clock: PlaybackClock | null = {
      now: () => performance.now(),
      request: (callback) => requestAnimationFrame(callback),
      cancel: (handle) => cancelAnimationFrame(handle),
    },
  ) {}

  setQueue(queue: FrameItem[]) {
    this.pause();
    this.queue = queue.filter((frame) => Number.isFinite(frame.duration) && frame.duration > 0);
    this.reset();
  }

  setOptions(options: Partial<PlaybackOptions>) {
    if (options.speed !== undefined && (!Number.isFinite(options.speed) || options.speed <= 0)) {
      throw new RangeError("Playback speed must be finite and greater than zero.");
    }
    this.options = { ...this.options, ...options };
  }
  play() {
    if (this.state.isPlaying || this.queue.length === 0) return;
    this.state.isPlaying = true;
    this.lastTick = this.clock?.now() ?? 0;
    this.tick();
    this.notify();
  }
  getState() {
    return { ...this.state };
  }
  pause() {
    this.state.isPlaying = false;
    if (this.animationId !== null) {
      this.clock?.cancel(this.animationId);
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
    this.state.time = Number.isFinite(time) ? Math.max(0, time) : 0;
    this.updateStateFromTime();
    this.updateCanvas();
    this.notify();
  }
  /** Subscribe to state changes. */
  subscribe(cb: (state: RendererState) => void): () => void {
    this.stateHandlers.add(cb);
    cb({ ...this.state });
    return () => this.stateHandlers.delete(cb);
  }
  private tick() {
    if (!this.state.isPlaying) return;
    if (!this.clock) return;
    const now = this.clock.now();
    const dt = now - this.lastTick;
    this.lastTick = now;
    this.advance(dt);
    if (this.state.isPlaying) {
      this.animationId = this.clock.request(() => this.tick());
    }
  }
  /** Advance a manually driven director (construct with clock: null) in milliseconds. */
  advance(deltaMs: number) {
    if (!this.state.isPlaying || !Number.isFinite(deltaMs) || deltaMs < 0) return;
    this.state.time += deltaMs * this.options.speed;
    this.updateStateFromTime();
    this.updateCanvas();
    this.notify();
  }
  private updateStateFromTime() {
    if (this.queue.length === 0) {
      this.state.time = 0;
      this.state.frameIndex = 0;
      this.state.progress = 0;
      return;
    }
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
    if (frame.handshape) return frame.handshape;
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
      // Hold the preceding sign across a phrase boundary instead of lowering
      // the arms and rebuilding the signing posture for the next word.
      const previous = this.queue
        .slice(0, this.state.frameIndex)
        .findLast((item) => item.type !== "pause");
      if (previous) {
        this.canvas.setPose(this.resolveHandshapeForFrame(previous));
        this.canvas.setLeftPose?.(previous.leftHandshape ?? null);
        this.canvas.setMotion?.(previous.motion ?? "none", 1, previous.armTarget);
      } else {
        this.canvas.clear();
        this.canvas.setMotion?.("none", 0);
      }
      this.canvas.setExpression?.("neutral");
      this.canvas.setOverlay("Pause");
      this.canvas.setMotionClip?.(null, 0);
      return;
    }
    this.canvas.setLeftPose?.(frame.leftHandshape ?? null);
    const currentHandshape = this.resolveHandshapeForFrame(frame);
    this.canvas.setOverlay(frame.label, frame.sublabel);
    this.canvas.setExpression?.(frame.facialExpression ?? "neutral");

    this.canvas.setMotion?.(
      (frame.motion ?? "none") as MotionType,
      this.state.progress,
      frame.armTarget,
    );
    if (this.canvas.setMotionClip) {
      this.canvas.setMotionClip(frame.motionClip ?? null, this.state.progress);
    }
    const next = this.queue[this.state.frameIndex + 1];
    const hasNext = next !== undefined && next.type !== "pause";
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
  /** Stops the director and clears state. */
  dispose() {
    this.pause();
    this.stateHandlers.clear();
  }
  private notify() {
    const snap = { ...this.state };
    this.stateHandlers.forEach((h) => h(snap));
  }
}
