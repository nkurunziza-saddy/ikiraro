/// <reference lib="webworker" />

import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { SignDetectionPipeline, evaluateHandGeometry } from "@ikiraro/engine/vision";
import type { CameraTrackingState } from "@ikiraro/engine/vision";
import type { SignToken } from "@ikiraro/engine/types";

import type { MainToWorkerMessage, WorkerToMainMessage } from "../capture/hand-tracking-types";

declare const self: DedicatedWorkerGlobalScope;

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const MIN_HANDEDNESS_SCORE = 0.5;
const MIN_CLASSIFICATION_GEOMETRY_SCORE = 0.5;
const MIN_CLASSIFICATION_HAND_AREA = 0.005;
const SIGNING_ZONE = { minX: 0.08, maxX: 0.92, minY: 0.06, maxY: 0.94 } as const;

let handLandmarker: HandLandmarker | null = null;
let pipeline = new SignDetectionPipeline(undefined, { pauseThresholdMs: 700 });
let initPromise: Promise<void> | null = null;

const debugMode = import.meta.env.DEV;
let lastDebugSign: string | null = null;

function postMessage(message: WorkerToMainMessage) {
  self.postMessage(message);
}

async function initializeWorker(): Promise<void> {
  if (handLandmarker) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_ROOT, true);
    let lastError: unknown;

    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions:
            delegate === "GPU"
              ? { modelAssetPath: MODEL_ASSET_PATH, delegate: "GPU" }
              : { modelAssetPath: MODEL_ASSET_PATH },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        postMessage({ type: "ready", delegate });
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

function getTrackingState(
  landmarks: CameraTrackingState["landmarks"],
  committedToken: SignToken | null,
): CameraTrackingState {
  const state = pipeline.getBufferState();
  return {
    landmarks,
    classification: pipeline.lastClassification,
    currentWord: state.currentWord,
    sentence: state.sentence,
    sentenceText: state.sentenceText,
    committedToken,
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
      pipeline.reset();
      return;
    }

    if (message.type === "correct") {
      pipeline.overrideLast(message.sign);
      postMessage({ type: "result", frameId: -1, tracking: getTrackingState([], null) });
      return;
    }

    if (message.type === "dispose") {
      handLandmarker?.close();
      handLandmarker = null;
      pipeline.reset();
      return;
    }

    if (message.type === "detect") {
      await initializeWorker();
      if (!handLandmarker) throw new Error("Hand landmarker did not initialize.");

      try {
        const results = handLandmarker.detectForVideo(message.imageBitmap, message.timestampMs);

        // Image landmarks: x/y in [0,1], z relative. Used for geometry checks and display.
        const imageLandmarks = results.landmarks?.[0];
        // World landmarks: metric 3D, wrist-anchored. Used for classification.
        // Angles and distances here are free of perspective distortion.
        const worldLandmarks = results.worldLandmarks?.[0];
        const handednessScore = results.handedness?.[0]?.[0]?.score ?? null;

        const geometry = imageLandmarks ? evaluateHandGeometry(imageLandmarks) : null;
        const isInSigningZone =
          geometry !== null &&
          geometry.bounds.centerX >= SIGNING_ZONE.minX &&
          geometry.bounds.centerX <= SIGNING_ZONE.maxX &&
          geometry.bounds.centerY >= SIGNING_ZONE.minY &&
          geometry.bounds.centerY <= SIGNING_ZONE.maxY;

        const isUsable =
          Boolean(imageLandmarks) &&
          geometry !== null &&
          geometry.score >= MIN_CLASSIFICATION_GEOMETRY_SCORE &&
          geometry.bounds.area >= MIN_CLASSIFICATION_HAND_AREA &&
          isInSigningZone &&
          (handednessScore === null || handednessScore >= MIN_HANDEDNESS_SCORE);

        // Prefer worldLandmarks for classification; fall back to image landmarks if unavailable.
        const classifyWith = worldLandmarks ?? imageLandmarks;

        if (classifyWith && isUsable) {
          // Pass image landmarks as the second arg so spatialZone stays image-based.
          const committedToken = pipeline.process(classifyWith, imageLandmarks);
          const classification = pipeline.lastClassification;

          // Debug: log feature vector when a high-confidence sign is first locked.
          if (
            debugMode &&
            classification?.sign &&
            classification.sign !== lastDebugSign &&
            classification.confidence >= 0.8
          ) {
            lastDebugSign = classification.sign;
            console.log(
              `[ikiraro:calibrate] sign=${classification.sign} confidence=${classification.confidence.toFixed(2)}`,
              classification.vector,
            );
          }

          postMessage({
            type: "result",
            frameId: message.frameId,
            tracking: getTrackingState(imageLandmarks ?? [], committedToken),
          });
        } else if (imageLandmarks) {
          lastDebugSign = null;
          const committedToken = pipeline.tick();
          postMessage({
            type: "result",
            frameId: message.frameId,
            tracking: getTrackingState(imageLandmarks, committedToken),
          });
        } else {
          lastDebugSign = null;
          const committedToken = pipeline.tick();
          postMessage({
            type: "result",
            frameId: message.frameId,
            tracking: getTrackingState([], committedToken),
          });
        }
      } finally {
        message.imageBitmap.close();
      }
    }
  } catch (error) {
    postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "Worker execution failed.",
    });
  }
};
