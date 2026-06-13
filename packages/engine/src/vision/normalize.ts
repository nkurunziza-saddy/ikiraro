import type { HandLandmarks } from "./types";

/**
 * Canonical hand-landmark normalization shared by the recognizer, the template
 * builder and offline evaluation. Translation: wrist at origin. Scale: palm
 * length (wrist→middle-MCP) = 1 — unlike max-landmark distance, palm length is
 * the same for a fist and an open hand, so handshape isn't distorted by its
 * own scale factor. Rotation: wrist→middle-MCP aligned to +Y (in-plane).
 *
 * NOTE: this removes position/scale/roll but NOT chirality — a mirrored hand
 * stays mirrored. Callers that need mirror-invariance score both the input and
 * its mirrorX() copy.
 */
export function normalizeHand(landmarks: HandLandmarks): HandLandmarks {
  const wrist = landmarks[0]!;
  const middleBase = landmarks[9]!;

  const centered = landmarks.map((p) => ({
    x: p.x - wrist.x,
    y: p.y - wrist.y,
    z: p.z - wrist.z,
  }));

  const alignX = middleBase.x - wrist.x;
  const alignY = middleBase.y - wrist.y;
  const alignZ = middleBase.z - wrist.z;
  const palm = Math.max(Math.sqrt(alignX ** 2 + alignY ** 2 + alignZ ** 2), 0.0001);
  const angle = Math.atan2(alignY, alignX);
  const cos = Math.cos(-angle + Math.PI / 2);
  const sin = Math.sin(-angle + Math.PI / 2);

  return centered.map((p) => ({
    x: (p.x * cos - p.y * sin) / palm,
    y: (p.x * sin + p.y * cos) / palm,
    z: p.z / palm,
  }));
}

/** Mirror a normalized hand across the alignment axis. */
export function mirrorX(landmarks: HandLandmarks): HandLandmarks {
  return landmarks.map((p) => ({ x: -p.x, y: p.y, z: p.z }));
}

/**
 * Flip a normalized hand into canonical chirality (thumb chain on -X).
 * Used at template-build time so all templates share one handedness.
 */
export function canonicalizeChirality(normalized: HandLandmarks): HandLandmarks {
  let thumbX = 0;
  for (let i = 1; i <= 4; i++) thumbX += normalized[i]?.x;
  return thumbX > 0 ? mirrorX(normalized) : normalized;
}
