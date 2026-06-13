/**
 * retarget-handshapes.ts
 *
 * Converts the per-letter landmark centroids in vision/canonical-landmarks.ts
 * (averaged real hands, MediaPipe topology) into Handshape joint angles and
 * merges them into planning/handshapes/asl.json.
 *
 * Anatomical flexion angles (mcp/pip/dip, thumb flex/curl) are taken raw from
 * the landmark geometry. Convention-dependent channels (finger splay, thumb
 * splay) are mapped onto the renderer's conventions with a per-channel linear
 * fit against the existing curated values; a channel whose fit explains too
 * little variance keeps its curated values instead.
 *
 * Usage:
 *   bun scripts/retarget-handshapes.ts          # report only
 *   bun scripts/retarget-handshapes.ts --write  # update asl.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FingerAngles, Handshape, ThumbAngles } from "../src/planning/pose-library";
import { ASL_CANONICAL_DATASET } from "../src/vision/canonical-landmarks";

type P3 = { x: number; y: number; z: number };

const sub = (a: P3, b: P3): P3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: P3, b: P3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: P3, b: P3): P3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const norm = (a: P3) => Math.sqrt(dot(a, a)) || 1e-9;
const unit = (a: P3): P3 => {
  const n = norm(a);
  return { x: a.x / n, y: a.y / n, z: a.z / n };
};
const angle = (a: P3, b: P3) =>
  Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (norm(a) * norm(b)))));

// MediaPipe hand topology: per finger [mcp, pip, dip, tip]; thumb [cmc, mcp, ip, tip]
const FINGERS = {
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
} as const;
const WRIST = 0;
const THUMB = [1, 2, 3, 4] as const;

interface RawShape {
  fingers: Record<keyof typeof FINGERS, { mcp: number; pip: number; dip: number; splay: number }>;
  thumb: { splay: number; flex: number; curl: number };
}

function extractRaw(lm: P3[]): RawShape {
  const wrist = lm[WRIST]!;
  // Palm plane normal (right hand): index-metacarpal × pinky-metacarpal
  const n = unit(cross(sub(lm[FINGERS.index[0]]!, wrist), sub(lm[FINGERS.pinky[0]]!, wrist)));

  const fingers = {} as RawShape["fingers"];
  for (const [name, [mcpI, pipI, dipI, tipI]] of Object.entries(FINGERS)) {
    const metacarpal = sub(lm[mcpI]!, wrist);
    const proximal = sub(lm[pipI]!, lm[mcpI]!);
    const middle = sub(lm[dipI]!, lm[pipI]!);
    const distal = sub(lm[tipI]!, lm[dipI]!);

    // Splay: signed in-plane deviation of the proximal phalanx from the metacarpal.
    const splaySign = dot(cross(unit(metacarpal), unit(proximal)), n);
    const splay = Math.asin(Math.max(-1, Math.min(1, splaySign)));

    fingers[name as keyof typeof FINGERS] = {
      mcp: angle(metacarpal, proximal),
      pip: angle(proximal, middle),
      dip: angle(middle, distal),
      splay,
    };
  }

  const [cmcI, mcpI, ipI, tipI] = THUMB;
  const cmcSeg = sub(lm[mcpI]!, lm[cmcI]!);
  const proxSeg = sub(lm[ipI]!, lm[mcpI]!);
  const distSeg = sub(lm[tipI]!, lm[ipI]!);
  // Thumb splay: signed in-plane angle between thumb metacarpal and index metacarpal.
  const indexMeta = sub(lm[FINGERS.index[0]]!, wrist);
  const tSign = dot(cross(unit(indexMeta), unit(cmcSeg)), n);
  const tAngle = angle(indexMeta, cmcSeg);

  return {
    fingers,
    thumb: {
      splay: tSign >= 0 ? tAngle : -tAngle,
      flex: angle(cmcSeg, proxSeg),
      curl: angle(proxSeg, distSeg),
    },
  };
}

// ── Linear fit (least squares y = a·x + b) with R² ───────────────────────────
function fit(xs: number[], ys: number[]): { a: number; b: number; r2: number } {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i]! - mx) * (ys[i]! - my);
    sxx += (xs[i]! - mx) ** 2;
    syy += (ys[i]! - my) ** 2;
  }
  const a = sxx > 1e-12 ? sxy / sxx : 0;
  const b = my - a * mx;
  const r2 = syy > 1e-12 ? (sxy * sxy) / (sxx * syy) : 0;
  return { a, b, r2 };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r3 = (v: number) => Math.round(v * 1000) / 1000;

function main() {
  const write = process.argv.includes("--write");
  const aslPath = join(import.meta.dir, "../src/planning/handshapes/asl.json");
  const curated: Record<string, Handshape> = JSON.parse(readFileSync(aslPath, "utf8"));

  const raws = new Map<string, RawShape>();
  for (const sign of ASL_CANONICAL_DATASET) {
    if (/^[A-Z]$/.test(sign.name)) raws.set(sign.name, extractRaw(sign.landmarks as P3[]));
  }
  console.log(`Centroids: ${raws.size} letters | curated entries: ${Object.keys(curated).length}`);

  // Pool raw vs curated per channel across all letters to map conventions.
  type Chan = { xs: number[]; ys: number[]; fit?: ReturnType<typeof fit> };
  const channels: Record<string, Chan> = {};
  const add = (chan: string, x: number, y: number) => {
    (channels[chan] ??= { xs: [], ys: [] }).xs.push(x);
    channels[chan]?.ys.push(y);
  };

  for (const [letter, raw] of raws) {
    const cur = curated[letter];
    if (!cur) continue;
    for (const f of ["index", "middle", "ring", "pinky"] as const) {
      add("mcp", raw.fingers[f].mcp, cur[f].mcp);
      add("pip", raw.fingers[f].pip, cur[f].pip);
      add("dip", raw.fingers[f].dip, cur[f].dip);
      add("splay", raw.fingers[f].splay, cur[f].splay);
    }
    add("t.splay", raw.thumb.splay, cur.thumb.splay);
    add("t.flex", raw.thumb.flex, cur.thumb.flex);
    add("t.curl", raw.thumb.curl, cur.thumb.curl);
  }

  console.log("\nChannel fits (raw anatomical → renderer convention):");
  const MIN_R2 = 0.2;
  for (const [name, c] of Object.entries(channels)) {
    c.fit = fit(c.xs, c.ys);
    const keep = c.fit.r2 < MIN_R2 ? "  ← R² too low, keeping curated values" : "";
    console.log(
      `  ${name.padEnd(7)} a=${c.fit.a.toFixed(3).padStart(7)}  b=${c.fit.b.toFixed(3).padStart(7)}  R²=${c.fit.r2.toFixed(2)}${keep}`,
    );
  }

  const map = (chan: string, raw: number, fallback: number, lo: number, hi: number) => {
    const c = channels[chan]?.fit!;
    return c.r2 < MIN_R2 ? fallback : clamp(c.a * raw + c.b, lo, hi);
  };

  const out: Record<string, Handshape> = { ...curated };
  console.log("\nPer-letter max |Δ| vs curated (rad):");
  const deltas: [string, number][] = [];

  for (const [letter, raw] of raws) {
    const cur = curated[letter];
    if (!cur) continue;
    const shape: Handshape = {
      index: {} as FingerAngles,
      middle: {} as FingerAngles,
      ring: {} as FingerAngles,
      pinky: {} as FingerAngles,
      thumb: {} as ThumbAngles,
    };
    let maxD = 0;
    for (const f of ["index", "middle", "ring", "pinky"] as const) {
      shape[f] = {
        mcp: r3(map("mcp", raw.fingers[f].mcp, cur[f].mcp, 0, 1.6)),
        pip: r3(map("pip", raw.fingers[f].pip, cur[f].pip, 0, 1.7)),
        dip: r3(map("dip", raw.fingers[f].dip, cur[f].dip, 0, 1.2)),
        splay: r3(map("splay", raw.fingers[f].splay, cur[f].splay, -0.45, 0.45)),
      };
      for (const k of ["mcp", "pip", "dip", "splay"] as const) {
        maxD = Math.max(maxD, Math.abs(shape[f][k] - cur[f][k]));
      }
    }
    shape.thumb = {
      splay: r3(map("t.splay", raw.thumb.splay, cur.thumb.splay, -1.0, 0.7)),
      flex: r3(map("t.flex", raw.thumb.flex, cur.thumb.flex, 0, 1.3)),
      curl: r3(map("t.curl", raw.thumb.curl, cur.thumb.curl, 0, 1.0)),
    };
    for (const k of ["splay", "flex", "curl"] as const) {
      maxD = Math.max(maxD, Math.abs(shape.thumb[k] - cur.thumb[k]));
    }
    out[letter] = shape;
    deltas.push([letter, maxD]);
  }

  deltas.sort((a, b) => b[1] - a[1]);
  console.log(`  ${deltas.map(([l, d]) => `${l}:${d.toFixed(2)}`).join(" ")}`);

  if (write) {
    writeFileSync(aslPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
    console.log(`\nWrote ${raws.size} data-derived letters into ${aslPath}`);
    console.log("(digits and special keys kept curated)");
  } else {
    console.log("\nDry run — pass --write to update asl.json");
  }
}

main();
