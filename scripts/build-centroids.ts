/**
 * build-centroids.ts
 *
 * Reads the Google ASL Fingerspelling Kaggle competition dataset,
 * computes per-letter Procrustes-aligned centroids, and writes canonical-landmarks.ts.
 *
 * Usage:
 *   bun scripts/build-centroids.ts <landmarks-dir> <train.csv>
 *
 * Inputs (from: kaggle competitions download -c asl-fingerspelling):
 *   train.csv              — columns: sequence_id, path, phrase, participant_id, file_id
 *   train_landmarks/       — one parquet file per sequence
 *                            columns: frame, type, landmark_index, x, y, z
 *                            where type ∈ {face, left_hand, right_hand, pose}
 *
 * The script only uses right_hand rows, landmark_index 0-20.
 * Applies the same Procrustes normalisation as SignAllRecognizer.
 * Only processes single-letter phrases (fingerspelling A-Z).
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

// ── types ─────────────────────────────────────────────────────────────────────

interface Point3D {
  x: number;
  y: number;
  z: number;
}
type Landmarks = Point3D[]; // 21 points, indices 0-20

// ── Procrustes normalisation — mirrors SignAllRecognizer.normalizeAndAlign ────

function normalizeAndAlign(landmarks: Landmarks): Landmarks {
  const wrist = landmarks[0]!;
  const middleBase = landmarks[9]!;

  const centered = landmarks.map((p) => ({
    x: p.x - wrist.x,
    y: p.y - wrist.y,
    z: p.z - wrist.z,
  }));

  let maxDist = 0.0001;
  for (const p of centered) {
    const d = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2);
    if (d > maxDist) maxDist = d;
  }

  const alignX = middleBase.x - wrist.x;
  const alignY = middleBase.y - wrist.y;
  const angle = Math.atan2(alignY, alignX);
  const cos = Math.cos(-angle + Math.PI / 2);
  const sin = Math.sin(-angle + Math.PI / 2);

  return centered.map((p) => ({
    x: (p.x * cos - p.y * sin) / maxDist,
    y: (p.x * sin + p.y * cos) / maxDist,
    z: p.z / maxDist,
  }));
}

// ── Parquet reading via Python/pyarrow (bun has no native parquet) ────────────

function readParquetLandmarks(filePath: string): Landmarks[] {
  // Use pyarrow via a tiny Python one-liner to convert to JSON
  const script = `
import pyarrow.parquet as pq, json, sys
t = pq.read_table(sys.argv[1], columns=["frame","type","landmark_index","x","y","z"])
rows = t.to_pydict()
out = []
for i in range(len(rows["frame"])):
    out.append({
        "frame": rows["frame"][i],
        "type": rows["type"][i],
        "idx": rows["landmark_index"][i],
        "x": rows["x"][i],
        "y": rows["y"][i],
        "z": rows["z"][i],
    })
print(json.dumps(out))
`.trim();

  let json: string;
  try {
    json = execSync(`python3 -c '${script.replace(/'/g, "'")}' "${filePath}"`, {
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    }).toString();
  } catch {
    return [];
  }

  type Row = { frame: number; type: string; idx: number; x: number; y: number; z: number };
  const rows: Row[] = JSON.parse(json);

  // Group by frame, keep only right_hand rows (fall back to left_hand if absent)
  const byFrame = new Map<number, Map<number, Point3D>>();

  for (const row of rows) {
    const t = (row.type ?? "").toLowerCase();
    if (!t.includes("hand")) continue;
    // Prefer right_hand; if only left_hand exists we still use it
    const existing = byFrame.get(row.frame);
    if (!existing) byFrame.set(row.frame, new Map());
    const fm = byFrame.get(row.frame)!;
    // Only overwrite with right_hand (don't let left clobber right)
    if (t.includes("right") || !fm.has(row.idx)) {
      if (
        row.idx >= 0 &&
        row.idx < 21 &&
        Number.isFinite(row.x) &&
        Number.isFinite(row.y) &&
        Number.isFinite(row.z)
      ) {
        fm.set(row.idx, { x: row.x, y: row.y, z: row.z });
      }
    }
  }

  const result: Landmarks[] = [];
  for (const fm of byFrame.values()) {
    if (fm.size < 21) continue;
    const lm: Landmarks = [];
    let valid = true;
    for (let i = 0; i < 21; i++) {
      const pt = fm.get(i);
      if (!pt) {
        valid = false;
        break;
      }
      lm.push(pt);
    }
    if (valid) result.push(lm);
  }
  return result;
}

// ── CSV helper ────────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = lines[0]?.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = vals[i] ?? "";
    });
    return row;
  });
}

// ── Centroid computation ──────────────────────────────────────────────────────

function computeCentroid(samples: Landmarks[]): Landmarks {
  const sum: Point3D[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  for (const s of samples) {
    for (let i = 0; i < 21; i++) {
      sum[i]!.x += s[i]?.x;
      sum[i]!.y += s[i]?.y;
      sum[i]!.z += s[i]?.z;
    }
  }
  return sum.map((p) => ({
    x: p.x / samples.length,
    y: p.y / samples.length,
    z: p.z / samples.length,
  }));
}

// ── TypeScript emitter ────────────────────────────────────────────────────────

const MOTION_SIGNATURES: Record<string, { index: number; sig: Point3D[] }> = {
  J: {
    index: 20,
    sig: [
      { x: 0, y: 0, z: 0 },
      { x: 0.1, y: 0.2, z: 0 },
      { x: 0.05, y: 0.4, z: 0 },
      { x: -0.2, y: 0.5, z: 0 },
      { x: -0.5, y: 0.4, z: 0 },
    ],
  },
  Z: {
    index: 8,
    sig: [
      { x: 0, y: 0, z: 0 },
      { x: 0.5, y: 0, z: 0 },
      { x: 0, y: 0.5, z: 0 },
      { x: 0.5, y: 0.5, z: 0 },
    ],
  },
};

function fmt(n: number): string {
  return n.toFixed(4);
}
function fmtPt(p: Point3D): string {
  return `{x: ${fmt(p.x)}, y: ${fmt(p.y)}, z: ${fmt(p.z)}}`;
}
function fmtLandmarks(lm: Landmarks): string {
  const rows: string[] = [];
  for (let i = 0; i < lm.length; i += 5) {
    rows.push(
      "      " +
        lm
          .slice(i, i + 5)
          .map(fmtPt)
          .join(", "),
    );
  }
  return `[\n${rows.join(",\n")}\n    ]`;
}

function emitTS(centroids: Map<string, Landmarks>): string {
  const letters = [...centroids.keys()].sort();
  const entries = letters.map((letter) => {
    const lm = centroids.get(letter)!;
    const motion = MOTION_SIGNATURES[letter];
    let entry = `  {\n    name: "${letter}",\n    landmarks: ${fmtLandmarks(lm)}`;
    if (motion) {
      entry += `,\n    motionLandmarkIndex: ${motion.index}`;
      entry += `,\n    motionSignature: [\n      ${motion.sig.map(fmtPt).join(", ")}\n    ]`;
    }
    return `${entry}\n  }`;
  });

  return `import type { HandLandmarks, Point3D } from "./types";

export interface TrainedSign {
  name: string;
  landmarks: HandLandmarks;
  motionSignature?: Point3D[];
  motionLandmarkIndex?: number;
}

/**
 * Per-letter Procrustes-aligned centroids.
 * Computed from the Google ASL Fingerspelling Kaggle competition dataset.
 * Generated by: bun scripts/build-centroids.ts
 */
export const ASL_CANONICAL_DATASET: TrainedSign[] = [
${entries.join(",\n")}
];
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const [, , landmarksDir, trainCsvPath] = process.argv;

  if (!landmarksDir || !trainCsvPath) {
    console.error(`
Usage:
  bun scripts/build-centroids.ts <landmarks-dir> <train.csv>

Download with Kaggle CLI:
  kaggle competitions download -c asl-fingerspelling -f train.csv
  kaggle competitions download -c asl-fingerspelling -f train_landmarks.zip
  unzip train_landmarks.zip -d train_landmarks/
    `);
    process.exit(1);
  }

  if (!existsSync(landmarksDir)) {
    console.error(`Not found: ${landmarksDir}`);
    process.exit(1);
  }
  if (!existsSync(trainCsvPath)) {
    console.error(`Not found: ${trainCsvPath}`);
    process.exit(1);
  }

  console.log("Reading train.csv …");
  const trainRows = parseCSV(readFileSync(trainCsvPath, "utf8"));

  // Map: sequence_id → single letter
  const seqToLetter = new Map<string, string>();
  for (const row of trainRows) {
    const phrase = (row.phrase ?? "").trim().toUpperCase();
    const seqId = (row.sequence_id ?? row.path ?? "").trim();
    if (phrase.length === 1 && /[A-Z]/.test(phrase)) {
      seqToLetter.set(seqId, phrase);
      // Also index by just the stem in case path includes directory
      seqToLetter.set(basename(seqId, ".parquet"), phrase);
    }
  }
  console.log(`Single-letter sequences: ${seqToLetter.size}`);

  const files = readdirSync(landmarksDir).filter((f) => f.endsWith(".parquet"));
  const samplesByLetter = new Map<string, Landmarks[]>();
  const MIN_SAMPLES_PER_LETTER = 30; // stop collecting once we have enough
  const TARGET_SAMPLES = 300;

  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const stem = basename(file, ".parquet");
    const letter = seqToLetter.get(stem) ?? seqToLetter.get(file);
    if (!letter) {
      skipped++;
      continue;
    }

    const existing = samplesByLetter.get(letter) ?? [];
    if (existing.length >= TARGET_SAMPLES) continue; // enough for this letter

    const raw = readParquetLandmarks(join(landmarksDir, file));
    const normalized = raw.map(normalizeAndAlign);
    samplesByLetter.set(letter, [...existing, ...normalized]);
    processed++;

    if (processed % 100 === 0) {
      const counts = [...samplesByLetter.entries()].map(([l, s]) => `${l}:${s.length}`).join(" ");
      process.stdout.write(`\r  [${processed}] ${counts}   `);
    }
  }

  console.log(`\nProcessed: ${processed}, skipped: ${skipped}`);

  const centroids = new Map<string, Landmarks>();
  for (const [letter, samples] of samplesByLetter) {
    if (samples.length < MIN_SAMPLES_PER_LETTER) {
      console.warn(`  SKIP ${letter}: only ${samples.length} samples`);
      continue;
    }
    centroids.set(letter, computeCentroid(samples));
    console.log(`  ${letter}: ${samples.length} samples → centroid computed`);
  }

  const missing = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((l) => !centroids.has(l));
  if (missing.length) console.warn(`Missing: ${missing.join(", ")}`);

  const outPath = join(import.meta.dir, "../src/vision/canonical-landmarks.ts");
  writeFileSync(outPath, emitTS(centroids), "utf8");
  console.log(`\nWrote ${centroids.size} centroids → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
