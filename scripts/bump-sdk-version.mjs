import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const bump = process.argv[2];
const allowed = new Set(["patch", "minor", "major"]);

if (!allowed.has(bump)) {
  console.error("Usage: bun scripts/bump-sdk-version.mjs <patch|minor|major>");
  process.exit(1);
}

const packagePath = resolve("packages/sdk/package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const [major, minor, patch] = packageJson.version.split(".").map(Number);

if ([major, minor, patch].some((part) => !Number.isInteger(part))) {
  console.error(`Invalid SDK version: ${packageJson.version}`);
  process.exit(1);
}

const next =
  bump === "major"
    ? [major + 1, 0, 0]
    : bump === "minor"
      ? [major, minor + 1, 0]
      : [major, minor, patch + 1];

packageJson.version = next.join(".");
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(`@ikiraro/sdk v${packageJson.version}`);
