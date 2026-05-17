import type { TranslationEnvelope } from "@sensa/engine/types";

export type PlaybackStatus = "playing" | "paused" | "stopped" | "idle";

/**
 * The Director is a headless controller for sign playback.
 * It manages timing, state, and the renderer queue.
 */
export class SensaDirector {
  private status: PlaybackStatus = "idle";
  private currentIndex = 0;
  private queue: string[] = [];
  private speed = 1.0;
  private subscribers = new Set<(status: PlaybackStatus, index: number) => void>();
  private timer: any = null;

  setEnvelope(envelope: TranslationEnvelope) {
    this.queue = envelope.rendererQueue;
    this.currentIndex = 0;
    this.setStatus("idle");
  }

  play() {
    if (this.queue.length === 0) return;
    this.setStatus("playing");
    this.tick();
  }

  pause() {
    this.setStatus("paused");
    if (this.timer) clearTimeout(this.timer);
  }

  stop() {
    this.setStatus("stopped");
    this.currentIndex = 0;
    if (this.timer) clearTimeout(this.timer);
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  subscribe(cb: (status: PlaybackStatus, index: number) => void) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private setStatus(status: PlaybackStatus) {
    this.status = status;
    this.notify();
  }

  private notify() {
    this.subscribers.forEach((cb) => cb(this.status, this.currentIndex));
  }

  private tick() {
    if (this.status !== "playing") return;

    if (this.currentIndex >= this.queue.length) {
      this.stop();
      return;
    }

    // Emit 'tick' for the current unit
    // In a real app, timing would come from lexeme metadata
    const duration = 800 / this.speed;

    this.timer = setTimeout(() => {
      this.currentIndex++;
      this.notify();
      this.tick();
    }, duration);
  }
}
