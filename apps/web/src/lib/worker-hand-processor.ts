import type { CameraTrackingState, HandProcessor } from "@sensa/engine/vision";
import type { MainToWorkerMessage, WorkerToMainMessage } from "./hand-tracking-types";
import HandWorker from "../workers/hand-landmarker.worker?worker";

/**
 * Worker-based implementation of HandProcessor.
 * Handles the communication with the hand-landmarker Web Worker.
 */
export class WorkerHandProcessor implements HandProcessor {
  private worker: Worker | null = null;
  private resultHandlers = new Set<(tracking: CameraTrackingState) => void>();
  private errorHandlers = new Set<(error: string) => void>();
  private readyHandlers = new Set<(delegate: "GPU" | "CPU") => void>();
  private frameId = 0;

  async init(): Promise<void> {
    if (this.worker) return;

    this.worker = new HandWorker();
    this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      const msg = event.data;
      if (msg.type === "ready") {
        this.readyHandlers.forEach((h) => h(msg.delegate));
      } else if (msg.type === "result") {
        this.resultHandlers.forEach((h) => h(msg.tracking));
      } else if (msg.type === "error") {
        this.errorHandlers.forEach((h) => h(msg.error));
      }
    };

    this.worker.onerror = (e) => {
      this.errorHandlers.forEach((h) => h(e.message ?? "Worker crashed."));
    };

    this.worker.postMessage({ type: "init" } satisfies MainToWorkerMessage);
  }

  process(bitmap: ImageBitmap, timestamp: number): void {
    if (!this.worker) {
      bitmap.close();
      return;
    }

    this.worker.postMessage(
      {
        type: "detect",
        frameId: this.frameId++,
        timestampMs: timestamp,
        imageBitmap: bitmap,
      } satisfies MainToWorkerMessage,
      [bitmap],
    );
  }

  reset(): void {
    this.worker?.postMessage({ type: "reset" } satisfies MainToWorkerMessage);
    this.frameId = 0;
  }

  correct(sign: string): void {
    this.worker?.postMessage({ type: "correct", sign } satisfies MainToWorkerMessage);
  }

  dispose(): void {
    this.worker?.postMessage({ type: "dispose" } satisfies MainToWorkerMessage);
    this.worker?.terminate();
    this.worker = null;
    this.frameId = 0;
  }

  onResult(cb: (tracking: CameraTrackingState) => void): void {
    this.resultHandlers.add(cb);
  }

  onError(cb: (error: string) => void): void {
    this.errorHandlers.add(cb);
  }

  onReady(cb: (delegate: "GPU" | "CPU") => void): void {
    this.readyHandlers.add(cb);
  }
}
