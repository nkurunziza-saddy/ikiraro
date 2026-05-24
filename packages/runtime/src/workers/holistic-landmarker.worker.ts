/// <reference lib="webworker" />
import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { SignDetectionPipeline, evaluateHandGeometry } from "@ikiraro/engine/vision";
import type { CameraTrackingState, Point3D } from "@ikiraro/engine/vision";
import type { SignToken } from "@ikiraro/engine/types";
import type { MainToWorkerMessage, WorkerToMainMessage } from "../capture/hand-tracking-types";

declare const self: DedicatedWorkerGlobalScope;

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const MIN_HANDEDNESS_SCORE = 0.5;
const MIN_CLASSIFICATION_GEOMETRY_SCORE = 0.5;
const MIN_CLASSIFICATION_HAND_AREA = 0.005;
const SIGNING_ZONE = { minX: 0.08, maxX: 0.92, minY: 0.06, maxY: 0.94 } as const;

let handLandmarker: HandLandmarker | null = null;
let faceLandmarker: FaceLandmarker | null = null;
let poseLandmarker: PoseLandmarker | null = null;

let pipeline = new SignDetectionPipeline(undefined, { pauseThresholdMs: 700 });
let initPromise: Promise<void> | null = null;

const debugMode = import.meta.env.DEV;
let lastDebugSign: string | null = null;

function postMessage(message: WorkerToMainMessage) {
  self.postMessage(message);
}

async function initializeWorker(): Promise<void> {
  if (handLandmarker && faceLandmarker && poseLandmarker) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_ROOT, true);
    let lastError: unknown;

    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        const baseOptions = (modelAssetPath: string) =>
          delegate === "GPU" ? { modelAssetPath, delegate: "GPU" as const } : { modelAssetPath };

        [poseLandmarker, handLandmarker, faceLandmarker] = await Promise.all([
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: baseOptions(POSE_MODEL),
            runningMode: "VIDEO",
          }),
          HandLandmarker.createFromOptions(vision, {
            baseOptions: baseOptions(HAND_MODEL),
            runningMode: "VIDEO",
            numHands: 2, // Track both hands
            minHandDetectionConfidence: 0.55,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }),
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: baseOptions(FACE_MODEL),
            runningMode: "VIDEO",
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            numFaces: 1,
          }),
        ]);

        postMessage({ type: "ready", delegate });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Unable to start the holistic landmarkers.");
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

function getTrackingState(
  landmarks: Point3D[],
  faceLandmarks: Point3D[] | undefined,
  poseLandmarks: Point3D[] | undefined,
  committedToken: SignToken | null,
): CameraTrackingState {
  const state = pipeline.getBufferState();
  return {
    landmarks,
    faceLandmarks,
    poseLandmarks,
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
      postMessage({
        type: "result",
        frameId: -1,
        tracking: getTrackingState([], undefined, undefined, null),
      });
      return;
    }
    if (message.type === "dispose") {
      handLandmarker?.close();
      faceLandmarker?.close();
      poseLandmarker?.close();
      handLandmarker = null;
      faceLandmarker = null;
      poseLandmarker = null;
      pipeline.reset();
      return;
    }
    if (message.type === "detect") {
      await initializeWorker();
      if (!handLandmarker || !faceLandmarker || !poseLandmarker) {
        throw new Error("Landmarkers did not initialize.");
      }

      try {
        const poseResults = poseLandmarker.detectForVideo(message.imageBitmap, message.timestampMs);
        const handResults = handLandmarker.detectForVideo(message.imageBitmap, message.timestampMs);
        const faceResults = faceLandmarker.detectForVideo(message.imageBitmap, message.timestampMs);

        // Extract primary hand (usually right hand or whichever is detected first)
        const imageLandmarks = handResults.landmarks?.[0];
        const worldLandmarks = handResults.worldLandmarks?.[0];
        const handednessScore = handResults.handedness?.[0]?.[0]?.score ?? null;

        const faceLms = faceResults.faceLandmarks?.[0];
        const poseLms = poseResults.landmarks?.[0];

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

        const classifyWith = worldLandmarks ?? imageLandmarks;
        if (classifyWith && isUsable) {
          const committedToken = pipeline.process(classifyWith, imageLandmarks);
          const classification = pipeline.lastClassification;

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
            tracking: getTrackingState(imageLandmarks ?? [], faceLms, poseLms, committedToken),
          });
        } else if (imageLandmarks || faceLms || poseLms) {
          lastDebugSign = null;
          const committedToken = pipeline.tick();
          postMessage({
            type: "result",
            frameId: message.frameId,
            tracking: getTrackingState(imageLandmarks ?? [], faceLms, poseLms, committedToken),
          });
        } else {
          lastDebugSign = null;
          const committedToken = pipeline.tick();
          postMessage({
            type: "result",
            frameId: message.frameId,
            tracking: getTrackingState([], undefined, undefined, committedToken),
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
