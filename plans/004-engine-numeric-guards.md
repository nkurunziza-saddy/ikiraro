# Plan 004: Guard the engine's numeric edge cases — NaN/infinite-recursion in looped playback, landmark bounds, zero-division in speech scaling

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d114cc3..HEAD -- packages/engine/src/planning/renderer-director.ts packages/engine/src/vision/sign-all-recognizer.ts packages/engine/src/planning/tokenizer.ts`
> This plan was written against the **working tree** (which contained
> uncommitted changes). Compare the "Current state" excerpts below against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-ci-baseline-and-green-typecheck.md (green baseline to verify against)
- **Category**: bug
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

Three numeric edge cases in `@ikiraro/engine` (a published package) can corrupt state at runtime:

1. **Worst**: `RendererDirector.updateStateFromTime()` does `this.state.time %= totalTime` and then calls itself recursively. If every queued frame has `duration === 0`, `totalTime` is `0`, the modulo produces `NaN`, the recursive call can never find a frame (`NaN >= totalTime` is false), and the function recurses until the stack overflows — a hard crash in the animation loop when `loop: true` is set.
2. `SignAllRecognizer.process()` only rejects **empty** landmark arrays, then `normalizeAndAlign()` immediately dereferences `landmarks[0]!` and `landmarks[9]!`. MediaPipe hands have 21 landmarks, but this is a public API (`SignRecognizer` is exported); any shorter array crashes or silently propagates NaN through every similarity score. `calculateMotionSimilarity()` similarly trusts `trained.motionLandmarkIndex!` as a valid index into history frames.
3. `buildPlanFromGloss()` divides by `totalBaseMs`, which is `0` when the token list is empty — `Infinity` is then silently clamped to a 2.0× scale applied to nothing meaningful.

All three are small defensive guards with clean unit-test verification.

## Current state

- `packages/engine/src/planning/renderer-director.ts:102-127` — the playback state machine:

  ```ts
  private updateStateFromTime() {
    if (this.queue.length === 0) return;
    let totalTime = 0;
    let found = false;
    for (let i = 0; i < this.queue.length; i++) {
      const frame = this.queue[i]!;
      if (this.state.time >= totalTime && this.state.time < totalTime + frame.duration) {
        ...
        found = true;
        break;
      }
      totalTime += frame.duration;
    }
    if (!found) {
      if (this.options.loop) {
        this.state.time %= totalTime;        // ← NaN when totalTime === 0
        this.updateStateFromTime();          // ← then infinite recursion
      } else {
        this.state.time = totalTime;
        this.state.frameIndex = this.queue.length - 1;
        this.state.progress = 1;
        this.pause();
      }
    }
  }
  ```

- `packages/engine/src/vision/sign-all-recognizer.ts:25-32` and `79-81`:

  ```ts
  process(worldLandmarks: HandLandmarks, _imageLandmarks?: HandLandmarks): ClassificationResult {
    if (worldLandmarks.length === 0) {
      this.history = [];
      return this.noMatch();
    }
    const normalized = this.normalizeAndAlign(worldLandmarks);
    ...
  private normalizeAndAlign(landmarks: HandLandmarks): HandLandmarks {
    const wrist = landmarks[0]!;
    const middleBase = landmarks[9]!;
  ```

  And `:128-132`:

  ```ts
  private calculateMotionSimilarity(trained: TrainedSign): number {
    if (this.history.length < 3 || !trained.motionSignature) return 0;
    const index = trained.motionLandmarkIndex!;
    const livePath = this.history.map(h => h[index]!);
  ```

- `packages/engine/src/planning/tokenizer.ts:88-92` (inside `buildPlanFromGloss`):

  ```ts
  if (intake && intake.durationSeconds) {
    const totalSpeechMs = intake.durationSeconds * 1000;
    const totalBaseMs = tokens.reduce((acc, t) => acc + t.durationMs, 0);
    const scale = Math.min(2.0, Math.max(0.5, totalSpeechMs / totalBaseMs));
  ```

- Conventions: no exceptions on hot paths — degrade to a safe no-op/`noMatch()` result, matching the existing style (`SignAllRecognizer.noMatch()`, the early `return` in `updateStateFromTime`). Tests use vitest, colocated as `<name>.test.ts` next to the source; model new tests after `packages/engine/src/planning/renderer-director.test.ts` (it mocks `requestAnimationFrame` in `beforeEach` and builds queues with `FrameBuilder` — see its lines 1–45).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `cd packages/engine && bunx tsc --noEmit` | exit 0 |
| Tests     | `cd packages/engine && bunx vitest run` | all pass (12 existing + new) |
| Full gate | `bun run check-types && bun run test` (repo root) | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `packages/engine/src/planning/renderer-director.ts`
- `packages/engine/src/vision/sign-all-recognizer.ts`
- `packages/engine/src/planning/tokenizer.ts`
- `packages/engine/src/planning/renderer-director.test.ts` (add cases)
- `packages/engine/src/vision/sign-all-recognizer.test.ts` (create)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):
- `packages/engine/src/planning/frame-builder.ts` — preventing zero-duration frames upstream is a behavior change; this plan makes the director robust instead.
- `packages/engine/src/vision/canonical-landmarks.ts` — do not edit the dataset; validate at use-site.
- `packages/engine/src/vision/quality.ts` — already guards `length < 21`.
- Any refactor of the recognizer's matching math.

## Git workflow

- Branch: `advisor/004-engine-numeric-guards`
- Commit style: conventional commits, e.g. `fix(engine): guard zero-duration loop playback against NaN recursion`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Guard the loop modulo in RendererDirector

In `updateStateFromTime()`, change the loop branch to bail out when `totalTime` is not positive:

```ts
if (!found) {
  if (this.options.loop && totalTime > 0) {
    this.state.time %= totalTime;
    this.updateStateFromTime();
  } else {
    this.state.time = totalTime;
    this.state.frameIndex = this.queue.length - 1;
    this.state.progress = 1;
    this.pause();
  }
}
```

(The non-loop branch already handles the degenerate case safely: time pinned to `totalTime` (0), last frame index, paused.)

**Verify**: `cd packages/engine && bunx vitest run renderer-director` → existing tests still pass.

### Step 2: Add regression tests for Step 1

In `packages/engine/src/planning/renderer-director.test.ts`, add a test: construct a `RendererDirector` with the existing `mockCanvas`, call `director.setOptions({ loop: true })`, then `director.setQueue([{ duration: 0, ... }])` — build the frame the same way other tests do, or hand-construct a minimal `FrameItem` cast `as any` if `FrameBuilder` never emits zero durations — then `director.seek(100)`. Assert:

- `director.getState().time` is a finite number (`Number.isFinite(...)` → true), and
- the call returns (no stack overflow), and `getState().isPlaying` is `false`.

**Verify**: `bunx vitest run renderer-director` → all pass including the new test. To prove the test bites, temporarily revert the Step 1 guard and confirm the new test crashes/fails, then re-apply.

### Step 3: Bound-check landmarks in SignAllRecognizer

In `process()`, replace the empty-array check with a minimum-length check (MediaPipe hand landmarks are always 21 points; index 9 is the middle-finger MCP used for alignment):

```ts
if (worldLandmarks.length < 21) {
  this.history = [];
  return this.noMatch();
}
```

In `calculateMotionSimilarity()`, guard the dataset index before mapping:

```ts
const index = trained.motionLandmarkIndex!;
if (index < 0 || this.history.some((h) => index >= h.length)) return 0;
```

(History entries are normalized copies of the input, so after the `process()` guard they all have ≥21 points; this guard protects against a malformed `motionLandmarkIndex` in a custom dataset.)

**Verify**: `cd packages/engine && bunx tsc --noEmit` → exit 0.

### Step 4: Create sign-all-recognizer.test.ts

Create `packages/engine/src/vision/sign-all-recognizer.test.ts` (vitest, same header style as `renderer-director.test.ts` but no RAF mock needed). Helper: a function making a 21-point landmark array, e.g. `const hand = (n = 21) => Array.from({ length: n }, (_, i) => ({ x: i * 0.01, y: i * 0.02, z: 0 }));`

Cases:
1. `process([])` returns the no-match shape (`sign: null`, `confidence: 0`, `isMoving: false`, `candidates: []`).
2. `process(hand(5))` (fewer than 21 points) returns no-match and does **not** throw.
3. `process(hand(21))` returns a `ClassificationResult` whose `confidence` is a finite number ≥ 0 (`Number.isFinite`).
4. Motion-index guard: construct the recognizer with a custom dataset entry `{ name: "BAD", landmarks: hand(21), motionSignature: [{x:0,y:0}, {x:0.1,y:0}, {x:0.2,y:0}], motionLandmarkIndex: 99 }` (match the `TrainedSign` type in `packages/engine/src/vision/canonical-landmarks.ts` — read it first for exact field shapes), call `process(hand(21))` three times (to fill history past the `< 3` check), assert the result confidence is finite and no throw.
5. `reset()` clears history: after several `process(hand(21))` calls, `reset()`, then one `process(hand(21))` → `isMoving === false`.

**Verify**: `bunx vitest run sign-all-recognizer` → 5 new tests pass.

### Step 5: Guard the zero-division in tokenizer

In `buildPlanFromGloss()`, only apply speech-duration scaling when there is something to scale:

```ts
if (intake && intake.durationSeconds) {
  const totalSpeechMs = intake.durationSeconds * 1000;
  const totalBaseMs = tokens.reduce((acc, t) => acc + t.durationMs, 0);
  if (totalBaseMs > 0) {
    const scale = Math.min(2.0, Math.max(0.5, totalSpeechMs / totalBaseMs));
    for (const token of tokens) {
      if (token.type !== "pause") {
        token.durationMs = Math.round(token.durationMs * scale);
      }
    }
  }
}
```

**Verify**: `cd packages/engine && bunx tsc --noEmit && bunx vitest run` → exit 0, all tests pass.

## Test plan

- New: zero-duration looped playback regression (Step 2), 5 recognizer cases (Step 4).
- Pattern: `packages/engine/src/planning/renderer-director.test.ts`.
- The tokenizer guard is covered transitively by the full suite; a dedicated tokenizer test is optional — add one only if a `tokenizer.test.ts` already exists by the time you execute (it does not at planning time).
- Verification: `cd packages/engine && bunx vitest run` → 12 existing + ≥6 new tests, all green.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "totalTime > 0" packages/engine/src/planning/renderer-director.ts` → 1 match
- [ ] `grep -n "length < 21" packages/engine/src/vision/sign-all-recognizer.ts` → 1 match
- [ ] `grep -n "totalBaseMs > 0" packages/engine/src/planning/tokenizer.ts` → 1 match
- [ ] `packages/engine/src/vision/sign-all-recognizer.test.ts` exists with ≥5 tests
- [ ] `cd packages/engine && bunx vitest run` exits 0, ≥18 tests passing
- [ ] `bun run check-types` exits 0 (repo root)
- [ ] `git status --short` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any excerpt in "Current state" no longer matches the live file.
- The `TrainedSign` type in `canonical-landmarks.ts` has a materially different shape than the test in Step 4 assumes (e.g. no `motionLandmarkIndex` field) — the vision refactor may have moved on; report the actual shape.
- Existing tests fail BEFORE you make any change (baseline is broken).
- You find call sites that **rely** on `process()` accepting partial hands (search `process(` under `packages/runtime/src/workers/` first) — report before changing the contract.

## Maintenance notes

- If `FrameBuilder` is later changed to guarantee `duration > 0` on every frame, the Step 1 guard becomes belt-and-braces — keep it anyway; the director is a public export (`RendererDirector` is re-exported from `@ikiraro/sdk`).
- Plan 008 (characterization tests) adds broader coverage around these same modules; its executor should not duplicate the cases added here.
- Reviewer: scrutinize that the 21-landmark minimum matches what the MediaPipe holistic worker actually emits (`packages/runtime/src/workers/holistic-landmarker.worker.ts`) — hands are 21 points in MediaPipe's hand model; if the worker ever sends pose/face landmark arrays through this path, the guard threshold needs revisiting.
