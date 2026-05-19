# Vision Pipeline

The vision pipeline converts raw webcam frames into committed `SignToken`s representing ASL signs. It runs across two contexts: a Web Worker (for heavy inference) and the main thread (for event emission and UI).

---

## Overview

```
Webcam frame (ImageBitmap)
    │
    ▼  [Web Worker]
MediaPipe HandLandmarker
    │  21 landmarks × 2 (image + world coordinates)
    ▼
Geometry gating (zone, area, score, handedness)
    │
    ▼
SignDetectionPipeline
    ├─ IkiraroSurgicalClassifier
    │    ├─ LandmarkSmoother (1€ filter)
    │    ├─ IkiraroFeatureExtractor → FeatureVector
    │    ├─ IkiraroSurgicalMatcher → candidates[]
    │    ├─ IkiraroTemporalSmoother → { sign, confidence }
    │    ├─ IkiraroTransitionDetector → isTransitioning
    │    └─ IkiraroGestureDetector → gesture type
    │
    └─ LinguisticBuffer
         ├─ FingerspellStrategy → FingerspellToken
         └─ LexemeStrategy → LexemeToken
    │
    └─ SignToken | null
    │
    ▼  [postMessage to main thread]
CameraTrackingState { landmarks, classification, currentWord, sentenceText, committedToken }
    │
    ▼  [VisionSystem]
VisionEventMap events → runtime EventBus
```

---

## Stage 1: MediaPipe Hand Landmarking

**File**: `packages/communication/src/workers/hand-landmarker.worker.ts`

MediaPipe's `HandLandmarker` runs in `VIDEO` mode with these settings:

```
numHands: 1
minHandDetectionConfidence: 0.55
minHandPresenceConfidence: 0.5
minTrackingConfidence: 0.5
```

It produces two sets of landmarks per hand:

- **Image landmarks** (`results.landmarks[0]`): normalized x/y/z in [0,1], z relative to wrist. Used for spatial zone detection, geometry quality, and visual overlay rendering.
- **World landmarks** (`results.worldLandmarks[0]`): metric 3D coordinates anchored at the wrist, free of perspective distortion. Used for sign classification (joint angles and distances are invariant to hand position on screen).

Falls back from GPU to CPU delegate if GPU initialization fails.

---

## Stage 2: Geometry Gating

Before running the classifier, the worker checks five conditions. If any fail, the frame is treated as "no hand" and `pipeline.tick()` is called instead of `pipeline.process()`:

| Gate                   | Threshold          | Purpose                                                    |
| ---------------------- | ------------------ | ---------------------------------------------------------- |
| `geometry.score`       | ≥ 0.5              | Reject poorly detected hands (occluded, partially visible) |
| `geometry.bounds.area` | ≥ 0.005            | Reject hands that are too far from the camera              |
| `centerX`              | [0.08, 0.92]       | Signing zone — ignore hands at frame edges                 |
| `centerY`              | [0.06, 0.94]       | Signing zone — ignore hands at frame top/bottom            |
| `handedness.score`     | ≥ 0.5 (if present) | Reject ambiguous handedness                                |

`evaluateHandGeometry(imageLandmarks)` computes bounding box, center, area, and a quality score from landmark visibility and landmark z-spread.

---

## Stage 3: SignDetectionPipeline

**File**: `packages/engine/src/vision/pipeline.ts`

`SignDetectionPipeline` is the deep module that combines classification and linguistic buffering. It exposes two methods:

```typescript
process(worldLandmarks, imageLandmarks?): SignToken | null  // hand detected
tick(): SignToken | null                                     // no hand (timeout drive)
```

### 3a: LandmarkSmoother (1€ Filter)

**File**: `packages/engine/src/vision/smoothing.ts`

Each of the 21 landmarks is smoothed with an independent `OneEuroFilter3D` — an adaptive low-pass filter that reduces jitter while preserving fast intentional movement. Parameters: `minCutoff=1.0`, `beta=0.007`, `dCutoff=1.0`.

The derivative (velocity) of landmark 9 (middle finger MCP) is used as the wrist velocity signal.

### 3b: Feature Extraction

**File**: `packages/engine/src/vision/feature-vector.ts`, `implementations/feature-extractor.ts`

`extractFeatureVector(worldLandmarks, imageLandmarks?)` computes a 14-field `FeatureVector` from the smoothed landmarks:

| Field                | Description                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `fingerStates[5]`    | `true` if each finger is extended (index–pinky)                                                              |
| `fingerCurls[5]`     | Curl amount 0–1 per finger                                                                                   |
| `thumbToIndexDist`   | Distance from thumb tip to index tip                                                                         |
| `thumbToMiddleDist`  | Distance from thumb tip to middle tip                                                                        |
| `thumbToPinkyDist`   | Distance from thumb tip to pinky tip                                                                         |
| `indexMiddleSpread`  | Spread between index and middle                                                                              |
| `ringPinkySpread`    | Spread between ring and pinky                                                                                |
| `palmOrientation`    | Palm facing direction (dot product with camera axis)                                                         |
| `thumbPosition`      | Thumb relative to palm                                                                                       |
| `thumbVsFingerDepth` | Z of thumb tip minus mean Z of finger PIPs. Negative = thumb forward (ASL S); positive = tucked (M, N, A, T) |
| `fingerAngles[5]`    | Angle at each finger's MCP joint                                                                             |
| `wristAngle`         | Wrist tilt                                                                                                   |
| `spatialZone`        | `"chest" \| "face" \| "chin" \| "forehead" \| "neutral"` — derived from image landmarks                      |
| `velocity`           | `Point3D` wrist velocity from smoother                                                                       |
| `isMoving`           | `velocity magnitude > motionVelocityThreshold (0.15)`                                                        |

**Fingerprint**: A binary string encoding `fingerStates` — 5 bits. Example: `"11000"` = index + middle extended (V/K/U/H…). The matcher uses this as a primary lookup key to narrow the candidate set before running disambiguation.

### 3c: Sign Matching

**File**: `packages/engine/src/vision/implementations/surgical-matcher.ts`

`IkiraroSurgicalMatcher` uses a fingerprint lookup table built from `ASL_ALPHABET` (handshape definitions for A–Z):

```
fingerprint → [HandshapeDefinition, ...]
```

For each definition that shares the fingerprint:

1. Run `def.disambiguate(vector)` → score (0–1). If no disambiguator, score = 0.7.
2. If `def.requiresMotion && !vector.isMoving` → multiply score by 0.2 (strongly penalizes J and Z when hand is still).
3. Return candidates sorted by score descending.

The handshape definitions in `packages/engine/src/vision/handshapes.ts` are manually tuned. Each definition specifies:

```typescript
interface HandshapeDefinition {
  name: string;
  fingerprint: string; // expected finger extension pattern
  requiresMotion?: boolean; // J, Z require movement
  disambiguate?: (v: FeatureVector) => number; // custom scoring function
}
```

Disambiguation functions use the deep fields (`thumbVsFingerDepth`, `thumbToIndexDist`, `palmOrientation`, etc.) to separate visually similar signs (A/S/M/N/E/T all have fingers curled but differ in thumb placement).

### 3d: Temporal Smoothing and Hysteresis

**File**: `packages/engine/src/vision/implementations/temporal-smoother.ts`

`IkiraroTemporalSmoother` prevents flickering between similar signs using a sliding window of 9 frames (`windowSize`).

```
rawScore threshold: 0.68  — candidate must score above this to enter history
lockThreshold:      3     — sign must appear in 3 of last 9 frames to lock
unlockThreshold:    3     — current locked sign must be absent 3 frames to release
```

The output is `{ sign: string | null, confidence: number }`. Confidence = (frames with this sign) / windowSize.

### 3e: Transition Detection

**File**: `packages/engine/src/vision/transition-detector.ts`

`IkiraroTransitionDetector.isTransitioning(velocity, confidence)` suppresses sign detection during fast hand movement. A high velocity combined with low confidence indicates the hand is mid-transition between signs. Transition frames are passed to the linguistic buffer with `isTransitioning: true`, which prevents letter accumulation during inter-sign movement.

### 3f: Gesture Detection

**File**: `packages/engine/src/vision/gesture-detector.ts`

`IkiraroGestureDetector` detects double-letter gestures over a 15-frame velocity history:

- **double-letter-slide**: quick lateral acceleration with pulse shape (low → high → low X velocity, peak > 0.4).
- **double-letter-bounce**: (reserved, not yet implemented).

Gesture events are passed to `FingerspellStrategy` to commit a duplicate letter immediately rather than waiting for the 1500ms hold timeout.

---

## Stage 4: LinguisticBuffer and Strategies

**File**: `packages/engine/src/vision/linguistic-buffer.ts`

`LinguisticBuffer` receives `(sign, context)` from the classifier and routes it through registered strategies. The default configuration uses two strategies in priority order:

### FingerspellStrategy

Handles single-character signs (the ASL alphabet A–Z).

```
New letter detected:
  if now - lastLetterTime > minHoldMs (from asl-defaults.ts):
    buffer += letter
    reset doubleLetterCommitted

Double letter (gesture or hold 1500ms):
  buffer += same letter
  doubleLetterCommitted = true

Pause (no sign for > pauseThresholdMs, default 700ms):
  → FingerspellToken { text: buffer }
  → buffer cleared
```

`getInProgress()` returns the current buffer contents (used by UI to show live "Spelling Now" display).

### LexemeStrategy

Handles multi-character sign IDs (whole-word lexemes like "HELLO", "THANK-YOU").

```
Same multi-char sign held for > 400ms:
  → LexemeToken { lexemeId: sign }
```

---

## Stage 5: CameraTrackingState

After each frame (whether a hand was detected or not), the worker assembles and posts:

```typescript
type CameraTrackingState = {
  landmarks: HandLandmarks; // image landmarks for overlay rendering
  classification: ClassificationResult | null; // sign, confidence, candidates, vector
  currentWord: string; // in-progress letter buffer (FingerspellStrategy)
  sentence: string[]; // committed token values
  sentenceText: string; // joined sentence string
  committedToken: SignToken | null; // freshly committed token (null if none this frame)
};
```

This is transferred to the main thread via `postMessage` and distributed through `VisionSystem` event emitters.

---

## Stage 6: VisionSystem Events

**File**: `packages/communication/src/runtime/vision-system.ts`

`VisionSystem` receives `CameraTrackingState` from `WorkerHandProcessor.onResult` and emits fine-grained events on `VisionEventMap`:

| VisionSystem event | When                            | Payload                         |
| ------------------ | ------------------------------- | ------------------------------- |
| `tracking-update`  | Every frame                     | Full `CameraTrackingState`      |
| `hand-found`       | Hand detected                   | `{ landmarks }`                 |
| `hand-lost`        | No hand in frame                | —                               |
| `sign-detected`    | classification.sign is non-null | `{ sign, confidence }`          |
| `word-committed`   | committedToken is non-null      | `SignToken`                     |
| `buffer-update`    | Every frame                     | `{ currentWord, sentenceText }` |
| `fps-update`       | Every second                    | frame count                     |

`VisionPlugin` subscribes to these and re-emits on the runtime event bus.

---

## ASL Alphabet Coverage

`packages/engine/src/vision/handshapes.ts` defines handshape entries for all 26 letters of the ASL fingerspelling alphabet (A–Z) plus some common variations. Signs that share fingerprints are disambiguated by their `disambiguate` function:

| Fingerprint "00000" (all fingers curled) | Signs: A, S, E, M, N, T |
| Fingerprint "10000" (index only) | Signs: D, G, X, 1 |
| Fingerprint "11000" (index + middle) | Signs: U, H, K, V, 2 |
| etc. |

Letters requiring motion (J — index traces a J curve; Z — index traces a Z) have `requiresMotion: true` and are suppressed when `vector.isMoving` is false.

---

## ASL Defaults

**File**: `packages/engine/src/vision/asl-defaults.ts`

Constants shared across vision modules:

```typescript
const ASL_DEFAULTS = {
  minLetterHoldMs: 120, // minimum hold time before a letter enters FingerspellStrategy buffer
  doubleLetterHoldMs: 1500, // hold same letter this long to trigger double-letter
  pauseThresholdMs: 700, // silence this long to commit the current word
};
```

---

## Web Worker Lifecycle

The worker is instantiated lazily when `WorkerHandProcessor.init()` is called. The worker accepts four message types:

| Message                                                 | Action                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `{ type: "init" }`                                      | Load MediaPipe WASM and model from CDN, post `ready`              |
| `{ type: "detect", imageBitmap, timestampMs, frameId }` | Classify frame, post `result`                                     |
| `{ type: "reset" }`                                     | Reset pipeline (classifier smoother, transition, gesture, buffer) |
| `{ type: "correct", sign }`                             | Override last accumulated letter in FingerspellStrategy buffer    |
| `{ type: "dispose" }`                                   | Close HandLandmarker, terminate worker                            |

The `detect` message transfers the `ImageBitmap` (zero-copy) to the worker. The worker closes the bitmap after use.

MediaPipe WASM and model are loaded from CDN:

- WASM root: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm`
- Model: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`
