/**
 * Builds src/signing/letters.ts from the sid220/asl-now-fingerspelling dataset
 * (MIT): https://huggingface.co/datasets/sid220/asl-now-fingerspelling
 *
 *   git clone --depth 1 https://huggingface.co/datasets/sid220/asl-now-fingerspelling train_landmarks/aslnow
 *   node scripts/build-letters.ts train_landmarks/aslnow
 *
 * Each sample is 21 MediaPipe image landmarks. Their x and y are trustworthy;
 * their depth is compressed (a fist comes out nearly flat). Bones are rigid,
 * though, so foreshortening says how much depth a bone can have: one that
 * looks shorter than it is must be pointing towards or away from the camera.
 * That estimate is sharp for a bone seen end-on and useless for one lying
 * nearly flat, where MediaPipe's own depth, scaled back up, does better. Each
 * bone blends the two by how foreshortened it is.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BONE_COUNT, BONE_LENGTHS, boneStart, fromJoints } from "../src/signing/hand.ts";
import type { Handshape } from "../src/signing/hand.ts";
import { add, clamp, cross, dot, normalize, scale, sub } from "../src/signing/math.ts";
import type { V3 } from "../src/signing/math.ts";

/**
 * Letters signed upright with the palm towards the camera, which is the pose
 * the reconstruction below is valid for. G, H, P and Q are signed edge-on and
 * J and Z are movements; those six are composed by hand in alphabet.ts.
 */
const MEASURED = "ABCDEFIKLMNORSTUVWXY";
/** Landmarks are normalised by image width and height; webcams are 4:3. */
const ASPECT = 4 / 3;
/** Share of samples, nearest the median, that are averaged into a letter. */
const KEEP = 0.4;
const KNUCKLE_BONES = [4, 8, 12, 16];
/**
 * How much MediaPipe understates depth. On bones foreshortened to under half
 * their length, where foreshortening is reliable, the median ratio is 1.7.
 */
const DEPTH_GAIN = 2;
/** Apparent length, as a share of true length, between which trust shifts to foreshortening. */
const FLAT = 0.95;
const END_ON = 0.6;

type Landmark = { x: number; y: number; z: number };

function load(dir: string, letter: string): Landmark[][] {
  const samples: Landmark[][] = [];
  for (const file of readdirSync(join(dir, letter)).sort()) {
    if (!file.endsWith(".json")) continue;
    try {
      const landmarks: unknown = JSON.parse(readFileSync(join(dir, letter, file), "utf8"));
      if (Array.isArray(landmarks) && landmarks.length === 21) samples.push(landmarks);
    } catch {
      // A few files in the dataset are truncated.
    }
  }
  return samples;
}

/** One sample as a handshape, or null when the hand is not facing the camera. */
function reconstruct(sample: Landmark[]): Handshape | null {
  // Viewer space: x right, y up, z towards the camera.
  let points: V3[] = sample.map((p) => [p.x * ASPECT, -p.y, -p.z]);
  const flat = (bone: number): [number, number] => {
    const a = points[boneStart(bone)]!;
    const b = points[bone + 1]!;
    return [b[0] - a[0], b[1] - a[1]];
  };

  // Left hands, and right hands seen in a mirror, become right hands.
  const [ix, iy] = flat(4);
  const [px, py] = flat(16);
  if (ix * py - iy * px < 0) points = points.map((p) => [-p[0], p[1], p[2]]);

  // No bone can look longer than it is, so the palm bone that looks longest
  // relative to its true length gives the image size of one palm length.
  const unit = Math.max(
    ...KNUCKLE_BONES.map((bone) => Math.hypot(...flat(bone)) / BONE_LENGTHS[bone]!),
  );
  if (!(unit > 1e-6)) return null;

  const joints: V3[] = [[0, 0, 0]];
  for (let bone = 0; bone < BONE_COUNT; bone++) {
    const [dx, dy] = flat(bone).map((v) => v / unit) as [number, number];
    const reach = BONE_LENGTHS[bone]!;
    const seen =
      ((points[bone + 1]![2] - points[boneStart(bone)]![2]) * ASPECT * DEPTH_GAIN) / unit;
    const planar = Math.hypot(dx, dy);
    const lifted = Math.sqrt(Math.max(0, reach * reach - planar * planar));
    const trust = clamp((FLAT - planar / reach) / (FLAT - END_ON));
    const dz = Math.sign(seen) * mix1(Math.min(lifted, Math.abs(seen)), lifted, trust);
    joints.push(add(joints[boneStart(bone)]!, scale(normalize([dx, dy, dz]), reach)));
  }

  // Into hand space: +Y to the middle knuckle, +X to the thumb side, +Z out of the palm.
  const y = normalize(joints[9]!);
  const across = sub(joints[5]!, joints[17]!);
  const x = normalize(sub(across, scale(y, dot(across, y))));
  const z = cross(x, y);
  if (z[2] < 0.2) return null;
  return fromJoints(joints.map((p) => [dot(p, x), dot(p, y), dot(p, z)]));
}

const mix1 = (a: number, b: number, t: number): number => a + (b - a) * t;
const median = (values: number[]): number => values.sort((a, b) => a - b)[values.length >> 1]!;

/** The typical handshape: the mean of the samples closest to the median one. */
function typical(shapes: Handshape[]): Handshape {
  const flat = shapes.map((shape) => shape.flat());
  const centre = flat[0]!.map((_, i) => median(flat.map((values) => values[i]!)));
  const spread = (values: number[]) => values.reduce((sum, v, i) => sum + (v - centre[i]!) ** 2, 0);
  const nearest = shapes
    .map((shape, i) => ({ shape, spread: spread(flat[i]!) }))
    .sort((a, b) => a.spread - b.spread)
    .slice(0, Math.max(5, Math.round(shapes.length * KEEP)));
  return Array.from({ length: BONE_COUNT }, (_, bone) =>
    normalize(nearest.reduce<V3>((sum, { shape }) => add(sum, shape[bone]!), [0, 0, 0])),
  );
}

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node scripts/build-letters.ts <dataset dir>");
  process.exit(1);
}

const letters: Record<string, Handshape> = {};
for (const letter of MEASURED) {
  const samples = load(dir, letter);
  const shapes = samples.map(reconstruct).filter((shape) => shape !== null);
  letters[letter] = typical(shapes);
  console.log(`${letter}: ${shapes.length} of ${samples.length} samples`);
}

const debug = process.argv.indexOf("--debug");
if (debug > 0) writeFileSync(process.argv[debug + 1]!, JSON.stringify(letters));

const rows = Object.entries(letters).map(
  ([letter, shape]) =>
    `  ${letter}: [${shape
      .flat()
      .map((v) => Number(v.toFixed(3)))
      .join(",")}],`,
);
writeFileSync(
  new URL("../src/signing/letters.ts", import.meta.url),
  `// Generated by scripts/build-letters.ts from sid220/asl-now-fingerspelling (MIT). Do not edit.
// One row per letter: 20 bone directions, three numbers each. See hand.ts.
export const MEASURED = {
${rows.join("\n")}
} as const;
`,
);
