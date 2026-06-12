# Plan 011: Restore SDK documentation (design/spike) — close the gap between the published package and its vanished docs

> **Executor instructions**: This is a **design/spike plan**, not a build-everything plan.
> The deliverable is restored doc content in-repo plus a short decision report —
> NOT a rebuilt docs site. Follow the steps; honor STOP conditions. When done,
> update the status row in `plans/README.md`.
>
> **Drift check (run first)**: `git log --oneline -5 -- apps/web/src/routes/docs packages/sdk/README.md docs/` —
> if a `docs/` directory already exists or the docs routes have been restored
> since 2026-06-10, re-scope to "reconcile" instead of "restore" and report.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW (docs only; no runtime code)
- **Depends on**: none (can run anytime; pairs well after 002/003 so docs describe the fixed packaging)
- **Category**: docs / direction
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

`@ikiraro/sdk` is a published npm package whose README (line 64) sends users to `https://ikiraro.org/docs` for the "full API reference and advanced guides" — but the docs routes (`apps/web/src/routes/docs/{index,components,hooks,events,runtime,types,vision,accessibility}.tsx`) were deleted in the working tree, along with the repo-level `roadmap.md`, `features.md`, and `architecture-map.md` (deleted in/around commit `d114cc3`). The only surviving API reference lives inside the bundled Claude Code skill (`packages/sdk/skill/references/`), which human npm consumers never see. New users hit a dead link; contributors lost the architecture map. This plan restores the content **in-repo as markdown** (cheap, versioned, link-stable) and fixes the dead link — rebuilding a docs *site* is explicitly deferred.

## Current state

- `packages/sdk/README.md:64`: `For full API reference and advanced guides, visit [ikiraro.org/docs](https://ikiraro.org/docs).` — dead/soon-dead destination.
- Deleted-but-recoverable content (verify exact paths with `git log --diff-filter=D --name-only --oneline | head -40`):
  - Docs routes last present at commit `6a54bf9` ("docs: fix code block theme, add accessibility page...") — recover via `git show 6a54bf9:apps/web/src/routes/docs/<file>.tsx` (content is TSX; the prose must be extracted to markdown).
  - `architecture-map.md`, `features.md`, `roadmap.md` — deleted around `d114cc3`; recover via `git show <sha>:architecture-map.md` after finding the last commit that had them: `git log --oneline -1 -- architecture-map.md` then `git show <that-sha>^:architecture-map.md` if needed (use `git rev-list -n 1 HEAD -- architecture-map.md` to find the last touching commit).
- Existing live docs surfaces to stay consistent with: root `README.md` (extensive — pipeline stages, architecture deep-dive), `packages/sdk/README.md`, `packages/sdk/skill/references/*.md` (programmatic API reference — check its accuracy against `packages/sdk/src/index.ts` exports before reusing).
- The web app (`apps/web`) is a TanStack Start site being redesigned (untracked `DESIGN.md`/`GEMINI.md` describe a new design system) — that's WHY the docs routes were deleted; do not resurrect the old TSX pages.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Find deletion commits | `git rev-list -n 1 HEAD -- architecture-map.md` | a SHA |
| Recover file | `git show <sha>:architecture-map.md > docs/architecture.md` (then edit) | file content |
| List deleted docs routes | `git show 6a54bf9 --stat -- apps/web/src/routes/docs` | file list |
| Link check | `grep -rn "ikiraro.org/docs" README.md packages/` | locate all dead links |

## Scope

**In scope** (the only files you should create/modify):
- `docs/**` (create — markdown only)
- `packages/sdk/README.md` (fix the dead link; optionally inline a condensed API section)
- `README.md` (root — add a Docs section linking to `docs/`)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `apps/web/**` — no rebuilding of docs routes; the site redesign owns that.
- `packages/sdk/skill/**` — the skill is versioned with the sdk; syncing it is a release-checklist concern, not this spike.
- Any source code.

## Git workflow

- Branch: `advisor/011-docs-restoration`
- Commit style: conventional commits, e.g. `docs: restore architecture and API docs in-repo`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Inventory what was lost and what is still accurate

Recover (to a scratch location, e.g. `/tmp/ikiraro-docs-recovery/`) the deleted markdown files and the prose content of the deleted docs routes. Build a table: document → last-known commit → still-accurate? (spot-check 3–5 claims per doc against current code, e.g. export names in `packages/sdk/src/index.ts`, hook shapes in `packages/runtime/src/react/client.ts`).

**Verify**: the inventory table exists in your working notes; each row has an accuracy verdict.

### Step 2: Create `docs/` with the keepers

Suggested structure (adapt to what Step 1 found — keep only what's accurate or cheaply fixable):

```
docs/
  architecture.md      ← from architecture-map.md, updated to the post-refactor module layout
  api/
    sdk.md             ← createIkiraroClient, useIkiraro, useIkiraroPlugin, components
    runtime.md         ← IkiraroRuntime, plugins, events, audio/accessibility
    engine.md          ← planning + vision exports
  guides/
    quick-start.md     ← extracted from root README's Quick Start (link, don't duplicate, if identical)
    hand-tracking.md   ← from the deleted vision docs route prose
    accessibility.md   ← from the deleted accessibility route prose
```

Every claim you carry over must match current code — where it doesn't and the fix isn't obvious, mark the section `> ⚠️ Outdated — needs review` rather than guessing. Convert TSX prose to plain markdown; drop styling/JSX artifacts.

**Verify**: `ls docs/` matches the structure you chose; `grep -rn "ikiraro.org" docs/` → 0 matches (no self-referencing dead links).

### Step 3: Fix the dead links

- `packages/sdk/README.md:64` → point to the GitHub-hosted docs: `https://github.com/nkurunziza-saddy/ikiraro/tree/main/docs` (works from the npm page).
- Root `README.md` → add a short "Documentation" section linking to `docs/`.
- Sweep: `grep -rn "ikiraro.org/docs" . --include="*.md" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v plans/` → fix every hit within scope; report hits outside scope (e.g. in `apps/web` or `skill/`) without touching them.

**Verify**: the sweep grep returns hits only in out-of-scope files (listed in your report) or none.

### Step 4: Write the decision report

Append a short section to your final report (and as a comment block at the bottom of `docs/architecture.md` or a `docs/README.md`): what was restored, what was dropped as obsolete (with one line why each), and the open product question — *should docs live on the website again, and if so, generated from these markdown files?* — explicitly left for the maintainer.

**Verify**: `docs/README.md` (or equivalent index) exists and lists every doc with a one-line description.

## Test plan

Docs-only: no tests. Gate = link sweep grep + the accuracy spot-checks recorded in the report.

## Done criteria

- [ ] `docs/` exists with an index (`docs/README.md`) and ≥3 content files
- [ ] `grep -n "ikiraro.org/docs" packages/sdk/README.md` → 0 matches
- [ ] Root `README.md` links to `docs/`
- [ ] Report lists: restored docs, dropped docs (with reasons), flagged-outdated sections, and the open site-vs-repo question
- [ ] `bun run check-types` exits 0 (nothing should have changed, but confirm)
- [ ] `git status --short` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The recovered docs contradict current code so heavily (>~half the claims wrong) that restoration is mostly rewriting — that's an authoring project, not a spike; report the inventory table and stop.
- A `docs/` directory already exists with conflicting content.
- You cannot find the deleted content in git history (the working-tree deletions were never committed and got discarded) — report which files are unrecoverable.

## Maintenance notes

- Whenever sdk exports change, `docs/api/*.md` AND `packages/sdk/skill/references/` both need the update — a release-checklist item (one existed at commit `b3a10cf`, since deleted; consider restoring it as `docs/release-checklist.md` in Step 2 if recovered content includes it).
- If the website regains a docs section, generate it from these markdown files rather than hand-written TSX, so there is one source of truth.
