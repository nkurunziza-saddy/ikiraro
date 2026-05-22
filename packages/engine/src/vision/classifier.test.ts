import { describe, it, expect, beforeEach } from "vitest";
import { IkiraroSurgicalClassifier, DEFAULT_CLASSIFIER_CONFIG } from "./classifier";
import { IkiraroGestureDetector } from "./gesture-detector";
import { IkiraroSurgicalMatcher } from "./implementations/surgical-matcher";
import { IkiraroTemporalSmoother } from "./implementations/temporal-smoother";
import type { FeatureVector, HandLandmarks } from "../types";

const MOCK_LANDMARKS: HandLandmarks = Array(21).fill({ x: 0, y: 0, z: 0 });
const FEATURE_VECTOR: FeatureVector = {
  isValid: true,
  fingerStates: [true, true, true, true, false],
  fingerCurls: [0.1, 0.1, 0.1, 0.1, 0.7],
  thumbToIndexDist: 0.9,
  thumbToMiddleDist: 0.9,
  thumbToPinkyDist: 0.9,
  indexMiddleSpread: 0.2,
  ringPinkySpread: 0.2,
  palmOrientation: 0.2,
  thumbPosition: 1,
  thumbVsFingerDepth: 0,
  fingerAngles: [170, 170, 170, 170, 70],
  wristAngle: 0,
  fingerprint: "11110",
  spatialZone: "neutral",
  velocity: { x: 0, y: 0, z: 0 },
  isMoving: false,
};
describe("IkiraroSurgicalClassifier", () => {
  let classifier: IkiraroSurgicalClassifier;
  beforeEach(() => {
    classifier = new IkiraroSurgicalClassifier();
  });
  it("should initialize with default components", () => {
    expect(classifier).toBeDefined();
  });
  it("should handle empty landmarks gracefully", () => {
    const result = classifier.process([]);
    expect(result.sign).toBeNull();
    expect(result.candidates).toHaveLength(0);
  });
  it("should detect transitions when moving fast over multiple frames", () => {
    classifier.process(MOCK_LANDMARKS);
    classifier.process(MOCK_LANDMARKS);
    classifier.process(MOCK_LANDMARKS);

    let result;
    for (let i = 0; i < 4; i++) {
      const movingLandmarks = MOCK_LANDMARKS.map((l) => ({ ...l, x: l.x + 0.5 + i * 0.1 }));
      result = classifier.process(movingLandmarks);
    }
    expect(result?.isTransitioning).toBe(true);
  });
  it("should detect double-letter gestures", () => {
    classifier.process(MOCK_LANDMARKS);

    const slideX = [0.1, 0.2, 0.5, 0.2, 0.1];
    let result;
    for (const x of slideX) {
      const pos = MOCK_LANDMARKS.map((l) => ({ ...l, x: l.x + x }));
      result = classifier.process(pos);
    }

    expect(result).toBeDefined();
  });
  it("falls back to adjacent fingerprints instead of dropping near matches", () => {
    const matcher = new IkiraroSurgicalMatcher([
      {
        name: "TEST",
        fingerprint: "11111",
        disambiguate: () => 0.9,
      },
    ]);
    const candidates = matcher.match(FEATURE_VECTOR);
    expect(candidates[0]?.name).toBe("TEST");
    expect(candidates[0]?.score).toBeCloseTo(0.792);
  });
  it("rejects ambiguous top candidates before temporal locking", () => {
    const smoother = new IkiraroTemporalSmoother(DEFAULT_CLASSIFIER_CONFIG);
    for (let i = 0; i < 5; i++) {
      const result = smoother.smooth([
        { name: "A", score: 0.82 },
        { name: "S", score: 0.79 },
      ]);
      expect(result.sign).toBeNull();
      expect(result.confidence).toBe(0);
    }
  });
  it("weights temporal confidence by score magnitude", () => {
    const smoother = new IkiraroTemporalSmoother(DEFAULT_CLASSIFIER_CONFIG);
    let result = { sign: null as string | null, confidence: 0 };
    for (let i = 0; i < DEFAULT_CLASSIFIER_CONFIG.lockThreshold; i++) {
      result = smoother.smooth([{ name: "A", score: 0.9 }]);
    }
    expect(result.sign).toBe("A");
    expect(result.confidence).toBeCloseTo(0.9);
  });
  it("detects vertical double-letter bounce gestures", () => {
    const detector = new IkiraroGestureDetector();
    const velocities = [
      0.02, 0.03, 0.04, 0.08, 0.15, 0.35, 0.55, 0.7, 0.5, 0.25, 0.1, 0.05, 0.03, 0.02, 0.01,
    ];
    let result: ReturnType<IkiraroGestureDetector["update"]> = { type: "none", confidence: 0 };
    for (const y of velocities) {
      result = detector.update({ x: 0, y, z: 0 });
    }
    expect(result.type).toBe("double-letter-bounce");
    expect(result.confidence).toBeGreaterThan(0.6);
  });
});
