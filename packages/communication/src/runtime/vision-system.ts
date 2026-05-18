import type { HandProcessor, VisionEventMap, VisionStatus } from "@ikiraro/engine/vision";

/**
 * The VisionSystem orchestrates the end-to-end hand tracking pipeline.
 * It is responsible for:
 * 1. Managing the camera lifecycle (MediaStream).
 * 2. Running a frame loop at the video's native rate.
 * 3. Driving a HandProcessor (usually a Web Worker) with frame bitmaps.
 * 4. Normalizing and emitting high-level vision events.
 * 5. Bypassing browser rendering bugs via a canvas mirror.
 *
 * This class is framework-agnostic and maintains the state of the active
 * tracking session, providing high leverage to UI adapters.
 */
export class VisionSystem {
  private _status: VisionStatus = "idle";
  private handlers: Map<keyof VisionEventMap, Set<(data: any) => void>> = new Map();
  private videoEl: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private videoFrameCallbackId: number | null = null;
  private busy = false;
  private lastFpsTime = 0;
  private frameCount = 0;
  private lastVideoTime = -1;

  constructor(private processor: HandProcessor) {
    this.setupProcessorHandlers();
  }

  private setupProcessorHandlers() {
    this.processor.onResult((tracking) => {
      this.busy = false;
      this.frameCount++;

      const now = performance.now();
      if (now - this.lastFpsTime >= 1000) {
        this.emit("fps-update", this.frameCount);
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      this.emit("tracking-update", tracking);

      if (tracking.landmarks && tracking.landmarks.length > 0) {
        this.emit("hand-found", { landmarks: tracking.landmarks });
        if (tracking.classification?.sign) {
          this.emit("sign-detected", {
            sign: tracking.classification.sign,
            confidence: tracking.classification.confidence,
          });
        }
      } else {
        this.emit("hand-lost", undefined);
      }

      if (tracking.committedWord) {
        this.emit("word-committed", tracking.committedWord);
      }

      this.emit("buffer-update", {
        currentWord: tracking.currentWord,
        sentenceText: tracking.sentenceText,
      });
    });

    this.processor.onError((err) => {
      this.setStatus("error");
      this.emit("error", err);
    });
  }

  async start(videoElement: HTMLVideoElement): Promise<void> {
    if (this._status === "active" || this._status === "starting") return;

    this.setStatus("starting");
    this.videoEl = videoElement;

    try {
      await this.processor.init();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera capture is not supported in this browser.");
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      this.videoEl.srcObject = this.stream;

      await new Promise<void>((resolve) => {
        if (this.videoEl!.readyState >= HTMLMediaElement.HAVE_METADATA) {
          resolve();
        } else {
          this.videoEl!.onloadedmetadata = () => resolve();
        }
      });

      await this.videoEl.play();

      this.setStatus("active");
      this.lastVideoTime = -1;
      this.lastFpsTime = performance.now();
      this.frameCount = 0;
      this.queueNextFrame();
    } catch (err) {
      this.stop();
      this.setStatus("error");
      const message = err instanceof Error ? err.message : "Unable to start camera.";
      this.emit("error", message);
      throw err;
    }
  }

  stop(): void {
    this.setStatus("idle");

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.videoEl && "cancelVideoFrameCallback" in this.videoEl) {
      const v = this.videoEl as any;
      if (this.videoFrameCallbackId !== null) {
        v.cancelVideoFrameCallback(this.videoFrameCallbackId);
        this.videoFrameCallbackId = null;
      }
    }

    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.lastVideoTime = -1;
    this.busy = false;

    if (this.videoEl) {
      this.videoEl.pause();
      this.videoEl.srcObject = null;
    }
  }

  reset(): void {
    this.processor.reset();
  }

  manualCorrect(sign: string): void {
    this.processor.correct(sign);
  }

  get status(): VisionStatus {
    return this._status;
  }

  on<K extends keyof VisionEventMap>(event: K, handler: (data: VisionEventMap[K]) => void): void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler);
    this.handlers.set(event, set);
  }

  off<K extends keyof VisionEventMap>(event: K, handler: (data: VisionEventMap[K]) => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  private emit<K extends keyof VisionEventMap>(event: K, data: VisionEventMap[K]) {
    this.handlers.get(event)?.forEach((h) => h(data));
  }

  private setStatus(status: VisionStatus) {
    if (this._status === status) return;
    this._status = status;
    this.emit("status-change", status);
  }

  private queueNextFrame() {
    if (this._status !== "active") return;

    if (this.videoEl && "requestVideoFrameCallback" in this.videoEl) {
      const v = this.videoEl as any;
      this.videoFrameCallbackId = v.requestVideoFrameCallback((now: number) => {
        this.videoFrameCallbackId = null;
        this.captureAndSend(now);
      });
    } else {
      this.animationFrameId = requestAnimationFrame((now) => {
        this.animationFrameId = null;
        this.captureAndSend(now);
      });
    }
  }

  private async captureAndSend(now: number) {
    if (this._status !== "active" || !this.videoEl) return;

    if (this.videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.queueNextFrame();
      return;
    }

    if (this.videoEl.currentTime === this.lastVideoTime) {
      this.queueNextFrame();
      return;
    }

    this.lastVideoTime = this.videoEl.currentTime;

    if (this.busy) {
      this.queueNextFrame();
      return;
    }

    this.busy = true;

    try {
      const bitmap = await createImageBitmap(this.videoEl);
      if (this._status !== "active") {
        bitmap.close();
        this.busy = false;
        return;
      }
      this.processor.process(bitmap, now);
      this.queueNextFrame();
    } catch {
      this.busy = false;
      this.queueNextFrame();
    }
  }
}
