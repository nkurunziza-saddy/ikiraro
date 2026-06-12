# useHandTracking

A separate hook that boots a MediaPipe Web Worker and drives a 6-stage surgical classifier. The worker initializes on mount and tears down on unmount. No connection to the main Ikiraro runtime — integrate by passing `tracking.sentenceText` to `translate()`.

## Usage

```tsx
import { useHandTracking } from "@ikiraro/sdk";

function CameraView() {
  const {
    videoRef,       // callback ref — attach directly to <video>
    tracking,       // CameraTrackingState
    isReady,        // worker fully booted
    delegate,       // "GPU" | "CPU" | null
    fps,
    isActive,
    error,
    start,          // async () => void — call after videoRef mounts
    stop,
    clear,          // reset sentence buffer
    manualCorrect,  // override classifier (for training UIs)
  } = useHandTracking();

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="scale-x-[-1]"   // mirror the feed
      />
      <button onClick={() => start()}>Start camera</button>
      <button onClick={stop}>Stop</button>
      <p>Detected: {tracking.currentWord}</p>
      <p>Sentence: {tracking.sentenceText}</p>
    </div>
  );
}
```

> **Video ref rule:** Always attach `videoRef` directly to the `<video>` element — no wrapper div. On Linux, `overflow-hidden` on a parent clips the CSS transform; apply `scale-x-[-1]` directly on the video element to mirror correctly.

## CameraTrackingState

The `tracking` object reflects the linguistic buffer state built up across frames. Read `sentenceText` when the user signals they're done signing, and pass it to `translate()`.

- `landmarks`: Raw MediaPipe hand landmarks for the current frame.
- `classification`: Classifier's current best-match ASL sign code.
- `currentWord`: Word being assembled from individual letter classifications.
- `sentence`: Completed words since the last clear().
- `sentenceText`: sentence joined with spaces — ready to pass to translate().
- `committedToken`: Most recently committed letter token.

## Integrating with useIkiraro

`useHandTracking` and `useIkiraro` are independent hooks. Bridge them by passing detected text to `translate()` when the user confirms.

```ts
// Typical pattern: camera panel feeds into text translate
const camera = useHandTracking();
const { translate } = useIkiraro();

// When the user confirms the detected sentence:
function commitSentence() {
  const text = camera.tracking.sentenceText;
  if (text) {
    translate(text);  // send to LLM → avatar
    camera.clear();   // reset linguistic buffer
  }
}
```

## Pipeline internals

The classifier runs entirely in a dedicated Web Worker. Each video frame flows through six stages before updating `CameraTrackingState`:

```ts
// 6-stage surgical vision pipeline (happens inside the worker):
//
// Frame
//   → MediaPipe (GPU/CPU, numHands: 1)
//   → Geometry gating (5 conditions — rejects invalid frames early)
//   → LandmarkSmoother (1€ filter per joint)
//   → FeatureExtractor (14-field FeatureVector incl. fingerprint, spatialZone)
//   → SurgicalMatcher (pose library lookup with surgical confidence scoring)
//   → TemporalSmoother (window=9, lockThreshold=3)
//   → LinguisticBuffer (FingerspellStrategy + LexemeStrategy)
//   → CameraTrackingState
```

- **Geometry gating**: Rejects low-confidence frames early using 5 geometric conditions. Prevents noisy frames from polluting the classifier.
- **LandmarkSmoother**: 1€ filter applied per joint. Removes high-frequency jitter while preserving fast intentional movements.
- **FeatureExtractor**: Produces a 14-field FeatureVector including fingerprint hash, thumbVsFingerDepth, and spatialZone.
- **SurgicalMatcher**: Looks up the nearest pose in the library using surgical confidence scoring (not nearest-neighbor distance).
- **TemporalSmoother**: Sliding window of 9 frames with lockThreshold=3. Prevents flickering between similar poses.
- **LinguisticBuffer**: FingerspellStrategy assembles letters into words. LexemeStrategy handles multi-letter ASL tokens.
