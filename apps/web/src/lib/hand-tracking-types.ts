import type { CameraTrackingState } from "@sensa/communication";

export type HandWorkerReadyMessage = {
  type: "ready";
  delegate: "GPU" | "CPU";
};

export type HandWorkerResultMessage = {
  type: "result";
  frameId: number;
  tracking: CameraTrackingState;
};

export type HandWorkerErrorMessage = {
  type: "error";
  error: string;
};

export type WorkerToMainMessage =
  | HandWorkerReadyMessage
  | HandWorkerResultMessage
  | HandWorkerErrorMessage;

export type HandWorkerInitMessage = {
  type: "init";
};

export type HandWorkerDetectMessage = {
  type: "detect";
  frameId: number;
  timestampMs: number;
  imageBitmap: ImageBitmap;
};

export type HandWorkerResetMessage = {
  type: "reset";
};

export type HandWorkerDisposeMessage = {
  type: "dispose";
};

export type MainToWorkerMessage =
  | HandWorkerInitMessage
  | HandWorkerDetectMessage
  | HandWorkerResetMessage
  | HandWorkerDisposeMessage;
