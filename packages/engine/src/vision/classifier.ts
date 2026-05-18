import { LandmarkSmoother } from "./smoothing";
import { SensaFeatureExtractor } from "./implementations/feature-extractor";
import { SensaSurgicalMatcher } from "./implementations/surgical-matcher";
import { SensaTemporalSmoother } from "./implementations/temporal-smoother";
import { SensaGestureDetector } from "./gesture-detector";
import { SensaTransitionDetector } from "./transition-detector";
import type {
  ClassificationResult,
  ClassifierConfig,
  HandLandmarks,
  VisionPipelineConfig,
} from "./types";

export const DEFAULT_CLASSIFIER_CONFIG: ClassifierConfig = {
  windowSize: 9,
  rawScoreThreshold: 0.68,
  lockThreshold: 3,
  unlockThreshold: 3,
  motionVelocityThreshold: 0.15,
};

/**
 * The SensaSurgicalClassifier orchestrates the sign detection pipeline.
 * It follows the 'Deep Transformer' architecture, where a logic-heavy
 * orchestrator drives a sequence of pure adapters.
 */
export class SensaSurgicalClassifier {
  private config: VisionPipelineConfig;

  constructor(config?: Partial<VisionPipelineConfig>) {
    // Default surgical configuration
    const classifierConfig = DEFAULT_CLASSIFIER_CONFIG;

    this.config = {
      smoother: config?.smoother ?? new LandmarkSmoother(),
      extractor: config?.extractor ?? new SensaFeatureExtractor(),
      matcher: config?.matcher ?? new SensaSurgicalMatcher(),
      temporal: config?.temporal ?? new SensaTemporalSmoother(classifierConfig),
      gesture: config?.gesture ?? new SensaGestureDetector(),
      transition: config?.transition ?? new SensaTransitionDetector(),
      motionVelocityThreshold:
        config?.motionVelocityThreshold ?? classifierConfig.motionVelocityThreshold,
    };
  }

  /**
   * Processes a single frame of landmarks through the vision pipeline.
   */
  process(landmarks: HandLandmarks, imageLandmarks?: HandLandmarks): ClassificationResult {
    // 1. Smooth Landmarks
    const smoothed = this.config.smoother.smooth(landmarks);

    // 2. Extract Features
    const vector = this.config.extractor.extract(smoothed, imageLandmarks);

    // 3. Add motion context
    vector.velocity = this.config.smoother.getVelocity();
    const speed = Math.sqrt(
      vector.velocity.x ** 2 + vector.velocity.y ** 2 + vector.velocity.z ** 2,
    );
    vector.isMoving = speed > this.config.motionVelocityThreshold;

    // 4. Match
    const candidates = this.config.matcher.match(vector);

    // 5. Detect Transitions & Gestures
    const { sign, confidence } = this.config.temporal.smooth(candidates);
    const isTransitioning = this.config.transition.isTransitioning(vector.velocity, confidence);
    const gesture = this.config.gesture.update(vector.velocity);

    return {
      sign,
      confidence,
      vector,
      candidates: candidates.slice(0, 3),
      isTransitioning,
      gesture: gesture.type,
    };
  }

  reset(): void {
    this.config.smoother.reset();
    this.config.temporal.reset();
    this.config.gesture.reset();
    this.config.transition.reset();
  }
}
