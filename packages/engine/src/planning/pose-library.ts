/**
 * Pose types and library for sign language visualization.
 * These types define the joint angles for a 3D hand model.
 */

export type FingerAngles = {
  mcp: number;
  pip: number;
  dip: number;
  splay: number;
};

export type ThumbAngles = {
  splay: number;
  flex: number;
  curl: number;
};

export type Handshape = {
  index: FingerAngles;
  middle: FingerAngles;
  ring: FingerAngles;
  pinky: FingerAngles;
  thumb: ThumbAngles;
};

const f = (mcp: number, pip: number, dip: number, splay = 0): FingerAngles => ({
  mcp,
  pip,
  dip,
  splay,
});

const t = (splay: number, flex: number, curl: number): ThumbAngles => ({
  splay,
  flex,
  curl,
});

const CURL = f(1.5, 1.3, 0.7);
const OPEN = f(0.06, 0.04, 0.03); // fingers never lock perfectly straight

export const ASL_HAND_POSES: Record<string, Handshape> = {
  A: { index: CURL, middle: CURL, ring: CURL, pinky: CURL, thumb: t(-0.25, 0.15, 0.1) },
  B: {
    index: f(0.04, 0.03, 0.03, -0.05),
    middle: OPEN,
    ring: OPEN,
    pinky: f(0.04, 0.03, 0.03, 0.05),
    thumb: t(0.55, 1.15, 0.25),
  },
  C: {
    index: f(0.6, 0.55, 0.3),
    middle: f(0.6, 0.55, 0.3),
    ring: f(0.6, 0.55, 0.3),
    pinky: f(0.55, 0.5, 0.28),
    thumb: t(-0.45, 0.35, 0.3),
  },
  D: {
    index: OPEN,
    middle: f(1.35, 1.15, 0.55),
    ring: f(1.35, 1.15, 0.55),
    pinky: f(1.35, 1.15, 0.55),
    thumb: t(0.1, 0.4, 0.85),
  },
  E: {
    index: f(1.1, 0.9, 0.1),
    middle: f(1.1, 0.9, 0.1),
    ring: f(1.1, 0.9, 0.1),
    pinky: f(1.05, 0.85, 0.1),
    thumb: t(0.2, 0.85, 0.35),
  },
  F: {
    index: f(1.25, 1.05, 0.55),
    middle: f(0.06, 0.04, 0.03, 0.08),
    ring: OPEN,
    pinky: f(0.06, 0.04, 0.03, -0.05),
    thumb: t(-0.25, 0.25, 0.85),
  },
  G: {
    index: f(0.06, 0.04, 0.03, -0.22),
    middle: CURL,
    ring: CURL,
    pinky: CURL,
    thumb: t(-0.55, 0.08, 0.12),
  },
  H: {
    index: f(0.06, 0.04, 0.03, 0.05),
    middle: f(0.06, 0.04, 0.03, -0.05),
    ring: CURL,
    pinky: CURL,
    thumb: t(0.28, 0.85, 0.3),
  },
  I: { index: CURL, middle: CURL, ring: CURL, pinky: OPEN, thumb: t(-0.2, 0.4, 0.28) },
  J: { index: CURL, middle: CURL, ring: CURL, pinky: OPEN, thumb: t(-0.2, 0.4, 0.28) },
  K: {
    index: OPEN,
    middle: f(0.5, 0.05, 0.04),
    ring: CURL,
    pinky: CURL,
    thumb: t(-0.45, 0.3, 0.32),
  },
  L: { index: OPEN, middle: CURL, ring: CURL, pinky: CURL, thumb: t(-0.85, 0.08, 0.08) },
  M: { index: CURL, middle: CURL, ring: CURL, pinky: CURL, thumb: t(0.1, 1.0, 0.4) },
  N: { index: CURL, middle: CURL, ring: CURL, pinky: CURL, thumb: t(0.15, 0.85, 0.38) },
  O: {
    index: f(0.85, 0.75, 0.45),
    middle: f(0.85, 0.75, 0.45),
    ring: f(0.85, 0.75, 0.45),
    pinky: f(0.8, 0.7, 0.4),
    thumb: t(-0.3, 0.35, 0.75),
  },
  P: {
    index: OPEN,
    middle: f(0.5, 0.05, 0.04),
    ring: CURL,
    pinky: CURL,
    thumb: t(-0.45, 0.35, 0.32),
  },
  Q: {
    index: f(0.06, 0.04, 0.03, -0.22),
    middle: CURL,
    ring: CURL,
    pinky: CURL,
    thumb: t(-0.55, 0.12, 0.18),
  },
  R: {
    index: f(0.06, 0.04, 0.03, 0.1),
    middle: f(0.06, 0.04, 0.03, -0.08),
    ring: CURL,
    pinky: CURL,
    thumb: t(0.28, 0.85, 0.28),
  },
  S: { index: CURL, middle: CURL, ring: CURL, pinky: CURL, thumb: t(-0.05, 0.85, 0.45) },
  T: { index: CURL, middle: CURL, ring: CURL, pinky: CURL, thumb: t(0.12, 0.5, 0.5) },
  U: {
    index: f(0.06, 0.04, 0.03, 0.06),
    middle: f(0.06, 0.04, 0.03, -0.06),
    ring: CURL,
    pinky: CURL,
    thumb: t(0.28, 0.85, 0.28),
  },
  V: {
    index: f(0.06, 0.04, 0.03, -0.2),
    middle: f(0.06, 0.04, 0.03, 0.2),
    ring: CURL,
    pinky: CURL,
    thumb: t(0.28, 0.85, 0.28),
  },
  W: {
    index: f(0.06, 0.04, 0.03, -0.22),
    middle: OPEN,
    ring: f(0.06, 0.04, 0.03, 0.22),
    pinky: CURL,
    thumb: t(0.28, 0.85, 0.28),
  },
  X: {
    index: f(1.25, 0.85, 0.15),
    middle: CURL,
    ring: CURL,
    pinky: CURL,
    thumb: t(-0.2, 0.4, 0.3),
  },
  Y: {
    index: CURL,
    middle: CURL,
    ring: CURL,
    pinky: f(0.06, 0.04, 0.03, 0.2),
    thumb: t(-0.75, 0.08, 0.08),
  },
  Z: { index: OPEN, middle: CURL, ring: CURL, pinky: CURL, thumb: t(-0.2, 0.65, 0.28) },
  "0": {
    index: f(0.85, 0.75, 0.45),
    middle: f(0.85, 0.75, 0.45),
    ring: f(0.85, 0.75, 0.45),
    pinky: f(0.8, 0.7, 0.4),
    thumb: t(-0.3, 0.35, 0.75),
  },
  "1": { index: OPEN, middle: CURL, ring: CURL, pinky: CURL, thumb: t(-0.2, 0.65, 0.28) },
  "2": {
    index: f(0.06, 0.04, 0.03, -0.2),
    middle: f(0.06, 0.04, 0.03, 0.2),
    ring: CURL,
    pinky: CURL,
    thumb: t(0.28, 0.85, 0.28),
  },
  "3": {
    index: f(0.06, 0.04, 0.03, -0.22),
    middle: OPEN,
    ring: f(0.06, 0.04, 0.03, 0.22),
    pinky: CURL,
    thumb: t(-0.45, 0.08, 0.08),
  },
  "4": {
    index: f(0.04, 0.03, 0.03, -0.05),
    middle: OPEN,
    ring: OPEN,
    pinky: f(0.04, 0.03, 0.03, 0.05),
    thumb: t(0.55, 1.15, 0.25),
  },
  "5": {
    index: f(0.06, 0.04, 0.03, -0.15),
    middle: f(0.06, 0.04, 0.03, -0.05),
    ring: f(0.06, 0.04, 0.03, 0.05),
    pinky: f(0.06, 0.04, 0.03, 0.15),
    thumb: t(-0.55, 0.08, 0.08),
  },
  "/": { index: CURL, middle: CURL, ring: CURL, pinky: CURL, thumb: t(-0.05, 0.85, 0.45) },
};

export const REST_POSE: Handshape = {
  // Relaxed neutral. Fingers carry a natural slight curl — never dead straight.
  index: f(0.16, 0.1, 0.06),
  middle: f(0.16, 0.1, 0.06),
  ring: f(0.18, 0.12, 0.07),
  pinky: f(0.2, 0.13, 0.08),
  thumb: t(-0.35, 0.15, 0.1),
};

/**
 * Resolves a key (letter, number, or special char) to a Handshape.
 */
export function resolveHandshape(key: string): Handshape {
  return ASL_HAND_POSES[key.toUpperCase()] ?? ASL_HAND_POSES[key] ?? REST_POSE;
}

/**
 * Mixes two handshapes by a factor (0 to 1).
 */
export function mixHandshapes(a: Handshape, b: Handshape, factor: number): Handshape {
  if (factor <= 0) return a;
  if (factor >= 1) return b;

  const mix = (x: number, y: number) => x + (y - x) * factor;

  const mixFinger = (f1: FingerAngles, f2: FingerAngles): FingerAngles => ({
    mcp: mix(f1.mcp, f2.mcp),
    pip: mix(f1.pip, f2.pip),
    dip: mix(f1.dip, f2.dip),
    splay: mix(f1.splay, f2.splay),
  });

  const mixThumb = (t1: ThumbAngles, t2: ThumbAngles): ThumbAngles => ({
    splay: mix(t1.splay, t2.splay),
    flex: mix(t1.flex, t2.flex),
    curl: mix(t1.curl, t2.curl),
  });

  return {
    index: mixFinger(a.index, b.index),
    middle: mixFinger(a.middle, b.middle),
    ring: mixFinger(a.ring, b.ring),
    pinky: mixFinger(a.pinky, b.pinky),
    thumb: mixThumb(a.thumb, b.thumb),
  };
}
