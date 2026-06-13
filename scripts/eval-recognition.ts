/**
 * eval-recognition.ts
 *
 * Offline accuracy evaluation for the sign recognizer against the labeled
 * sid220/asl-now-fingerspelling samples (same MediaPipe Web landmarks the app
 * produces at runtime).
 *
 * Samples are split deterministically per letter (by filename) into a template
 * half and a held-out eval half, so reported accuracy is honest.
 *
 * Usage:
 *   bun scripts/eval-recognition.ts <aslnow-dir> [--baseline]
 *     --baseline  evaluate the shipped recognizer/templates instead of the
 *                 rebuilt ones (templates built from the train half)
 */

import { SignAllRecognizer } from "../src/vision/sign-all-recognizer";
import { type LetterSamples, loadSplit } from "./build-letter-templates";

function evaluate(recognizer: SignAllRecognizer, split: Map<string, LetterSamples>) {
  const confusion = new Map<string, Map<string, number>>();
  let correct = 0;
  let rejected = 0;
  let wrong = 0;
  let total = 0;
  const trueScores: number[] = [];
  const impostorScores: number[] = [];
  const margins: number[] = [];

  for (const [letter, { test }] of split) {
    const row = new Map<string, number>();
    confusion.set(letter, row);
    for (const lm of test) {
      recognizer.reset(); // each sample is independent — no temporal history
      const result = recognizer.process(lm);
      total++;
      const got = result.sign ?? "·";
      row.set(got, (row.get(got) ?? 0) + 1);
      if (got === letter) correct++;
      else if (got === "·") rejected++;
      else wrong++;

      const top = result.candidates[0];
      if (top) {
        (top.name === letter ? trueScores : impostorScores).push(top.score);
        if (top.name === letter && result.candidates[1]) {
          margins.push(top.score - result.candidates[1].score);
        }
      }
    }
  }

  return { confusion, correct, rejected, wrong, total, trueScores, impostorScores, margins };
}

function report(name: string, r: ReturnType<typeof evaluate>) {
  console.log(`\n══ ${name} ══`);
  console.log(
    `accuracy ${((r.correct / r.total) * 100).toFixed(1)}%  ` +
      `wrong ${((r.wrong / r.total) * 100).toFixed(1)}%  ` +
      `rejected ${((r.rejected / r.total) * 100).toFixed(1)}%  (n=${r.total})`,
  );
  const rows: Array<[string, number, string]> = [];
  for (const [letter, row] of r.confusion) {
    const n = [...row.values()].reduce((s, v) => s + v, 0);
    const ok = row.get(letter) ?? 0;
    const top = [...row.entries()]
      .filter(([k]) => k !== letter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k, v]) => `${k}:${v}`)
      .join(" ");
    rows.push([letter, ok / n, top]);
  }
  rows.sort((a, b) => a[1] - b[1]);
  console.log("worst letters (acc | top confusions):");
  for (const [letter, acc, top] of rows.slice(0, 8)) {
    console.log(`  ${letter}  ${(acc * 100).toFixed(0).padStart(3)}%  ${top}`);
  }

  const pct = (vs: number[], p: number) =>
    vs.length ? vs.slice().sort((a, b) => a - b)[Math.floor((p / 100) * (vs.length - 1))]! : NaN;
  console.log(
    `top-1-is-true score:  p10 ${pct(r.trueScores, 10).toFixed(2)}  p50 ${pct(r.trueScores, 50).toFixed(2)}`,
  );
  console.log(
    `top-1-is-wrong score: p50 ${pct(r.impostorScores, 50).toFixed(2)}  p90 ${pct(r.impostorScores, 90).toFixed(2)}`,
  );
  console.log(
    `true-match margin:    p10 ${pct(r.margins, 10).toFixed(3)}  p50 ${pct(r.margins, 50).toFixed(3)}`,
  );
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const baseline = process.argv.includes("--baseline");
  if (!args[0]) {
    console.error("Usage: bun eval-recognition.ts <aslnow-dir> [--baseline]");
    process.exit(1);
  }
  const split = loadSplit(args[0]);
  const counts = [...split.values()].map((s) => s.test.length);
  console.log(
    `letters: ${split.size}, eval samples: ${counts.reduce((s, v) => s + v, 0)} ` +
      `(${Math.min(...counts)}–${Math.max(...counts)}/letter)`,
  );

  if (baseline) {
    report("baseline (shipped templates + scoring)", evaluate(new SignAllRecognizer(), split));
  } else {
    const { buildTemplates } = await import("./build-letter-templates");
    const templates = buildTemplates(split);
    report("rebuilt templates", evaluate(new SignAllRecognizer(templates), split));
  }
}

main();
