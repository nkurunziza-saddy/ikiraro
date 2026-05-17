import type { FrameItem } from "@sensa/components/frame-queue";
import type { SignCanvas, RendererState, PlaybackOptions } from "./types";

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
  private onStateChange: (state: RendererState) => void = () => {};

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

  subscribe(cb: (state: RendererState) => void) {
    this.onStateChange = cb;
    cb(this.state);
    return () => {
      this.onStateChange = () => {};
    };
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

  private updateCanvas() {
    const frame = this.queue[this.state.frameIndex];
    if (!frame) {
      this.canvas.clear();
      return;
    }

    if (frame.type === "pause") {
      this.canvas.clear();
      this.canvas.setOverlay("Pause");
      return;
    }

    this.canvas.setHand(frame.value, frame.motion);
    this.canvas.setOverlay(frame.label, frame.sublabel);

    if (this.canvas.setExpression && frame.facialExpression) {
      this.canvas.setExpression(frame.facialExpression);
    }

    // Centralized Transition logic:
    // If we are in the last 20% of a frame, start blending to the next
    if (
      this.canvas.setBlend &&
      this.state.progress > 0.8 &&
      this.state.frameIndex < this.queue.length - 1
    ) {
      const nextFrame = this.queue[this.state.frameIndex + 1]!;
      const blendFactor = (this.state.progress - 0.8) / 0.2;
      this.canvas.setBlend(blendFactor, frame.value, nextFrame.value);
    } else if (this.canvas.setBlend) {
      this.canvas.setBlend(0, frame.value, frame.value);
    }
  }

  private notify() {
    this.onStateChange({ ...this.state });
  }
}
