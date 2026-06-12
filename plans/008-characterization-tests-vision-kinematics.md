# Plan 008: Characterization tests for the vision pipeline and the kinematics controller

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d114cc3..HEAD -- packages/engine/src/planning/kinematics/ packages/engine/src/vision/`
> This plan was written against the **working tree** (which contained
> uncommitted changes). Compare the "Current state" excerpts below against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1 (unblocks plan 009 and future vision work)
- **Effort**: L
- **Risk**: LOW (test-only; no production code changes allowed)
- **Depends on**: plans/001-ci-baseline-and-green-typecheck.md; coordinates with plans/004-engine-numeric-guards.md (if 004 landed, do not duplicate its test cases — check `packages/engine/src/vision/sign-all-recognizer.test.ts` first)
- **Category**: tests
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

The two systems the README's core claims rest on — sign recognition (vision) and dual-spring avatar motion (kinematics) — have zero test coverage. `packages/engine` has exactly 3 test files, all in `src/planning` (motion-paths, pose-library, renderer-director). The vision module was just rewritten in a large refactor and the 458-line `KinematicController` is slated for a mechanical refactor (plan 009) that is unsafe without behavioral pinning. Characterization tests capture **current** behavior — they are the safety net, not a spec; where current behavior looks wrong, record it in the test name (`"characterization: ..."`) rather than "fixing" it.

## Current state

All files are in `packages/engine/`. The test runner is vitest (`bunx vitest run` in the package; environment is default node — the existing tests mock browser globals where needed).

- **Exemplar test to model after**: `src/planning/renderer-director.test.ts` — mocks `requestAnimationFrame` in `beforeEach`, imports `"./index"` to initialize `LanguageRegistry`, builds inputs with real collaborators (`FrameBuilder`), uses `vi.fn()` canvases. Match its style: plain `describe`/`it`, no snapshot files, behavioral assertions.

- **`src/planning/kinematics/controller.ts`** — `KinematicController`:
  - `solve(dtMs)` caps dt at 100ms, converts to seconds, returns `synthesize()` if `dt <= 0`.
  - Two layers: `baseState` springs toward `currentTarget` joint values (fallback `SIGNING_REST`, stiffness 110 / damping 24); `motionState` springs toward `activeDelta` values (fallback 0, stiffness 240 / damping 34).
  - **Exact joint sets (load-bearing for plan 009)**: the base layer updates 14 joints (`rArmX/Y/Z, rForeX/Y/Z, rHandX, lArmX/Y/Z, lForeX/Y/Z, lHandX`); the motion layer updates 16 joints (`rArmX/Y/Z, rForeY/Z, rHandX/Y/Z, lArmX/Y/Z, lForeY/Z, lHandX/Y/Z`) — note motion has **no rForeX/lForeX**, base has **no rHandY/Z, lHandY/Z**.
  - `synthesize()` returns `{ rArm: {x,y,z}, rFore, rHand, lArm, lFore, lHand }` where each component = `baseState[key].value + motionState[key].value`.
  - `snapToTarget(target)` hard-sets the 14 base joints and zeroes ALL velocities in both layers.
  - `reset()` re-initializes both layers (base = SIGNING_REST values, motion = 0).
  - The spring integrator is `springStep` in `src/math/smoothing.ts:5-18` (semi-implicit Euler: `force = stiffness*(target-current); accel = force - damping*velocity; v' = v + accel*dt; x' = x + v'*dt`).

- **`src/vision/sign-all-recognizer.ts`** — `SignAllRecognizer` (171 lines): `process(worldLandmarks)` → normalize (wrist-origin, max-dist scale, rotate so wrist→middle-MCP is vertical) → 10-frame history window → per-dataset-entry pose similarity (weighted Euclidean; weight 3 on indices 4,8,12,16,20) blended 40/60 with motion similarity for motion signs → threshold 0.84. Constructor accepts a custom dataset: `new SignAllRecognizer(dataset)` — use this for deterministic tests instead of the real `ASL_CANONICAL_DATASET`. The `TrainedSign` type is in `src/vision/canonical-landmarks.ts` (read it for exact fields before writing tests).

- **`src/vision/linguistic-buffer.ts`** — `LinguisticBuffer` (129 lines): `update(sign, context)` state machine. Key behaviors: returns null while `context.isTransitioning`; commits via strategies on plateau (`velocity magnitude < 0.05` AND same sign held AND `now - lastSignTime > 150ms`); commits all on `sign === null` after `pauseThresholdMs` (default 1000ms) of silence following a current sign. **Time source is `performance.now()`** — tests must control it: `vi.spyOn(performance, "now").mockReturnValue(t)` and advance `t` manually (vitest fake timers do not patch `performance.now` unless configured with `vi.useFakeTimers({ toFake: ["performance"] })` — either approach is fine; pick one and use it consistently).
  - Constructor takes `{ strategies?, pauseThresholdMs? }` — inject a minimal fake strategy to test the buffer in isolation from `FingerspellStrategy`/`LexemeStrategy` internals. The strategy interface is in `src/vision/types.ts` (read it; it has `update(sign, context)`, optional `commit()`, `getInProgress?()`, `overrideLast?()`, `reset()`).

- **`src/vision/pipeline.ts`** — `SignDetectionPipeline` (73 lines): wires recognizer → buffer; `process()` returns committed `SignToken | null`; `tick()` drives timeout commits with no hand; `getBufferState()`, `reset()`. Constructor accepts `(recognizer?, bufferConfig?)` — inject fakes for both.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Run engine tests | `cd packages/engine && bunx vitest run` | all pass |
| Run one file | `cd packages/engine && bunx vitest run kinematics` | matching files pass |
| Typecheck | `bun run check-types` (root) | exit 0       |

## Scope

**In scope** (the only files you should create/modify):
- `packages/engine/src/planning/kinematics/controller.test.ts` (create)
- `packages/engine/src/vision/linguistic-buffer.test.ts` (create)
- `packages/engine/src/vision/pipeline.test.ts` (create)
- `packages/engine/src/vision/sign-all-recognizer.test.ts` (create, or **extend** if plan 004 already created it)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- ANY production source file. If a test reveals a bug, write the test as `it("characterization: <current behavior> (looks wrong — see note)")`, pin current behavior, and list it in your final report. Production fixes are separate plans.
- React/renderer/runtime test infrastructure — engine only.
- Coverage tooling/config.

## Git workflow

- Branch: `advisor/008-engine-characterization-tests`
- Commit style: conventional commits, e.g. `test(engine): characterize KinematicController spring behavior`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: KinematicController — `controller.test.ts`

Create `packages/engine/src/planning/kinematics/controller.test.ts`. No browser globals needed. Cases:

1. **Initial pose**: `new KinematicController().solve(0)` (dt ≤ 0 path) returns the rest pose — `rArm.x ≈ 0.76`, `rArm.z ≈ -0.52`, `rHand.y === 0` (motion-only joint at rest). Use `toBeCloseTo`.
2. **Convergence**: set `setTarget({ rArmX: 1.5 })`, call `solve(16)` 600 times (~10s simulated); assert `rArm.x` is within 0.01 of 1.5 and unspecified joints converged back to their SIGNING_REST values.
3. **dt cap**: `setTarget({ rArmX: 1.5 })` then a single `solve(10_000)` must behave exactly like `solve(100)` — create two controllers, drive one with each, assert identical `rArm.x` (the cap means giant dt does not explode). Also assert the result is finite.
4. **snapToTarget**: `snapToTarget({ rArmX: 2 })` → immediate `solve(0)` shows `rArm.x === 2` (no spring lag) and a subsequent `solve(16)` does not overshoot wildly (velocity was zeroed): `|rArm.x - 2| < 0.05`.
5. **Layer summing**: `snapToTarget({})` (base at rest, velocities zero), then `setMotionDelta({ rHandYDelta: 0.4 })` and ~600 × `solve(16)`; assert `rHand.y ≈ 0.4` (motion layer) and `rHand.x ≈ SIGNING_REST.rHandX` (base layer) — proving synthesis is base + motion.
6. **Joint-set pinning (the guard for plan 009)**: with `setMotionDelta` containing `rForeXDelta: 9 as any`-style junk — actually, read `MotionDelta` in `src/planning/trajectories/types.ts` first; if it has no `rForeXDelta` field, instead pin the set structurally: assert after heavy motion deltas on all available fields that `rFore.x` still equals its base-layer value (motion layer never moves rForeX). Name it `"characterization: motion layer does not drive rForeX/lForeX"`.
7. **reset()**: after arbitrary targets and solves, `reset()` then `solve(0)` returns the same pose as a fresh controller.

**Verify**: `bunx vitest run controller` → 7 tests pass.

### Step 2: LinguisticBuffer — `linguistic-buffer.test.ts`

Use a fake strategy + mocked `performance.now` (see Current state). Fake strategy sketch:

```ts
const makeStrategy = () => {
  let pending: string | null = null;
  return {
    update: vi.fn((sign: string, ctx: any) => {
      if (ctx.isPlateauReached) {
        const token = { type: "fingerspell", text: sign, durationMs: 100 } as any;
        return token;
      }
      pending = sign;
      return null;
    }),
    commit: vi.fn(() => (pending ? ({ type: "fingerspell", text: pending, durationMs: 100 } as any) : null)),
    getInProgress: () => pending ?? "",
    overrideLast: vi.fn(),
    reset: vi.fn(() => { pending = null; }),
  };
};
```

(Adjust to the real strategy interface in `src/vision/types.ts` — read it first.)

Cases:
1. `isTransitioning: true` → `update` returns null and does not touch strategies.
2. **Plateau commit**: same sign twice, stationary velocity (`{x:0,y:0,z:0}`), second call ≥150ms later → strategy `update` receives `isPlateauReached: true` and the buffer returns its token.
3. **No plateau while moving**: same sign held but velocity magnitude ≥ 0.05 → `isPlateauReached` stays false.
4. **Pause timeout commit**: a sign, then `update(null)` calls; before 1000ms → null; after >1000ms → `commit()` fires and its token is returned.
5. **`getState()`** reflects committed tokens (`sentenceText`) and in-progress word (`currentWord`).
6. **`clear()`** resets tokens and calls strategy `reset()`.

**Verify**: `bunx vitest run linguistic-buffer` → 6 tests pass.

### Step 3: SignAllRecognizer — deterministic-dataset tests

If plan 004 already created `sign-all-recognizer.test.ts`, EXTEND it; otherwise create it. Beyond 004's guard cases, add characterization with a custom 2-sign dataset (synthetic 21-point hands you construct, e.g. "FLAT" = all points on a line, "FIST" = all points clustered):

1. Feeding the exact "FLAT" landmark array → `sign === "FLAT"` with `confidence ≥ 0.84`.
2. Feeding a hand 50% scaled and translated → still matches "FLAT" (normalization invariance — this is the README's Procrustes claim; if it fails, pin actual behavior and flag it).
3. Feeding noise far from both → `sign === null`, `confidence === 0`.
4. **Velocity/isMoving**: two frames with wrist displaced > 0.08 after normalization → `isMoving === true`. (Note: velocity is computed on **normalized** landmarks — derive your fixture accordingly, or pin whatever the observed boundary is.)

**Verify**: `bunx vitest run sign-all-recognizer` → all pass.

### Step 4: SignDetectionPipeline — integration with fakes

`pipeline.test.ts`: inject a fake recognizer (scripted `ClassificationResult` sequence) and a real `LinguisticBuffer` with the fake strategy from Step 2 + mocked `performance.now`:

1. Recognizer returns stable sign + zero velocity over enough mocked time → `process()` eventually returns a committed token; `lastClassification` matches the recognizer output.
2. `tick()` after a pause beyond threshold → timeout-commits; `lastClassification` becomes null.
3. `reset()` clears recognizer (spy called), buffer state empty.

**Verify**: `bunx vitest run pipeline` → 3 tests pass.

### Step 5: Full gate

**Verify**: `cd packages/engine && bunx vitest run` → all green (≥ 12 pre-existing + ~20 new). `bun run check-types` → exit 0.

## Test plan

This plan IS the test plan. Counts above are minimums; prefer behavioral names. Every "looks wrong" discovery goes in the final report, not in a code change.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] Four test files exist at the in-scope paths
- [ ] `cd packages/engine && bunx vitest run` exits 0 with ≥30 total tests
- [ ] `git diff --stat` shows ZERO changes to non-test, non-plans files
- [ ] `bun run check-types` exits 0
- [ ] `plans/README.md` status row updated, and the report lists any pinned-but-suspicious behaviors

## STOP conditions

Stop and report back (do not improvise) if:

- Any module under test has a materially different API than the excerpts (the vision refactor moved again).
- Tests cannot be made deterministic because a module reads `performance.now()` in a way you cannot mock from vitest — report the call path instead of adding production seams.
- More than ~2 hours of effort lands on a single module without green tests — timebox, commit what passes, report what's left.

## Maintenance notes

- Plan 009 (kinematics loop refactor) MUST run after this and rely on Step 1's tests — especially case 6 (joint-set pinning).
- These are characterization tests: when intentional behavior changes land (e.g. new spring constants), updating them is expected; deleting them is not.
- Future runtime-package tests (audio queue, event bus) need a `test` script in `packages/runtime/package.json` + vitest devDep — deliberately out of scope here; copy this plan's structure when doing it.
