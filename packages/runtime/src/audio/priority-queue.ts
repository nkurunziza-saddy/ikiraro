import { AccessibilityModeManager } from "./mode-manager";
import type { AudioPriority, QueuedMessage } from "./types";

const PRIORITY_RANK: Record<AudioPriority, number> = {
  critical: 3,
  high: 2,
  normal: 1,
  low: 0,
};

let idCounter = 0;

export class AudioQueue {
  private static instance: AudioQueue | null = null;

  private queue: QueuedMessage[] = [];
  private currentPriority: AudioPriority | null = null;
  private lastMessage: string | null = null;
  private speaking = false;
  private flushing = false;

  private speakFn: (text: string) => Promise<void>;
  private cancelFn: () => void;

  constructor(speakFn: (text: string) => Promise<void>, cancelFn: () => void) {
    this.speakFn = speakFn;
    this.cancelFn = cancelFn;
  }

  setDriver(driver: { speak: (text: string) => Promise<void>; cancel: () => void }) {
    this.speakFn = driver.speak;
    this.cancelFn = driver.cancel;
  }

  static getInstance(speakFn?: (text: string) => Promise<void>, cancelFn?: () => void): AudioQueue {
    if (!AudioQueue.instance) {
      if (!speakFn || !cancelFn)
        throw new Error("AudioQueue: provide speakFn and cancelFn on first init");
      AudioQueue.instance = new AudioQueue(speakFn, cancelFn);
    }
    return AudioQueue.instance;
  }

  speak(text: string, priority: AudioPriority = "normal"): void {
    if (AccessibilityModeManager.getInstance().isTtsSuppressed()) return;
    this.enqueue({ text, priority, id: String(idCounter++) });
  }

  /** Like speak(), but returns a Promise that resolves when this specific message finishes. */
  speakAsync(text: string, priority: AudioPriority = "normal"): Promise<void> {
    if (AccessibilityModeManager.getInstance().isTtsSuppressed()) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.enqueue({ text, priority, id: String(idCounter++), onDone: resolve });
    });
  }

  stop(): void {
    this.cancelFn();
    this.speaking = false;
    // Resolve any waiting promises before clearing
    this.queue.forEach((m) => m.onDone?.());
    this.queue = [];
    this.currentPriority = null;
  }

  repeat(): void {
    if (this.lastMessage) this.speak(this.lastMessage, "high");
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  getLastMessage(): string | null {
    return this.lastMessage;
  }

  private enqueue(msg: QueuedMessage): void {
    const incomingRank = PRIORITY_RANK[msg.priority];

    if (msg.priority === "low" && (this.speaking || this.queue.length > 0)) {
      msg.onDone?.();
      return;
    }

    if (
      this.speaking &&
      this.currentPriority &&
      incomingRank > PRIORITY_RANK[this.currentPriority]
    ) {
      this.cancelFn();
      this.speaking = false;
      // Resolve and discard lower-priority items
      this.queue
        .filter((m) => PRIORITY_RANK[m.priority] < incomingRank)
        .forEach((m) => m.onDone?.());
      this.queue = this.queue.filter((m) => PRIORITY_RANK[m.priority] >= incomingRank);
      this.queue.unshift(msg);
    } else {
      this.queue.push(msg);
    }

    if (!this.flushing) void this.flush();
  }

  private async flush(): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;

    while (this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.speaking = true;
      this.currentPriority = next.priority;
      this.lastMessage = next.text;

      try {
        await this.speakFn(next.text);
      } catch {
        // Ignore individual speech errors — continue the queue
      }

      next.onDone?.();
      this.speaking = false;
      this.currentPriority = null;
    }

    this.flushing = false;
  }

  static reset(): void {
    AudioQueue.instance = null;
  }
}
