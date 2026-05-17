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
  IFeatureExtractor,
  ISignMatcher,
  ITemporalSmoother,
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
 * It is 'surgical' because it prioritizes precision through decoupled,
 * testable components and heuristic-based rules.
 */
export class SensaSurgicalClassifier {
  private smoother = new LandmarkSmoother();
  private extractor: IFeatureExtractor;
  private matcher: ISignMatcher;
  private temporalSmoother: ITemporalSmoother;
  private gestureDetector = new SensaGestureDetector();
  private transitionDetector = new SensaTransitionDetector();
  private config: ClassifierConfig;

  constructor(config: Partial<ClassifierConfig> = {}) {
    this.config = { ...DEFAULT_CLASSIFIER_CONFIG, ...config };
    this.extractor = new SensaFeatureExtractor();
    this.matcher = new SensaSurgicalMatcher();
    this.temporalSmoother = new SensaTemporalSmoother(this.config);
  }

  /**
   * Processes a single frame of landmarks through the vision pipeline.
   *
   * Pipeline:
   * 1. Smooth Landmarks (reduce jitter)
   * 2. Extract Features (curls, angles, distances)
   * 3. Match Sign (heuristic scoring)
   * 4. Detect Transitions & Gestures
   * 5. Temporal Smoothing (consensus & hysteresis)
   */
  process(landmarks: HandLandmarks, imageLandmarks?: HandLandmarks): ClassificationResult {
    // 1. Smooth
    const smoothed = this.smoother.smooth(landmarks);

    // 2. Extract Features
    const vector = this.extractor.extract(smoothed, imageLandmarks);

    // Add motion context
    vector.velocity = this.smoother.getVelocity();
    const speed = Math.sqrt(
      vector.velocity.x ** 2 + vector.velocity.y ** 2 + vector.velocity.z ** 2,
    );
    vector.isMoving = speed > this.config.motionVelocityThreshold;

    // 3. Match
    const candidates = this.matcher.match(vector);

    // 4. Detect Transitions & Gestures
    const { sign, confidence } = this.temporalSmoother.smooth(candidates);
    const isTransitioning = this.transitionDetector.isTransitioning(vector.velocity, confidence);
    const gesture = this.gestureDetector.update(vector.velocity);

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
    this.smoother.reset();
    this.temporalSmoother.reset();
    this.gestureDetector.reset();
    this.transitionDetector.reset();
  }
}
