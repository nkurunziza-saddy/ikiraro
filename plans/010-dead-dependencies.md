# Plan 010: Remove dead dependencies — zod, valibot, i18next, dotenv

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d114cc3..HEAD -- package.json apps/web/package.json bun.lock`
> This plan was written against the **working tree** (which contained
> uncommitted changes). Re-run the greps in "Current state" before deleting
> anything — a dependency is only dead if the grep still comes back empty.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-ci-baseline-and-green-typecheck.md (green gates to verify against)
- **Category**: tech-debt
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

The workspace catalog and manifests carry dependencies with **zero imports anywhere in the repo**: `zod` and `valibot` (validation is done exclusively with Effect Schema), `i18next` (the i18n config and locale files were deleted in the recent refactor), and `dotenv` (no `import`/`require` of it anywhere; Vite and Cloudflare Workers handle env injection themselves). Dead deps mislead contributors ("which validation lib do we use?"), inflate installs, and create false signals about planned features. Each removal was verified by repo-wide grep at planning time, but greps must be re-run at execution time.

## Current state

- Root `package.json`:
  - `workspaces.catalog` contains: `"dotenv": "^17.4.2"`, `"zod": "^4.4.3"`, `"valibot": "^1.4.0"`, `"i18next": "^26.1.0"` (among live entries like `effect`, `vitest`, `typescript` — do not touch those).
  - Root `"dependencies"`: `{ "dotenv": "catalog:", "zod": "catalog:" }` — the whole block can go if both entries are dead.
- `apps/web/package.json` `dependencies` contains `"dotenv": "catalog:"`.
- Verification greps that returned **empty** at planning time (2026-06-10):

  ```
  grep -rn "from [\"']zod\|from [\"']valibot\|from [\"']i18next" packages apps/web/src --include="*.ts" --include="*.tsx"
  grep -rn "dotenv" packages apps/web/src apps/web/vite.config.ts --include="*.ts" --include="*.tsx"
  ```

- Possible non-import usage to check before removing dotenv: `grep -rn "dotenv" apps/web --include="*.config.*" --include="*.json" | grep -v node_modules | grep -v package.json` and the same across `packages/*/tsup.config.ts`, `turbo.json` (turbo `inputs` mentions `.env*` files, which is fine and unrelated to the npm package).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Reinstall | `bun install`            | exit 0, lockfile shrinks |
| Typecheck | `bun run check-types`    | exit 0              |
| Tests     | `bun run test`           | exit 0              |
| Web build | `cd apps/web && bun run build` | exit 0        |

## Scope

**In scope** (the only files you should modify):
- `package.json` (root: catalog entries + root `dependencies`)
- `apps/web/package.json` (`dotenv` entry)
- `bun.lock` (regenerated)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- Any other catalog entry (`effect`, `typescript`, `vitest`, `@types/*`, `jsdom`, `@effect/*`, react types) — they are live or build-time infrastructure.
- `@vitest/ui` / `@vitest/coverage-v8` — unused-looking but they're developer tooling someone may invoke ad hoc; leave them (recorded as a deliberate keep).
- Source code — if a grep suddenly finds a real import, that dep is alive: skip it and report.

## Git workflow

- Branch: `advisor/010-dead-dependencies`
- Commit style: conventional commits, e.g. `chore: remove unused zod, valibot, i18next, dotenv dependencies`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Re-verify each dep is dead

Run both greps from "Current state", plus the config-file dotenv sweep. Every dep with zero hits is confirmed dead; any dep WITH hits gets skipped (report it).

**Verify**: greps return empty (or your report notes the exceptions).

### Step 2: Remove the entries

- Root `package.json`: delete `zod`, `valibot`, `i18next`, `dotenv` from `workspaces.catalog`; delete the root `dependencies` block (it contains only `dotenv` and `zod`).
- `apps/web/package.json`: delete `"dotenv": "catalog:"` from `dependencies`.
- Run `bun install`.

**Verify**: `bun install` → exit 0. `grep -n "zod\|valibot\|i18next\|dotenv" package.json apps/web/package.json` → 0 matches.

### Step 3: Full gate

```
bun run check-types && bun run test && cd apps/web && bun run build
```

**Verify**: all exit 0. (The web build is the real test for dotenv — Vite config and TanStack Start must not implicitly require it.)

## Test plan

No new tests. The gates in Step 3 are the verification; the web production build specifically covers the dotenv removal.

## Done criteria

- [ ] `grep -rn "\"zod\"\|\"valibot\"\|\"i18next\"\|\"dotenv\"" package.json apps/web/package.json packages/*/package.json` → 0 matches
- [ ] `bun run check-types` exits 0
- [ ] `bun run test` exits 0
- [ ] `cd apps/web && bun run build` exits 0
- [ ] `git status --short` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any grep in Step 1 finds a real usage (code has drifted since planning) — skip that dep, remove the rest, and note it.
- `bun install` or the web build fails after removal in a way that mentions one of the removed packages — restore that entry, complete the rest, report.

## Maintenance notes

- The repo's validation library is **Effect Schema** (`effect`), exclusively. If a future contributor reaches for zod, point them at the existing `packages/runtime/src/services/groq/schemas.ts` style instead.
- Kept deliberately: `@vitest/ui`, `@vitest/coverage-v8` (dev tooling), `jsdom` (catalog; check usage before any future removal pass).
