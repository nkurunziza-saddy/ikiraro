import { extractFeatureVector } from "../feature-vector";
import type { HandLandmarks, FeatureVector, IFeatureExtractor } from "../../types";

/**
 * Standard implementation of the Feature Extractor.
 * It encapsulates the logic for turning raw landmarks into a high-leverage
 * feature vector used by matchers.
 */
export class SensaFeatureExtractor implements IFeatureExtractor {
  extract(landmarks: HandLandmarks, imageLandmarks?: HandLandmarks): FeatureVector {
    return extractFeatureVector(landmarks, imageLandmarks);
  }
}
