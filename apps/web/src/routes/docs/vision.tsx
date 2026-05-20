import { createFileRoute } from "@tanstack/react-router";
import {
  CodeBlock,
  PageTitle,
  SectionHead,
  RefTable,
  RefTableHead,
  RefRow,
  Callout,
} from "@/components/docs/primitives";

export const Route = createFileRoute("/docs/vision")({
  component: VisionPage,
});

const SNIPPET_BASIC = `import { useHandTracking } from "@ikiraro/sdk";

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
}`;

const SNIPPET_USE_IN_DEMO = `// Typical pattern: camera panel feeds into text translate
const camera = useHandTracking();
const { translate } = useIkiraro({ sdk: { groqApiKey: "..." } });

// When the user confirms the detected sentence:
function commitSentence() {
  const text = camera.tracking.sentenceText;
  if (text) {
    translate(text);  // send to LLM → avatar
    camera.clear();   // reset linguistic buffer
  }
}`;

const SNIPPET_PIPELINE = `// 6-stage surgical vision pipeline (happens inside the worker):
//
// Frame
//   → MediaPipe (GPU/CPU, numHands: 1)
//   → Geometry gating (5 conditions — rejects invalid frames early)
//   → LandmarkSmoother (1€ filter per joint)
//   → FeatureExtractor (14-field FeatureVector incl. fingerprint, spatialZone)
//   → SurgicalMatcher (pose library lookup with surgical confidence scoring)
//   → TemporalSmoother (window=9, lockThreshold=3)
//   → LinguisticBuffer (FingerspellStrategy + LexemeStrategy)
//   → CameraTrackingState`;

function VisionPage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="useHandTracking"
        subtitle="A separate hook that boots a MediaPipe Web Worker and drives a 6-stage surgical classifier. The worker initializes on mount and tears down on unmount. No connection to the main Ikiraro runtime — integrate by passing tracking.sentenceText to translate()."
      />

      {/* Basic usage */}
      <section className="space-y-4">
        <SectionHead id="usage" label="Usage" />
        <CodeBlock code={SNIPPET_BASIC} label="useHandTracking" />

        <Callout>
          <strong className="text-foreground">Video ref rule:</strong> Always attach{" "}
          <code className="font-mono text-foreground">videoRef</code> directly to the{" "}
          <code className="font-mono text-foreground">&lt;video&gt;</code> element — no wrapper div.
          On Linux, <code className="font-mono text-foreground">overflow-hidden</code> on a parent
          clips the CSS transform; apply{" "}
          <code className="font-mono text-foreground">scale-x-[-1]</code> directly on the video
          element to mirror correctly.
        </Callout>
      </section>

      {/* Returns */}
      <section className="space-y-4">
        <SectionHead id="returns" label="Returns" />
        <RefTable>
          <RefTableHead cols={["Field", "Type", "Description"]} />
          <RefRow
            name="videoRef"
            type="(el) => void"
            desc="Callback ref — attach directly to a <video> element."
          />
          <RefRow
            name="tracking"
            type="CameraTrackingState"
            desc="Reactive tracking state. Updates inside startTransition."
          />
          <RefRow
            name="isReady"
            type="boolean"
            desc="True once the MediaPipe worker is fully booted."
          />
          <RefRow
            name="delegate"
            type='"GPU" | "CPU" | null'
            desc="Active MediaPipe compute backend."
          />
          <RefRow name="fps" type="number" desc="Current processing frame rate." />
          <RefRow
            name="isActive"
            type="boolean"
            desc="True when the camera stream is actively processing."
          />
          <RefRow name="error" type="string | null" desc="Worker or camera error message." />
          <RefRow
            name="start"
            type="async () => void"
            desc="Start the camera. Must be called after the videoRef element is mounted."
          />
          <RefRow
            name="stop"
            type="() => void"
            desc="Stop the camera stream and pause processing."
          />
          <RefRow
            name="clear"
            type="() => void"
            desc="Reset the linguistic buffer and sentence state."
          />
          <RefRow
            name="manualCorrect"
            type="(sign: string) => void"
            desc="Override the classifier's last detected sign. Useful for training and correction UIs."
          />
        </RefTable>
      </section>

      {/* CameraTrackingState */}
      <section className="space-y-4">
        <SectionHead id="tracking-state" label="CameraTrackingState" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The <code className="font-mono text-foreground">tracking</code> object reflects the
          linguistic buffer state built up across frames. Read{" "}
          <code className="font-mono text-foreground">sentenceText</code> when the user signals
          they're done signing, and pass it to{" "}
          <code className="font-mono text-foreground">translate()</code>.
        </p>
        <RefTable>
          <RefTableHead cols={["Field", "Type", "Description"]} />
          <RefRow
            name="landmarks"
            type="Landmark[]"
            desc="Raw MediaPipe hand landmarks for the current frame."
          />
          <RefRow
            name="classification"
            type="string | null"
            desc="Classifier's current best-match ASL sign code."
          />
          <RefRow
            name="currentWord"
            type="string"
            desc="Word being assembled from individual letter classifications."
          />
          <RefRow name="sentence" type="string[]" desc="Completed words since the last clear()." />
          <RefRow
            name="sentenceText"
            type="string"
            desc="sentence joined with spaces — ready to pass to translate()."
          />
          <RefRow
            name="committedToken"
            type="string | null"
            desc="Most recently committed letter token."
          />
        </RefTable>
      </section>

      {/* Integration with runtime */}
      <section className="space-y-4">
        <SectionHead id="integration" label="Integrating with useIkiraro" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          <code className="font-mono text-foreground">useHandTracking</code> and{" "}
          <code className="font-mono text-foreground">useIkiraro</code> are independent hooks.
          Bridge them by passing detected text to{" "}
          <code className="font-mono text-foreground">translate()</code> when the user confirms.
        </p>
        <CodeBlock code={SNIPPET_USE_IN_DEMO} label="integration pattern" />
      </section>

      {/* Pipeline internals */}
      <section className="space-y-4">
        <SectionHead id="pipeline" label="Pipeline internals" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The classifier runs entirely in a dedicated Web Worker. Each video frame flows through six
          stages before updating{" "}
          <code className="font-mono text-foreground">CameraTrackingState</code>:
        </p>
        <CodeBlock code={SNIPPET_PIPELINE} label="vision pipeline" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              stage: "Geometry gating",
              desc: "Rejects low-confidence frames early using 5 geometric conditions. Prevents noisy frames from polluting the classifier.",
            },
            {
              stage: "LandmarkSmoother",
              desc: "1€ filter applied per joint. Removes high-frequency jitter while preserving fast intentional movements.",
            },
            {
              stage: "FeatureExtractor",
              desc: "Produces a 14-field FeatureVector including fingerprint hash, thumbVsFingerDepth, and spatialZone.",
            },
            {
              stage: "SurgicalMatcher",
              desc: "Looks up the nearest pose in the library using surgical confidence scoring (not nearest-neighbor distance).",
            },
            {
              stage: "TemporalSmoother",
              desc: "Sliding window of 9 frames with lockThreshold=3. Prevents flickering between similar poses.",
            },
            {
              stage: "LinguisticBuffer",
              desc: "FingerspellStrategy assembles letters into words. LexemeStrategy handles multi-letter ASL tokens.",
            },
          ].map(({ stage, desc }) => (
            <div key={stage} className="border border-border rounded p-3 space-y-1">
              <p className="text-foreground text-[12px] font-semibold">{stage}</p>
              <p className="text-muted-foreground text-[12px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
