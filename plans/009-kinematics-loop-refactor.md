# Plan 009: Collapse KinematicController.solve()'s 30 unrolled spring updates into data-driven loops

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d114cc3..HEAD -- packages/engine/src/planning/kinematics/controller.ts`
> This plan was written against the **working tree** (which contained
> uncommitted changes). Compare the "Current state" excerpts below against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: MED (per-frame animation code; behavior must be bit-identical)
- **Depends on**: plans/008-characterization-tests-vision-kinematics.md — **HARD dependency: do not start until `packages/engine/src/planning/kinematics/controller.test.ts` exists and passes.** If it doesn't, STOP.
- **Category**: tech-debt
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

`KinematicController.solve()` (`packages/engine/src/planning/kinematics/controller.ts:144-401`) is ~250 lines of mechanically identical `updateSpring(...)` calls — one block per joint, repeated for two spring layers. `snapToTarget()` repeats the same 14 joints a third time. Adding a joint means hand-editing three sites; a typo in one key produces a silently wrong animation that only a trained eye catches. Collapsing to data-driven loops makes the joint sets explicit constants, shrinks the file by ~230 lines, and makes plan-level changes (new joints, per-joint stiffness) one-line edits. JS engines optimize the loop just as well as the unrolled form.

## Current state

- The full joint key union is `JointStateRecord` (controller.ts:11-31): 18 keys — `{r,l} × {Arm,Fore,Hand} × {X,Y,Z}`.
- **The two layers do NOT cover the same joints (this is the trap):**
  - Base layer (`solve()` part 1, lines 153–265, and `snapToTarget`, lines 121–135) updates exactly **14** joints — every key that exists in `SIGNING_REST` (lines 36–51): `rArmX, rArmY, rArmZ, rForeX, rForeY, rForeZ, rHandX, lArmX, lArmY, lArmZ, lForeX, lForeY, lForeZ, lHandX`. `rHandY/rHandZ/lHandY/lHandZ` are **not** base-driven (their rest is 0; motion-only).
  - Motion layer (`solve()` part 2, lines 269–398) updates exactly **16** joints: `rArmX, rArmY, rArmZ, rForeY, rForeZ, rHandX, rHandY, rHandZ, lArmX, lArmY, lArmZ, lForeY, lForeZ, lHandX, lHandY, lHandZ` — note **no `rForeX`/`lForeX`** (MotionDelta has no `rForeXDelta`/`lForeXDelta` fields — confirm in `src/planning/trajectories/types.ts` before starting).
- Each base call has the shape `this.updateSpring(this.baseState, K, t.K ?? SIGNING_REST.K, dt, this.baseStiffness, this.baseDamping)`; each motion call: `this.updateSpring(this.motionState, K, d?.KDelta ?? 0, dt, this.motionStiffness, this.motionDamping)`.
- `ArmTarget` (in `src/types.ts`) has optional fields matching the 14 base joints; `MotionDelta` (trajectories/types.ts) has `<key>Delta` fields matching the 16 motion joints.
- `updateSpring` (lines 441–453) and `synthesize` (403–439) are already loop-free helpers — leave `updateSpring` as-is; `synthesize` may stay unrolled (it's readable) — refactoring it is optional and NOT required.
- Characterization tests from plan 008 live at `src/planning/kinematics/controller.test.ts`, including the joint-set pinning test ("motion layer does not drive rForeX/lForeX").

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `cd packages/engine && bunx vitest run controller` | all pass, before AND after |
| Full suite | `cd packages/engine && bunx vitest run` | all pass |
| Typecheck | `bun run check-types` (root) | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `packages/engine/src/planning/kinematics/controller.ts`
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `src/math/smoothing.ts` (`springStep`) — the integrator is shared and correct.
- `src/planning/trajectories/**` — `MotionDelta`'s shape is the contract; do not "complete" it with rForeXDelta.
- `controller.test.ts` — if a test fails after your change, the CHANGE is wrong, not the test. The only permitted test edit is adding new cases.
- Spring constants, `SIGNING_REST` values, dt cap.

## Git workflow

- Branch: `advisor/009-kinematics-loop-refactor`
- Commit style: conventional commits, e.g. `refactor(engine): drive kinematic spring updates from joint tables`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm the safety net

`cd packages/engine && bunx vitest run controller` → all pass. Record the count. If the file does not exist, STOP (dependency unmet).

### Step 2: Define the joint tables

Near `SIGNING_REST`, add (deriving names from the lists in Current state — transcribe them from the live `solve()` body, not from this plan, and diff against the lists above; any discrepancy is a STOP condition):

```ts
// Joints driven by the base layer = exactly the keys of SIGNING_REST.
const BASE_JOINTS = Object.keys(SIGNING_REST) as Array<keyof typeof SIGNING_REST>;

// Joints driven by the motion layer (MotionDelta has a `<joint>Delta` field for each).
// NOTE: rForeX/lForeX are deliberately absent — MotionDelta cannot drive them.
const MOTION_JOINTS = [
  "rArmX", "rArmY", "rArmZ", "rForeY", "rForeZ", "rHandX", "rHandY", "rHandZ",
  "lArmX", "lArmY", "lArmZ", "lForeY", "lForeZ", "lHandX", "lHandY", "lHandZ",
] as const satisfies ReadonlyArray<keyof JointStateRecord>;
```

(`Object.keys(SIGNING_REST)` preserves the original update order for the base layer since `SIGNING_REST` lists keys in the same order `solve()` updates them — verify this by eye; if the orders differ, write `BASE_JOINTS` as an explicit literal array in `solve()`'s order instead. Order does not change math results here — springs are independent per joint — but keeping it identical removes any doubt.)

**Verify**: `bunx tsc --noEmit` (in `packages/engine`) → exit 0.

### Step 3: Replace the base-layer block in solve()

Replace lines ~150–265 (the 14 base `updateSpring` calls) with:

```ts
const t = this.currentTarget;
for (const key of BASE_JOINTS) {
  this.updateSpring(
    this.baseState,
    key,
    (t as Record<string, number | undefined>)[key] ?? SIGNING_REST[key],
    dt,
    this.baseStiffness,
    this.baseDamping,
  );
}
```

(If `ArmTarget`'s keys align exactly with `keyof typeof SIGNING_REST`, prefer the cast-free `t[key] ?? SIGNING_REST[key]` — try that first and only fall back to the indexed cast if tsc complains.)

**Verify**: `bunx vitest run controller` → all pass.

### Step 4: Replace the motion-layer block

Replace lines ~269–398 (the 16 motion calls) with:

```ts
const d = this.activeDelta;
for (const key of MOTION_JOINTS) {
  this.updateSpring(
    this.motionState,
    key,
    (d as Record<string, number | undefined> | null)?.[`${key}Delta`] ?? 0,
    dt,
    this.motionStiffness,
    this.motionDamping,
  );
}
```

(Same note: try the typed version first — `d?.[`${key}Delta` as keyof MotionDelta] ?? 0` — and use the loosest cast that compiles cleanly.)

**Verify**: `bunx vitest run controller` → all pass, including the rForeX pinning test.

### Step 5: Replace the snapToTarget repetition

Replace the 14 hard-set lines (121–135) with:

```ts
for (const key of BASE_JOINTS) {
  this.baseState[key].value =
    (target as Record<string, number | undefined>)[key] ?? SIGNING_REST[key];
}
```

Keep the velocity-zeroing loop below it unchanged.

**Verify**: `bunx vitest run controller` → all pass (snapToTarget case included).

### Step 6: Full gate

`cd packages/engine && bunx vitest run && cd ../.. && bun run check-types` → all green. `wc -l packages/engine/src/planning/kinematics/controller.ts` → roughly 230–260 lines (down from 458).

## Test plan

No new tests required — plan 008's characterization suite is the harness. Optional hardening: add one test that runs 1,000 random `(setTarget, setMotionDelta, solve)` sequences through both an old and new implementation... not feasible post-refactor; skip. If you want extra confidence BEFORE refactoring, copy the original class to a scratch file, run a randomized equivalence check old-vs-new locally, then delete the scratch file before committing (`git status` must be clean of it).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "updateSpring(" packages/engine/src/planning/kinematics/controller.ts` → 3 (one definition + two loop call sites)
- [ ] `grep -n "MOTION_JOINTS" packages/engine/src/planning/kinematics/controller.ts` → present, without `rForeX`/`lForeX` entries
- [ ] `cd packages/engine && bunx vitest run` exits 0, same-or-more tests than Step 1's count
- [ ] `bun run check-types` exits 0
- [ ] `git status --short` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `controller.test.ts` does not exist or fails before you change anything.
- The live `solve()` joint sets differ from the 14/16 lists in Current state (the file changed since planning) — re-derive the lists from the live code ONLY if the structure is otherwise identical; if the method was already refactored, mark this plan REJECTED ("fixed independently").
- `MotionDelta` in `trajectories/types.ts` turns out to HAVE `rForeXDelta`/`lForeXDelta` fields — the omission may have been a bug, not a design choice; pinning vs fixing is the maintainer's call. Report.
- Any characterization test fails after a step and you cannot make it pass by correcting your loop to match the original unrolled behavior.

## Maintenance notes

- Adding a joint is now: extend `JointStateRecord`, add its rest value to `SIGNING_REST` (base-driven) and/or its key to `MOTION_JOINTS` (motion-driven), extend `ArmTarget`/`MotionDelta`, extend `synthesize()`.
- Reviewer: diff the joint tables against the pre-refactor unrolled calls one key at a time — that's the entire correctness argument.
- The rForeX/lForeX asymmetry is now visible and documented in code; if trajectories ever need to drive forearm X, that's a deliberate `MotionDelta` extension.
