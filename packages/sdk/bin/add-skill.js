#!/usr/bin/env node
import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillSrc = resolve(__dirname, "../skill");
const TARGETS = [
  join(process.cwd(), ".agents", "skills", "ikiraro-sdk"),
  join(process.cwd(), ".claude", "skills", "ikiraro-sdk"),
];

if (!existsSync(skillSrc)) {
  console.error("Skill files not found in package. Re-install @ikiraro/sdk.");
  process.exit(1);
}

for (const dest of TARGETS) {
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  await cp(skillSrc, dest, { recursive: true });
  console.log(`Ikiraro skill installed → ${dest}`);
}
console.log("Skill ready in both .agents and .claude skill directories.");
