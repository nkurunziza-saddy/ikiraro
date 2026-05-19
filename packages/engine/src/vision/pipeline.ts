import { IkiraroSurgicalClassifier } from "./classifier";
import { LinguisticBuffer } from "./linguistic-buffer";
import type { HandLandmarks, SignToken, ClassificationResult } from "../types";
import type { BufferState, LinguisticBufferConfig, VisionPipelineConfig } from "./types";

/**
 * SignDetectionPipeline is the deep module for the landmarks → SignToken path.
 *
 * It owns the IkiraroSurgicalClassifier + LinguisticBuffer collaboration and
 * exposes a single interface: process(landmarks) → SignToken | null.
 * Callers never touch ClassificationResult or buffer internals directly.
 */
export class SignDetectionPipeline {
  private classifier: IkiraroSurgicalClassifier;
  private buffer: LinguisticBuffer;
  private _lastClassification: ClassificationResult | null = null;

  constructor(
    classifierConfig?: Partial<VisionPipelineConfig>,
    bufferConfig?: Partial<LinguisticBufferConfig>,
  ) {
    this.classifier = new IkiraroSurgicalClassifier(classifierConfig);
    this.buffer = new LinguisticBuffer(bufferConfig);
  }

  /**
   * Process a frame of hand landmarks through classify → buffer → token.
   * Returns a committed SignToken when the buffer fires, otherwise null.
   */
  process(worldLandmarks: HandLandmarks, imageLandmarks?: HandLandmarks): SignToken | null {
    this._lastClassification = this.classifier.process(worldLandmarks, imageLandmarks);
    return this.buffer.update(this._lastClassification.sign, {
      isTransitioning: this._lastClassification.isTransitioning,
      gesture: this._lastClassification.gesture,
      confidence: this._lastClassification.confidence,
    });
  }

  /**
   * Drive the buffer forward with no hand detected. Triggers a timeout commit
   * if the pause threshold has been exceeded.
   */
  tick(): SignToken | null {
    this._lastClassification = null;
    return this.buffer.update(null);
  }

  /** The ClassificationResult from the most recent process() call, or null after tick(). */
  get lastClassification(): ClassificationResult | null {
    return this._lastClassification;
  }

  /** Current buffer state — currentWord (in-progress), sentence (committed), sentenceText. */
  getBufferState(): BufferState {
    return this.buffer.getState();
  }

  /** Replace the last accumulated character in the active strategy (manual correction). */
  overrideLast(sign: string): void {
    this.buffer.overrideLast(sign);
  }

  reset(): void {
    this.classifier.reset();
    this.buffer.clear();
    this._lastClassification = null;
  }
}
