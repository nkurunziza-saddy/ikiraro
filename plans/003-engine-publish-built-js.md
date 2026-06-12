# Plan 003: Publish @ikiraro/engine as compiled JS + d.ts instead of raw TypeScript sources

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d114cc3..HEAD -- packages/engine/package.json packages/engine/tsup.config.ts packages/engine/tsconfig.json`
> This plan was written against the **working tree** (which contained
> uncommitted changes). Compare the "Current state" excerpts below against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (touches the package's public entry points; workspace consumers must keep working)
- **Depends on**: plans/001-ci-baseline-and-green-typecheck.md, plans/002-sdk-publish-manifest.md (do the sdk manifest first so release state is coherent)
- **Category**: migration / packaging
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

`@ikiraro/engine@0.2.0` is published on npm with an exports map pointing at raw TypeScript source (`"." → "./src/types.ts"`, `"./planning" → "./src/planning/index.ts"`, etc. — verified via `npm view @ikiraro/engine exports`). Raw `.ts` entry points work in Bun and in this monorepo, but fail in Node (`node` cannot execute TS from node_modules) and in most bundlers' default configs (webpack, Next.js, and Vite all skip transpiling node_modules). The README explicitly markets `bun add @ikiraro/engine` "for custom rendering or server-side use" — a Node server consumer today gets `ERR_UNKNOWN_FILE_EXTENSION`. After this plan, the published package ships compiled ESM + `.d.ts` per subpath, while the monorepo keeps consuming sources directly (so dev iteration speed is unchanged).

## Current state

- `packages/engine/package.json` (full relevant excerpt):

  ```json
  "type": "module",
  "exports": {
    ".":           { "default": "./src/types.ts" },
    "./types":     { "default": "./src/types.ts" },
    "./planning":  { "default": "./src/planning/index.ts" },
    "./math":      { "default": "./src/math/index.ts" },
    "./vision":    { "default": "./src/vision/index.ts" },
    "./cdn":       { "default": "./src/cdn.ts" }
  },
  "scripts": {
    "check-types": "tsc --noEmit",
    "test": "vitest run",
    "cdn:build": "tsup"
  },
  "dependencies": { "effect": "catalog:" },
  "devDependencies": { "@ikiraro/config": "workspace:*", "tsup": "^8.5.0", "typescript": "catalog:", "vitest": "catalog:" }
  ```

  Note: there is no `files` field and no `build` script. The existing `tsup.config.ts` only builds a minified CDN bundle of `src/cdn.ts` into `dist/cdn/`.

- `packages/engine/tsup.config.ts` (current — CDN only):

  ```ts
  export default defineConfig({
    entry: { "ikiraro-engine": "src/cdn.ts" },
    format: ["esm", "iife"],
    globalName: "IkiraroEngine",
    clean: false, minify: true, sourcemap: true, treeshake: true, dts: false,
    outDir: "dist/cdn",
    ...
  });
  ```

- Workspace consumers import the subpaths everywhere, e.g. `packages/runtime/src/react/client.ts:6`:
  `import type { TranslationEnvelope, SttModel, TranslationContext } from "@ikiraro/engine/types";`
  and `packages/runtime/src/runtime/vision-system.ts:1`:
  `import type { HandProcessor, VisionEventMap, VisionStatus } from "@ikiraro/engine/vision";`

- The exemplar for "how this repo builds a publishable package" is `packages/sdk` (`tsup` with multi-entry `entry: {...}`, `format: ["esm"]`, `dts: { entry: {...} }`, `clean: true`). Mirror its style.

- The release pipeline: root `release` script = `bun run build && bun run check-types && bun run test && changeset publish`; `turbo build` has `outputs: ["dist/**"]`. Once engine has a `build` script, turbo will run it automatically during release.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Build engine | `cd packages/engine && bun run build` | exit 0, dist/*.js + dist/*.d.ts |
| Typecheck | `bun run check-types`    | exit 0 (all 6 packages) |
| Tests     | `bun run test`           | exit 0, 12+ tests   |
| Build sdk | `cd packages/sdk && bun run build` | exit 0 (sdk bundles engine src via tsup; must still work) |
| Pack preview | `cd packages/engine && npm pack --dry-run` | lists dist/, exit 0 |

## Scope

**In scope** (the only files you should modify):
- `packages/engine/package.json`
- `packages/engine/tsup.config.ts`
- `packages/engine/.gitignore` or root ignore handling for `dist/` if not already ignored (check first: `git check-ignore packages/engine/dist` — it likely already is)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):
- Any `src/**` file in engine — no code changes, packaging only.
- `packages/sdk/tsup.config.ts` — it bundles engine **source** via workspace resolution and `noExternal`; this keeps working regardless.
- `packages/runtime`, `packages/renderer`, `apps/web` manifests.
- The CDN build (`dist/cdn`) — keep `cdn:build` working exactly as-is.

## Git workflow

- Branch: `advisor/003-engine-built-publish`
- Commit style: conventional commits, e.g. `feat(engine): ship compiled dist with conditional exports for npm consumers`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extend tsup to build library entries alongside the CDN bundle

tsup supports an array of configs. Replace `packages/engine/tsup.config.ts` content with:

```ts
import { defineConfig } from "tsup";

export default defineConfig([
  // Library build — what npm consumers import
  {
    entry: {
      types: "src/types.ts",
      "planning/index": "src/planning/index.ts",
      "math/index": "src/math/index.ts",
      "vision/index": "src/vision/index.ts",
      cdn: "src/cdn.ts",
    },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: false,
    treeshake: true,
    external: ["effect"],
    outDir: "dist",
  },
  // CDN bundle — unchanged behavior, kept from the original config
  {
    entry: { "ikiraro-engine": "src/cdn.ts" },
    format: ["esm", "iife"],
    globalName: "IkiraroEngine",
    clean: false,
    minify: true,
    sourcemap: true,
    treeshake: true,
    dts: false,
    outDir: "dist/cdn",
    esbuildOptions(options) {
      options.bundle = true;
    },
  },
]);
```

(Preserve any `esbuildOptions` from the original CDN config verbatim.)

**Verify**: `cd packages/engine && bunx tsup` → exit 0; `ls dist` shows `types.js`, `types.d.ts`, `planning/index.js`, `planning/index.d.ts`, `math/index.js`, `vision/index.js`, `cdn.js`, and `dist/cdn/` still contains the CDN bundle.

### Step 2: Update package.json — build script, conditional exports, files field

In `packages/engine/package.json`:

1. Add scripts: `"build": "tsup"` (keep `cdn:build` as an alias or remove it and update any references — `grep -rn "cdn:build" .` first; if referenced anywhere outside engine, keep it).
2. Replace the exports map with conditional exports that keep **workspace/dev consumption on source** and **published consumption on dist**. Bun and modern bundlers honor custom conditions; the safest widely-supported pattern here is `development`/`default` is NOT reliable — instead use the explicit structure below, which Node and bundlers resolve to dist, while the monorepo's TS resolves types from the `types` condition and Bun's workspace dev still works because dist exists after build:

```json
"exports": {
  ".": {
    "types": "./dist/types.d.ts",
    "default": "./dist/types.js"
  },
  "./types": {
    "types": "./dist/types.d.ts",
    "default": "./dist/types.js"
  },
  "./planning": {
    "types": "./dist/planning/index.d.ts",
    "default": "./dist/planning/index.js"
  },
  "./math": {
    "types": "./dist/math/index.d.ts",
    "default": "./dist/math/index.js"
  },
  "./vision": {
    "types": "./dist/vision/index.d.ts",
    "default": "./dist/vision/index.js"
  },
  "./cdn": {
    "types": "./dist/cdn.d.ts",
    "default": "./dist/cdn.js"
  }
},
"files": ["dist", "README.md"]
```

3. Run `bun install` (workspace link refresh), then `cd packages/engine && bun run build` so dist exists for the workspace consumers.

**Verify**: `bun run check-types` from the repo root → exit 0 for ALL packages (runtime, renderer, sdk, web all resolve `@ikiraro/engine/*` through the new exports). `bun run test` → all pass.

### Step 3: Confirm sdk bundling still works

`packages/sdk/tsup.config.ts` uses `noExternal: [/^@ikiraro\//]`, which will now bundle engine's **dist** output (or source, depending on resolution) — either is correct.

**Verify**: `cd packages/sdk && bun run build` → exit 0; `grep -c "SignAllRecognizer" dist/index.js` ≥ 1.

### Step 4: Confirm the published artifact shape

```
cd packages/engine && npm pack --dry-run 2>&1 | tail -30
```

**Verify**: tarball contains `dist/**` (including `dist/cdn/`) and does NOT contain `src/**` (because of the `files` field). Exit 0.

### Step 5: Smoke-test Node consumption (the actual bug being fixed)

From a temp directory outside the repo:

```
mkdir -p /tmp/engine-smoke && cd /tmp/engine-smoke && npm init -y >/dev/null
npm install <absolute path to the .tgz from `npm pack` (run pack without --dry-run inside packages/engine, then delete the tgz after)>
node -e "import('@ikiraro/engine/planning').then(m => console.log(typeof m.RendererDirector))"
```

**Verify**: prints `function`. (If `effect` peer/dep install is needed, `npm install effect` in the smoke dir first.) Clean up the `.tgz` from `packages/engine/` afterward.

## Test plan

No new unit tests. Gates: root typecheck + tests green (proves workspace consumers resolve the new exports), sdk build green, npm-pack content check, and the Node import smoke test in Step 5 (this is the regression test for the actual finding).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `node -e "console.log(JSON.stringify(require('./packages/engine/package.json').exports['.']))"` shows dist paths, not src
- [ ] `packages/engine/package.json` has a `files` field containing `dist`
- [ ] `cd packages/engine && bun run build` exits 0 and produces `dist/types.js` + `dist/types.d.ts`
- [ ] `bun run check-types` exits 0 for all packages
- [ ] `bun run test` exits 0
- [ ] `cd packages/sdk && bun run build` exits 0
- [ ] Step 5 smoke test printed `function`
- [ ] No stray `.tgz` files left in the repo (`git status --short`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Root `check-types` fails after Step 2 in `runtime`/`renderer`/`sdk`/`web` with module-resolution errors you cannot fix by correcting the exports map paths — the monorepo may rely on a TS `paths` mapping or Bun-specific resolution this plan didn't anticipate. Report the exact errors.
- Engine's `tsc --noEmit` or tsup `dts: true` fails on `src` type errors — pre-existing type debt surfaced by declaration emit is its own task; report which files.
- `dist/` is committed/tracked by git (`git check-ignore packages/engine/dist` fails) and adding an ignore entry would conflict with how `.turbo`/release expects outputs — report instead of guessing.
- The engine's vitest suite starts failing — nothing here should affect tests; a failure means resolution changed for test imports too. Report.

## Maintenance notes

- From now on, engine must be **built before workspace consumers typecheck against dist types** in a fresh clone. Turbo handles this if `check-types` gains `"dependsOn": ["^build"]` — if fresh-clone typecheck fails in CI with missing dist, add that to `turbo.json` (and note it in the PR).
- The same raw-TS-publishing pattern should be checked whenever `runtime`/`renderer` are made public (they currently export `./src/*.ts` too, but they are private so it costs nothing today).
- Deferred deliberately: dual CJS output (`format: ["esm","cjs"]`). The package is ESM-only by design (`"type": "module"`); add CJS only if a consumer asks.
