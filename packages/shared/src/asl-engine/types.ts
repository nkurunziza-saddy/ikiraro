export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type HandLandmarks = Point3D[];

export interface FeatureVector {
  fingerStates: [boolean, boolean, boolean, boolean, boolean];
  fingerCurls: [number, number, number, number, number];
  thumbToIndexDist: number;
  thumbToMiddleDist: number;
  indexMiddleSpread: number;
  fingerprint: string;
}

export interface ClassificationResult {
  sign: string | null;
  confidence: number;
  vector: FeatureVector;
  candidates: Array<{
    name: string;
    score: number;
  }>;
}
