/// <reference lib="webworker" />

import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import {
  SensaSurgicalClassifier,
  WordBuffer,
  type CameraTrackingState,
} from "@sensa/communication";

import type { MainToWorkerMessage, WorkerToMainMessage } from "@/lib/hand-tracking-types";

declare const self: DedicatedWorkerGlobalScope;

// Keep this in sync with the installed @mediapipe/tasks-vision bundle version.
const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let handLandmarker: HandLandmarker | null = null;
let classifier = new SensaSurgicalClassifier();
let wordBuffer = new WordBuffer();
let initPromise: Promise<void> | null = null;

function postMessage(message: WorkerToMainMessage) {
  self.postMessage(message);
}

async function initializeWorker(): Promise<void> {
  if (handLandmarker) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
    let lastError: unknown;

    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions:
            delegate === "GPU"
              ? {
                  modelAssetPath: MODEL_ASSET_PATH,
                  delegate: "GPU",
                }
              : {
                  modelAssetPath: MODEL_ASSET_PATH,
                },
          runningMode: "VIDEO",
          numHands: 1,
        });

        postMessage({
          type: "ready",
          delegate,
        });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Unable to start the hand landmarker.");
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

function getTrackingStateFromResult(
  result: ReturnType<SensaSurgicalClassifier["process"]> | null,
  landmarks: CameraTrackingState["landmarks"],
  committedWord: string | null,
): CameraTrackingState {
  const state = wordBuffer.getState();

  return {
    landmarks,
    classification: result,
    currentWord: state.currentWord,
    sentence: state.sentence,
    sentenceText: state.sentenceText,
    committedWord,
  };
}

self.onmessage = async (event: MessageEvent<MainToWorkerMessage>) => {
  const message = event.data;

  try {
    if (message.type === "init") {
      await initializeWorker();
      return;
    }

    if (message.type === "reset") {
      classifier.reset();
      wordBuffer.clearAll();
      return;
    }

    if (message.type === "dispose") {
      handLandmarker?.close();
      handLandmarker = null;
      classifier.reset();
      wordBuffer.clearAll();
      return;
    }

    await initializeWorker();
    if (!handLandmarker) {
      throw new Error("Hand landmarker did not initialize.");
    }

    try {
      const results = handLandmarker.detectForVideo(message.imageBitmap, message.timestampMs);
      if (results.landmarks?.[0]) {
        const landmarks = results.landmarks[0];
        const classification = classifier.process(landmarks);
        const committedWord = wordBuffer.update(classification.sign);
        postMessage({
          type: "result",
          frameId: message.frameId,
          tracking: getTrackingStateFromResult(classification, landmarks, committedWord),
        });
      } else {
        const committedWord = wordBuffer.update(null);
        postMessage({
          type: "result",
          frameId: message.frameId,
          tracking: getTrackingStateFromResult(null, [], committedWord),
        });
      }
    } finally {
      message.imageBitmap.close();
    }
  } catch (error) {
    postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "Worker execution failed.",
    });
  }
};
