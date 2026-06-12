import { SignAllRecognizer } from "./sign-all-recognizer";
import { LinguisticBuffer } from "./linguistic-buffer";
import type { HandLandmarks, SignToken, ClassificationResult } from "../types";
import type { BufferState, LinguisticBufferConfig, SignRecognizer } from "./types";

/**
 * SignDetectionPipeline is the deep module for the landmarks → SignToken path.
 *
 * It owns the collaboration between a SignRecognizer and LinguisticBuffer and
 * exposes a single interface: process(landmarks) → SignToken | null.
 */
export class SignDetectionPipeline {
  private recognizer: SignRecognizer;
  private buffer: LinguisticBuffer;
  private _lastClassification: ClassificationResult | null = null;

  constructor(recognizer?: SignRecognizer, bufferConfig?: Partial<LinguisticBufferConfig>) {
    this.recognizer = recognizer ?? new SignAllRecognizer();
    this.buffer = new LinguisticBuffer(bufferConfig);
  }

  /**
   * Process a frame of hand landmarks through recognition → buffer → token.
   * Returns a committed SignToken when the buffer fires, otherwise null.
   */
  process(worldLandmarks: HandLandmarks, imageLandmarks?: HandLandmarks): SignToken | null {
    const result = this.recognizer.process(worldLandmarks, imageLandmarks);
    this._lastClassification = result;

    return this.buffer.update(result.sign, {
      isTransitioning: result.isTransitioning,
      confidence: result.confidence,
      velocity: result.velocity,
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
    this.recognizer.reset();
    this.buffer.clear();
    this._lastClassification = null;
  }
}
