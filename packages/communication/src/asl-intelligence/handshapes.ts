import type { FeatureVector } from "@sensa/shared";

export interface HandshapeDefinition {
  name: string;
  fingerprint: string;
  requiresMotion?: boolean;
  disambiguate?: (vector: FeatureVector) => number;
}

function averageFingerCurl(vector: FeatureVector): number {
  return (
    (vector.fingerCurls[1] +
      vector.fingerCurls[2] +
      vector.fingerCurls[3] +
      vector.fingerCurls[4]) /
    4
  );
}

export const ASL_ALPHABET: HandshapeDefinition[] = [
  {
    name: "A",
    fingerprint: "10000",
    disambiguate: (vector) => (averageFingerCurl(vector) > 0.5 ? 0.9 : 0.4),
  },
  {
    name: "B",
    fingerprint: "01111",
    disambiguate: (vector) => (vector.indexMiddleSpread < 0.6 ? 0.95 : 0.5),
  },
  {
    name: "C",
    fingerprint: "11111",
    disambiguate: (vector) => {
      const curl = averageFingerCurl(vector);
      return curl > 0.12 && curl < 0.5 ? 0.9 : 0.2;
    },
  },
  {
    name: "D",
    fingerprint: "01000",
    disambiguate: (vector) => (vector.fingerCurls[1] < 0.3 ? 0.9 : 0.4),
  },
  {
    name: "E",
    fingerprint: "00000",
    disambiguate: (vector) => {
      const curl = averageFingerCurl(vector);
      return curl > 0.35 && curl <= 0.55 ? 0.85 : 0.25;
    },
  },
  {
    name: "F",
    fingerprint: "00111",
    disambiguate: (vector) => (vector.thumbToIndexDist < 0.5 ? 0.95 : 0.4),
  },
  {
    name: "G",
    fingerprint: "11000",
    disambiguate: (vector) =>
      vector.thumbToIndexDist <= 0.8 && vector.palmOrientation > 0.4 ? 0.85 : 0.2,
  },
  {
    name: "H",
    fingerprint: "01100",
    disambiguate: (vector) =>
      vector.palmOrientation > 0.4 && vector.indexMiddleSpread < 0.4 ? 0.85 : 0.2,
  },
  {
    name: "I",
    fingerprint: "00001",
    disambiguate: (vector) => (vector.thumbToPinkyDist > 0.5 ? 0.9 : 0.3),
  },
  {
    name: "J",
    fingerprint: "00001",
    requiresMotion: true,
    disambiguate: (vector) => (vector.thumbToPinkyDist > 0.5 ? 0.7 : 0.1),
  },
  {
    name: "K",
    fingerprint: "11100",
    disambiguate: (vector) =>
      vector.thumbToIndexDist < 0.9 && vector.palmOrientation < 0.5 ? 0.9 : 0.4,
  },
  {
    name: "L",
    fingerprint: "11000",
    disambiguate: (vector) => (vector.thumbToIndexDist > 0.8 ? 0.95 : 0.3),
  },
  {
    name: "M",
    fingerprint: "00000",
    disambiguate: (vector) =>
      vector.palmOrientation > 0.5 && averageFingerCurl(vector) > 0.6 ? 0.8 : 0.2,
  },
  {
    name: "N",
    fingerprint: "00000",
    disambiguate: (vector) =>
      vector.palmOrientation > 0.5 && averageFingerCurl(vector) > 0.4 ? 0.75 : 0.2,
  },
  {
    name: "O",
    fingerprint: "00000",
    disambiguate: (vector) =>
      vector.thumbToIndexDist < 0.4 && vector.thumbToMiddleDist < 0.4 ? 0.9 : 0.1,
  },
  {
    name: "P",
    fingerprint: "11100",
    disambiguate: (vector) =>
      vector.palmOrientation > 0.5 && vector.thumbToIndexDist < 0.9 ? 0.85 : 0.2,
  },
  {
    name: "Q",
    fingerprint: "11000",
    disambiguate: (vector) =>
      vector.palmOrientation > 0.5 && vector.thumbToIndexDist <= 0.8 ? 0.85 : 0.2,
  },
  {
    name: "R",
    fingerprint: "01100",
    disambiguate: (vector) => (vector.indexMiddleSpread < 0.15 ? 0.9 : 0.1),
  },
  {
    name: "S",
    fingerprint: "00000",
    disambiguate: (vector) => {
      const curl = averageFingerCurl(vector);
      return curl > 0.55 && vector.thumbPosition === 1 ? 0.9 : 0.3;
    },
  },
  {
    name: "T",
    fingerprint: "10000",
    disambiguate: (vector) =>
      averageFingerCurl(vector) > 0.5 && vector.thumbPosition === 0 ? 0.8 : 0.2,
  },
  {
    name: "U",
    fingerprint: "01100",
    disambiguate: (vector) => (vector.indexMiddleSpread < 0.5 ? 0.85 : 0.2),
  },
  {
    name: "V",
    fingerprint: "01100",
    disambiguate: (vector) => (vector.indexMiddleSpread >= 0.5 ? 0.9 : 0.2),
  },
  {
    name: "W",
    fingerprint: "01110",
    disambiguate: (vector) => (vector.ringPinkySpread > 0.5 ? 0.9 : 0.3),
  },
  {
    name: "X",
    fingerprint: "01000",
    disambiguate: (vector) => (vector.fingerCurls[1] >= 0.3 ? 0.85 : 0.2),
  },
  {
    name: "Y",
    fingerprint: "10001",
    disambiguate: (vector) => (vector.thumbToPinkyDist > 1.0 ? 0.95 : 0.4),
  },
  {
    name: "Z",
    fingerprint: "01000",
    requiresMotion: true,
    disambiguate: (vector) => (vector.fingerCurls[1] < 0.3 ? 0.7 : 0.1),
  },
];

export function matchHandshape(
  vector: FeatureVector,
  definitions: HandshapeDefinition[],
): {
  name: string;
  score: number;
  candidates: Array<{
    name: string;
    score: number;
  }>;
} | null {
  const candidates: Array<{ name: string; score: number }> = [];

  for (const definition of definitions) {
    if (definition.fingerprint !== vector.fingerprint) {
      continue;
    }

    const score = definition.disambiguate ? definition.disambiguate(vector) : 0.7;
    candidates.push({
      name: definition.name,
      score,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => right.score - left.score);
  return {
    name: candidates[0]!.name,
    score: candidates[0]!.score,
    candidates: candidates.slice(0, 3),
  };
}
