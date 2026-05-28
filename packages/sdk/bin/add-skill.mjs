#!/usr/bin/env node
import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillSrc = resolve(__dirname, "../skill");
const dest = join(process.cwd(), ".claude", "skills", "ikiraro-sdk");

if (!existsSync(skillSrc)) {
  console.error("Skill files not found in package. Re-install @ikiraro/sdk.");
  process.exit(1);
}

await mkdir(dest, { recursive: true });
await cp(skillSrc, dest, { recursive: true, force: true });
console.log(`Ikiraro skill installed → ${dest}`);
console.log("Claude Code can now use the ikiraro skill in this project.");
