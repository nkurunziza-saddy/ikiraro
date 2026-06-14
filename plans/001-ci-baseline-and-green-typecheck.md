# Plan 001: Establish a green CI baseline — fix the red typecheck, split the mutating check script, add PR CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d114cc3..HEAD -- apps/web/src/components/ui/tabs.tsx package.json CONTRIBUTING.md .github/workflows/`
> This plan was written against the **working tree** (which contained
> uncommitted changes), not the commit. Before proceeding, compare the
> "Current state" excerpts below against the live code; on a mismatch, treat
> it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

`bun run check-types` currently exits non-zero because of one unused variable in `apps/web`, and nothing runs typecheck or tests on pull requests — the only GitHub workflow is the release workflow, which runs checks at publish time. That means the repo's one-command verification signal is red, contributors can merge broken code unnoticed, and the next release would be blocked by an error that has nothing to do with the packages being released. Additionally, `bun run check` runs `oxfmt --write`, which rewrites files — a "check" command that mutates the working tree surprises contributors and CI alike. After this plan: typecheck is green, a non-mutating lint command exists, and every PR runs lint + typecheck + tests.

## Current state

- `apps/web/src/components/ui/tabs.tsx` — vendored tabs primitive. Line 86 destructures `layoutId` from context but never uses it (it was for a motion/react animated indicator; motion/react was removed in commit `f034b54`):

  ```tsx
  // apps/web/src/components/ui/tabs.tsx:85-87
  const { activeValue } = React.useContext(TabsRootCtx);
  const { variant, layoutId } = React.useContext(TabsListCtx);
  const isActive = value !== undefined && value === activeValue;
  ```

  The context itself (line 8 `TabsListCtx`, line 57 provider) still supplies `layoutId` — that is fine to leave; only the unused destructure at line 86 errors under `tsc`:
  `src/components/ui/tabs.tsx(86,20): error TS6133: 'layoutId' is declared but its value is never read.`

- Root `package.json` scripts (excerpt):

  ```json
  "check-types": "turbo check-types",
  "test": "turbo run test",
  "check": "oxlint -c oxlintrc.json && oxfmt --write",
  ```

- `CONTRIBUTING.md` lines 38–39 tell contributors:

  ```
  bun run check        # Lints and formats code
  bun run check-types  # Type-checks all packages
  ```

- `.github/workflows/release.yml` is the **only** workflow. It triggers on push to `main` and runs `bun run release` (which runs build + check-types + test) only when publishing.

- Repo conventions: Bun is the package manager (`packageManager: "bun@1.3.11"`), CI should use `oven-sh/setup-bun@v2` and `bun install --frozen-lockfile` — copy the setup steps from `.github/workflows/release.yml`.

## Commands you will need

| Purpose                | Command                         | Expected on success           |
| ---------------------- | ------------------------------- | ----------------------------- |
| Install                | `bun install --frozen-lockfile` | exit 0                        |
| Typecheck              | `bun run check-types`           | exit 0, "6 successful" tasks  |
| Tests                  | `bun run test`                  | exit 0, engine: 12 tests pass |
| Lint (after this plan) | `bun run lint`                  | exit 0, no file modifications |

## Scope

**In scope** (the only files you should modify):

- `apps/web/src/components/ui/tabs.tsx` (one-line fix)
- `package.json` (root — scripts only)
- `CONTRIBUTING.md` (the two command lines)
- `.github/workflows/ci.yml` (create)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- `.github/workflows/release.yml` — the release flow works; don't restructure it.
- `oxlintrc.json` — no rule changes.
- Any other lint warnings/errors oxlint may report in other files — fixing the codebase's lint debt is not this plan. If `oxlint` currently fails repo-wide, report that in your summary and make the CI lint step non-blocking (`continue-on-error: true`) with a TODO comment rather than fixing unrelated files.
- The `lint-staged` config in root `package.json` — it correctly uses `oxlint` + `oxfmt --write` for staged files; leave it.

## Git workflow

- Branch: `advisor/001-ci-baseline`
- Commit style: conventional commits, e.g. `fix(web): remove unused layoutId destructure`, `ci: add PR workflow for lint, typecheck, tests` (matches `git log` style like `chore:`, `feat:`, `ci:`).
- Do NOT push or open a PR unless the operator instructed it.

### Step 1: Fix the unused variable in tabs.tsx

In `apps/web/src/components/ui/tabs.tsx` line 86, change:

```tsx
const { variant, layoutId } = React.useContext(TabsListCtx);
```

to:

```tsx
const { variant } = React.useContext(TabsListCtx);
```

Do not remove `layoutId` from the `TabsListCtx` type or the provider — only the unused destructure.

**Verify**: `bun run check-types` → exit 0, all 6 tasks successful.

### Step 2: Split `check` into non-mutating `lint` and explicit `format`

In root `package.json`, replace:

```json
"check": "oxlint -c oxlintrc.json && oxfmt --write",
```

with:

```json
"lint": "oxlint -c oxlintrc.json",
"format": "oxfmt --write",
```

(Remove the `check` script entirely so nobody keeps calling the mutating version.)

Update `CONTRIBUTING.md` lines 38–39 to:

```
bun run lint         # Lints code (no changes written)
bun run format       # Formats code in place
bun run check-types  # Type-checks all packages
```

**Verify**: `bun run lint` → runs oxlint; then `git status --short` → shows ONLY the files you deliberately edited (lint must not have modified anything).

### Step 3: Add the CI workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  verify:
    name: Lint, typecheck, test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Typecheck
        run: bun run check-types

      - name: Test
        run: bun run test
```

**Verify**: `bunx --yes yaml-lint .github/workflows/ci.yml 2>/dev/null || bun -e "const fs=require('fs');const yaml=fs.readFileSync('.github/workflows/ci.yml','utf8');console.log('bytes',yaml.length)"` → file parses/exists. (If no YAML linter is available, visually confirm indentation matches `release.yml`.) Then run the three commands locally in order: `bun run lint && bun run check-types && bun run test` → all exit 0.

## Test plan

No new unit tests — this plan is tooling. The verification is the three commands passing locally and the workflow file being syntactically valid YAML.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run test` exits 0 (12 engine tests pass)
- [ ] `bun run lint` exits 0 (or is documented as non-blocking in CI with the failure summary reported)
- [ ] `grep -n '"check":' package.json` returns no match; `grep -n '"lint":' package.json` returns a match
- [ ] `.github/workflows/ci.yml` exists and triggers on `pull_request`
- [ ] `grep -n "bun run check\b" CONTRIBUTING.md` returns no match
- [ ] `git status --short` shows no files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `tabs.tsx:86` does not match the excerpt above (the file has been edited since planning).
- After Step 1, `bun run check-types` reveals OTHER type errors beyond the `layoutId` one — the working tree has drifted; report the new errors instead of fixing them.
- `oxlint` reports errors in more than ~5 files — that's a lint-debt cleanup beyond this plan's scope; make the CI step non-blocking and report.

## Maintenance notes

- Plan 002 and 003 (publishing fixes) assume this CI exists so their changes get verified on PR.
- If a `web` deploy workflow is added later, reuse the same Bun setup steps.
- Reviewer should scrutinize: that `lint-staged` still references `oxfmt --write` (intentional — formatting on commit is fine; a _check_ that formats is not).
