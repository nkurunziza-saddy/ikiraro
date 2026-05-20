import type { CommunicationMode, TranslationEnvelope } from "@ikiraro/engine/types";

export type CaptureStatus = "idle" | "capturing" | "processing" | "error";

export interface CaptureAdapter {
  readonly mode: CommunicationMode;
  start(): Promise<void>;
  stop(): Promise<any>; // Returns the raw data (Blob, string, etc.)
  reset(): void;
  onStatus(cb: (status: CaptureStatus) => void): () => void;
  onLevel?(cb: (level: number) => void): () => void;
}

export interface CaptureSession {
  stop(): Promise<TranslationEnvelope>;
  cancel(): void;
  subscribe(cb: (state: { status: CaptureStatus; level: number }) => void): () => void;
  readonly status: CaptureStatus;
  readonly level: number;
}
