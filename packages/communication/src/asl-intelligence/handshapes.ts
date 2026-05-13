import type { FeatureVector } from "@sensa/shared";

export interface HandshapeDefinition {
  name: string;
  fingerprint: string;
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
    name: "S",
    fingerprint: "00000",
    disambiguate: (vector) => {
      const curl = averageFingerCurl(vector);
      return curl > 0.55 && vector.thumbToIndexDist < 1.0 ? 0.85 : 0.3;
    },
  },
  {
    name: "E",
    fingerprint: "00000",
    disambiguate: (vector) => {
      const curl = averageFingerCurl(vector);
      return curl > 0.35 && curl <= 0.55 ? 0.75 : 0.25;
    },
  },
  {
    name: "O",
    fingerprint: "00000",
    disambiguate: (vector) =>
      vector.thumbToIndexDist < 0.4 && vector.thumbToMiddleDist < 0.6 ? 0.85 : 0.1,
  },
  { name: "I", fingerprint: "00001" },
  {
    name: "F",
    fingerprint: "00111",
    disambiguate: (vector) => (vector.thumbToIndexDist < 0.5 ? 0.9 : 0.4),
  },
  {
    name: "D",
    fingerprint: "01000",
    disambiguate: (vector) => (vector.fingerCurls[1] < 0.3 ? 0.85 : 0.4),
  },
  {
    name: "X",
    fingerprint: "01000",
    disambiguate: (vector) => (vector.fingerCurls[1] >= 0.3 ? 0.8 : 0.2),
  },
  {
    name: "V",
    fingerprint: "01100",
    disambiguate: (vector) => (vector.indexMiddleSpread >= 0.5 ? 0.9 : 0.15),
  },
  {
    name: "U",
    fingerprint: "01100",
    disambiguate: (vector) => (vector.indexMiddleSpread < 0.5 ? 0.85 : 0.15),
  },
  {
    name: "R",
    fingerprint: "01100",
    disambiguate: (vector) => (vector.indexMiddleSpread < 0.25 ? 0.8 : 0.1),
  },
  {
    name: "H",
    fingerprint: "01100",
    disambiguate: () => 0.2,
  },
  { name: "W", fingerprint: "01110" },
  {
    name: "B",
    fingerprint: "01111",
    disambiguate: (vector) => (vector.indexMiddleSpread < 0.6 ? 0.9 : 0.5),
  },
  {
    name: "A",
    fingerprint: "10000",
    disambiguate: (vector) => (averageFingerCurl(vector) > 0.5 ? 0.85 : 0.4),
  },
  { name: "Y", fingerprint: "10001" },
  {
    name: "L",
    fingerprint: "11000",
    disambiguate: (vector) => (vector.thumbToIndexDist > 0.8 ? 0.9 : 0.4),
  },
  {
    name: "G",
    fingerprint: "11000",
    disambiguate: (vector) => (vector.thumbToIndexDist <= 0.8 ? 0.7 : 0.3),
  },
  {
    name: "K",
    fingerprint: "11100",
    disambiguate: (vector) => (vector.thumbToIndexDist < 0.9 ? 0.8 : 0.5),
  },
  {
    name: "C",
    fingerprint: "11111",
    disambiguate: (vector) => {
      const curl = averageFingerCurl(vector);
      return curl > 0.12 && curl < 0.5 ? 0.85 : 0.2;
    },
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
