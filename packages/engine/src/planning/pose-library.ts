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

import { LanguageRegistry } from "../language-registry";
import aslHandshapes from "./handshapes/asl.json";

export const ASL_HAND_POSES: Record<string, Handshape> = aslHandshapes as Record<string, Handshape>;

export const REST_POSE: Handshape = {
  index: { mcp: 0.16, pip: 0.1, dip: 0.06, splay: 0 },
  middle: { mcp: 0.16, pip: 0.1, dip: 0.06, splay: 0 },
  ring: { mcp: 0.18, pip: 0.12, dip: 0.07, splay: 0 },
  pinky: { mcp: 0.2, pip: 0.13, dip: 0.08, splay: 0 },
  thumb: { splay: -0.35, flex: 0.15, curl: 0.1 },
};

/**
 * Resolves a key (letter, number, or special char) to a Handshape.
 */
export function resolveHandshape(key: string): Handshape {
  const lang = LanguageRegistry.getActive();
  const shape = lang.getHandshape(key);
  if (shape) return shape;

  return REST_POSE;
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
