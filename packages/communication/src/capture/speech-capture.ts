import { getSupportedAudioRecordingMimeType } from "./audio-utils";
import type { CaptureAdapter, CaptureStatus } from "./types";

/**
 * CaptureAdapter for speech/audio input.
 * Encapsulates MediaRecorder and Web Audio API for levels.
 */
export class SpeechCaptureAdapter implements CaptureAdapter {
  readonly mode = "speech";
  private recorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private status: CaptureStatus = "idle";
  private statusHandlers = new Set<(s: CaptureStatus) => void>();
  private levelHandlers = new Set<(l: number) => void>();
  private animationId: number | null = null;

  async start(): Promise<void> {
    if (this.status === "capturing") return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioRecordingMimeType();
      this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
      this.chunks = [];

      this.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.setupLevels(this.stream);

      this.recorder.start();
      this.setStatus("capturing");
    } catch (err) {
      this.setStatus("error");
      throw err;
    }
  }

  async stop(): Promise<Blob> {
    if (!this.recorder || this.status !== "capturing") {
      return new Blob([], { type: "audio/webm" });
    }

    return new Promise((resolve) => {
      this.recorder!.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder!.mimeType });
        this.cleanup();
        this.setStatus("idle");
        resolve(blob);
      };
      this.recorder!.stop();
    });
  }

  reset(): void {
    this.cleanup();
    this.chunks = [];
    this.setStatus("idle");
  }

  onStatus(cb: (status: CaptureStatus) => void): () => void {
    this.statusHandlers.add(cb);
    cb(this.status);
    return () => {
      this.statusHandlers.delete(cb);
    };
  }

  onLevel(cb: (level: number) => void): () => void {
    this.levelHandlers.add(cb);
    return () => {
      this.levelHandlers.delete(cb);
    };
  }

  private setStatus(status: CaptureStatus) {
    this.status = status;
    this.statusHandlers.forEach((h) => h(status));
  }

  private setupLevels(stream: MediaStream) {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (this.status !== "capturing") return;
      this.analyser!.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]!;
      }
      const average = sum / bufferLength;
      this.levelHandlers.forEach((h) => h(average / 128)); // Normalize to 0..1 approx
      this.animationId = requestAnimationFrame(update);
    };

    update();
  }

  private cleanup() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.stream = null;
    this.recorder = null;
    this.audioContext = null;
    this.analyser = null;
  }
}
