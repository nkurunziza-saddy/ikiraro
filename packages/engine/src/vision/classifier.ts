import { LandmarkSmoother } from "./smoothing";
import { IkiraroFeatureExtractor } from "./implementations/feature-extractor";
import { IkiraroSurgicalMatcher } from "./implementations/surgical-matcher";
import { IkiraroTemporalSmoother } from "./implementations/temporal-smoother";
import { IkiraroGestureDetector } from "./gesture-detector";
import { IkiraroTransitionDetector } from "./transition-detector";
import type {
  ClassificationResult,
  ClassifierConfig,
  HandLandmarks,
  VisionPipelineConfig,
} from "./types";

export const DEFAULT_CLASSIFIER_CONFIG: ClassifierConfig = {
  windowSize: 9,
  rawScoreThreshold: 0.68,
  minCandidateScore: 0.55,
  scoreGapThreshold: 0.05,
  lockThreshold: 3,
  unlockThreshold: 3,
  motionVelocityThreshold: 0.15,
};

/**
 * The IkiraroSurgicalClassifier orchestrates the sign detection pipeline.
 * It follows the 'Deep Transformer' architecture, where a logic-heavy
 * orchestrator drives a sequence of pure adapters.
 */
export class IkiraroSurgicalClassifier {
  private config: VisionPipelineConfig;
  private smoothedSpeed = 0;
  private isMotionActive = false;
  private hasMotionSample = false;

  constructor(config?: Partial<VisionPipelineConfig>) {
    // Default surgical configuration
    const classifierConfig = DEFAULT_CLASSIFIER_CONFIG;

    this.config = {
      smoother: config?.smoother ?? new LandmarkSmoother(),
      extractor: config?.extractor ?? new IkiraroFeatureExtractor(),
      matcher: config?.matcher ?? new IkiraroSurgicalMatcher(),
      temporal: config?.temporal ?? new IkiraroTemporalSmoother(classifierConfig),
      gesture: config?.gesture ?? new IkiraroGestureDetector(),
      transition: config?.transition ?? new IkiraroTransitionDetector(),
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
    vector.isMoving = this.updateMotionState(speed);

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
    this.smoothedSpeed = 0;
    this.isMotionActive = false;
    this.hasMotionSample = false;
  }

  private updateMotionState(speed: number): boolean {
    this.smoothedSpeed = this.hasMotionSample ? this.smoothedSpeed * 0.65 + speed * 0.35 : speed;
    this.hasMotionSample = true;

    const onThreshold = this.config.motionVelocityThreshold;
    const offThreshold = onThreshold * 0.65;
    this.isMotionActive = this.isMotionActive
      ? this.smoothedSpeed > offThreshold
      : this.smoothedSpeed > onThreshold;

    return this.isMotionActive;
  }
}
