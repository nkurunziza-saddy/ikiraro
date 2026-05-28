# Release Checklist

Run through this after any change that touches the public API, package versions,
or runtime behavior. Short tasks — do them in order.

---

## 1. Before bumping versions

- [ ] All tests pass: `bun run test`
- [ ] No type errors: `bun run check-types`
- [ ] Lint clean: `bun run check`
- [ ] Build succeeds: `bun run build`

---

## 2. Version bump

| File | What to update |
|------|---------------|
| `packages/engine/package.json` | `"version"` |
| `packages/sdk/package.json` | `"version"` |
| `apps/web/src/routes/docs.tsx` | Version badge in the sidebar `v0.x.y` |

Semver guide for this project:
- **patch** — bug fixes, copy corrections, internal refactors with no API surface change
- **minor** — new exports, new hooks, new doc pages, new runtime features
- **major** — breaking changes to existing public API

---

## 3. Docs (`apps/web/src/routes/docs/`)

For every public API change:

- [ ] If a new hook or function was added: create or update the relevant doc page
- [ ] If a new route was added: register it in `routeTree.gen.ts` and the nav in `docs.tsx`
- [ ] If a component prop was added/removed: update the `RefTable` in `docs/components.tsx`
- [ ] If a new event was added: add a row in `docs/events.tsx`
- [ ] If a type changed shape: update `docs/types.tsx`
- [ ] If the accessibility system changed: update `docs/accessibility.tsx`
- [ ] Add the page to the "Next" navigation grid in `docs/index.tsx` if it's new

---

## 4. Skill (`skills/ikiraro-sdk/`)

The skill is loaded by Claude Code during development. Keep it tighter than the web docs
(no full examples — patterns only).

- [ ] Update `metadata.version` and `metadata.release_date` in `SKILL.md` frontmatter
- [ ] Update installation code block version comment if it's not current
- [ ] Update or add a Pattern section for any significant new feature
- [ ] Update `references/api_reference.md` for any type/hook/method signature changes
- [ ] Update `references/model_specs.md` if the avatar rig requirements changed

After editing:

```bash
# Sync into SDK package and both agent dirs in one step
node packages/sdk/bin/add-skill.js
```

This copies `skills/ikiraro-sdk/` into:
- `packages/sdk/skill/` (ships with npm package)
- `.agents/skills/ikiraro-sdk/`
- `.claude/skills/ikiraro-sdk/`

---

## 5. SDK package skill

The SDK package bundles the skill so users get it on install. The `add-skill.js` script above
handles the sync. Verify the copy landed:

```bash
ls packages/sdk/skill/
# SKILL.md  references/
```

---

## 6. Publish

```bash
# Re-run full suite before publishing
bun run check-types && bun run test && bun run build

# Publish (requires npm OTP if 2FA is enabled)
bun changeset publish
```

If npm prompts for OTP: `! npm login` then re-run `bun changeset publish`.

---

## 7. Commit

Stage exactly:

```bash
git add packages/engine/package.json \
        packages/sdk/package.json \
        packages/sdk/skill/ \
        apps/web/src/routes/docs/ \
        apps/web/src/routes/docs.tsx \
        apps/web/src/routeTree.gen.ts \
        skills/ikiraro-sdk/ \
        .agents/skills/ikiraro-sdk/ \
        .claude/skills/ikiraro-sdk/
```

Commit message format:

```
release: <package>@<version> — <one-line summary>

- @ikiraro/engine x.y.z → a.b.c (reason)
- @ikiraro/sdk x.y.z → a.b.c (reason)
- docs: <what changed>
- skill: v1.x.y (what changed)
```

---

## Quick reference: which files own what

| Concern | Files |
|---------|-------|
| SDK runtime API | `skills/ikiraro-sdk/references/api_reference.md` |
| Avatar model rig | `skills/ikiraro-sdk/references/model_specs.md` |
| Usage patterns for Claude | `skills/ikiraro-sdk/SKILL.md` |
| Web docs — overview | `apps/web/src/routes/docs/index.tsx` |
| Web docs — hooks | `apps/web/src/routes/docs/hooks.tsx` |
| Web docs — components | `apps/web/src/routes/docs/components.tsx` |
| Web docs — vision | `apps/web/src/routes/docs/vision.tsx` |
| Web docs — runtime | `apps/web/src/routes/docs/runtime.tsx` |
| Web docs — events | `apps/web/src/routes/docs/events.tsx` |
| Web docs — types | `apps/web/src/routes/docs/types.tsx` |
| Web docs — accessibility | `apps/web/src/routes/docs/accessibility.tsx` |
| Docs nav + version badge | `apps/web/src/routes/docs.tsx` |
| Code block component | `apps/web/src/components/docs/primitives.tsx` |
