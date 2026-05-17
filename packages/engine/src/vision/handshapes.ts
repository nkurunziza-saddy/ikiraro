import type { FeatureVector } from "./types";
import type { HandshapeDefinition } from "./types";

function avgCurl(v: FeatureVector): number {
  return (v.fingerCurls[1] + v.fingerCurls[2] + v.fingerCurls[3] + v.fingerCurls[4]) / 4;
}

export const ASL_ALPHABET: HandshapeDefinition[] = [
  { name: "A", fingerprint: "10000", disambiguate: (v) => (avgCurl(v) > 0.5 ? 0.9 : 0.4) },
  {
    name: "B",
    fingerprint: "01111",
    disambiguate: (v) => (v.indexMiddleSpread < 0.6 ? 0.95 : 0.5),
  },
  {
    name: "C",
    fingerprint: "11111",
    disambiguate: (v) => {
      const c = avgCurl(v);
      return c > 0.12 && c < 0.5 ? 0.9 : 0.2;
    },
  },
  { name: "D", fingerprint: "01000", disambiguate: (v) => (v.fingerCurls[1] < 0.3 ? 0.9 : 0.4) },
  {
    name: "E",
    fingerprint: "00000",
    disambiguate: (v) => {
      const c = avgCurl(v);
      return c > 0.35 && c <= 0.55 ? 0.85 : 0.25;
    },
  },
  { name: "F", fingerprint: "00111", disambiguate: (v) => (v.thumbToIndexDist < 0.5 ? 0.95 : 0.4) },
  {
    name: "G",
    fingerprint: "11000",
    disambiguate: (v) => (v.thumbToIndexDist <= 0.8 && v.palmOrientation > 0.4 ? 0.85 : 0.2),
  },
  {
    name: "H",
    fingerprint: "01100",
    disambiguate: (v) => (v.palmOrientation > 0.4 && v.indexMiddleSpread < 0.4 ? 0.85 : 0.2),
  },
  { name: "I", fingerprint: "00001", disambiguate: (v) => (v.thumbToPinkyDist > 0.5 ? 0.9 : 0.3) },
  {
    name: "J",
    fingerprint: "00001",
    requiresMotion: true,
    disambiguate: (v) => (v.thumbToPinkyDist > 0.5 ? 0.7 : 0.1),
  },
  {
    name: "K",
    fingerprint: "11100",
    disambiguate: (v) => (v.thumbToIndexDist < 0.9 && v.palmOrientation < 0.5 ? 0.9 : 0.4),
  },
  { name: "L", fingerprint: "11000", disambiguate: (v) => (v.thumbToIndexDist > 0.8 ? 0.95 : 0.3) },
  {
    name: "M",
    fingerprint: "00000",
    disambiguate: (v) => (v.palmOrientation > 0.5 && avgCurl(v) > 0.6 ? 0.8 : 0.2),
  },
  {
    name: "N",
    fingerprint: "00000",
    disambiguate: (v) => (v.palmOrientation > 0.5 && avgCurl(v) > 0.4 ? 0.75 : 0.2),
  },
  {
    name: "O",
    fingerprint: "00000",
    disambiguate: (v) => (v.thumbToIndexDist < 0.4 && v.thumbToMiddleDist < 0.4 ? 0.9 : 0.1),
  },
  {
    name: "P",
    fingerprint: "11100",
    disambiguate: (v) => (v.palmOrientation > 0.5 && v.thumbToIndexDist < 0.9 ? 0.85 : 0.2),
  },
  {
    name: "Q",
    fingerprint: "11000",
    disambiguate: (v) => (v.palmOrientation > 0.5 && v.thumbToIndexDist <= 0.8 ? 0.85 : 0.2),
  },
  {
    name: "R",
    fingerprint: "01100",
    disambiguate: (v) => (v.indexMiddleSpread < 0.15 ? 0.9 : 0.1),
  },
  {
    name: "S",
    fingerprint: "00000",
    disambiguate: (v) => (avgCurl(v) > 0.55 && v.thumbPosition === 1 ? 0.9 : 0.3),
  },
  {
    name: "T",
    fingerprint: "10000",
    disambiguate: (v) => (avgCurl(v) > 0.5 && v.thumbPosition === 0 ? 0.8 : 0.2),
  },
  {
    name: "U",
    fingerprint: "01100",
    disambiguate: (v) => (v.indexMiddleSpread < 0.5 ? 0.85 : 0.2),
  },
  {
    name: "V",
    fingerprint: "01100",
    disambiguate: (v) => (v.indexMiddleSpread >= 0.5 ? 0.9 : 0.2),
  },
  { name: "W", fingerprint: "01110", disambiguate: (v) => (v.ringPinkySpread > 0.5 ? 0.9 : 0.3) },
  { name: "X", fingerprint: "01000", disambiguate: (v) => (v.fingerCurls[1] >= 0.3 ? 0.85 : 0.2) },
  { name: "Y", fingerprint: "10001", disambiguate: (v) => (v.thumbToPinkyDist > 1.0 ? 0.95 : 0.4) },
  {
    name: "Z",
    fingerprint: "01000",
    requiresMotion: true,
    disambiguate: (v) => (v.fingerCurls[1] < 0.3 ? 0.7 : 0.1),
  },
];
