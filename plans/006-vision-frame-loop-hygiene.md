# Plan 006: Stop allocating an OffscreenCanvas per camera frame and stop swallowing frame-capture errors

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d114cc3..HEAD -- packages/runtime/src/runtime/vision-system.ts`
> This plan was written against the **working tree** (which contained
> uncommitted changes). Compare the "Current state" excerpts below against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-ci-baseline-and-green-typecheck.md
- **Category**: perf + bug
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

`VisionSystem.captureAndSend()` runs once per video frame (30–60 times per second while the camera is active). On every invocation it allocates a fresh `OffscreenCanvas` sized to the full video resolution (up to 1280×720) and a new 2D context — sustained allocation churn on the hottest path in the runtime, causing avoidable GC pauses that compete with the 60fps animation target the README promises. In the same method, a bare `catch {}` swallows *every* error (canvas creation, drawImage, createImageBitmap, worker postMessage) and silently continues the loop — camera/processor failures become undebuggable: the loop spins, the avatar shows nothing, and neither the developer console nor the `error` event carries any signal.

## Current state

- `packages/runtime/src/runtime/vision-system.ts:166-201` — the hot loop:

  ```ts
  private async captureAndSend(now: number) {
    if (this._status !== "active" || !this.videoEl) return;
    if (this.videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.queueNextFrame();
      return;
    }
    if (this.videoEl.currentTime === this.lastVideoTime) {
      this.queueNextFrame();
      return;
    }
    this.lastVideoTime = this.videoEl.currentTime;
    if (this.busy) {
      this.queueNextFrame();
      return;
    }
    this.busy = true;
    try {
      const { videoWidth: w, videoHeight: h } = this.videoEl;
      const canvas = new OffscreenCanvas(w, h);          // ← fresh allocation every frame
      const ctx = canvas.getContext("2d")!;
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.videoEl, 0, 0);
      const bitmap = await createImageBitmap(canvas);
      if (this._status !== "active") {
        bitmap.close();
        this.busy = false;
        return;
      }
      this.processor.process(bitmap, now);
      this.queueNextFrame();
    } catch {                                            // ← swallows everything
      this.busy = false;
      this.queueNextFrame();
    }
  }
  ```

- The class already has an `emit("error", message)` channel (see `start()` lines 96–102 and `setupProcessorHandlers` line 65–68) and an `"error"` key in `VisionEventMap`. Error reporting style to match (from `start()`):

  ```ts
  const message = err instanceof Error ? err.message : "Unable to start camera.";
  this.emit("error", message);
  ```

- The canvas's purpose: horizontal mirror (`translate`+`scale(-1,1)`) before shipping the bitmap to the MediaPipe worker. The bitmap is transferred (`process()` → `postMessage(..., [bitmap])` in `worker-hand-processor.ts:45-53`), so the **bitmap** cannot be reused — but the **canvas and context** can.

- `stop()` (lines 104–125) is where session resources are torn down; the cached canvas should be released there too (set to null; OffscreenCanvas has no close(), dropping the reference suffices).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `bun run check-types` (root) | exit 0          |
| Tests     | `bun run test`           | exit 0              |
| Manual smoke (optional, if a browser env exists) | `bun run dev:web`, open playground, enable camera | tracking works, no console errors |

## Scope

**In scope** (the only files you should modify):
- `packages/runtime/src/runtime/vision-system.ts`
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):
- `packages/runtime/src/capture/worker-hand-processor.ts` and the worker — the transfer protocol is correct.
- Frame-rate throttling / backpressure redesign — the `busy` flag mechanism stays as-is.
- `use-hand-tracking.ts` — plan 005's territory.

## Git workflow

- Branch: `advisor/006-vision-frame-loop-hygiene`
- Commit style: conventional commits, e.g. `perf(runtime): reuse capture canvas across frames; surface frame errors`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Cache the OffscreenCanvas and 2D context

Add two private fields near the other session fields (after `private busy = false;`):

```ts
private captureCanvas: OffscreenCanvas | null = null;
private captureCtx: OffscreenCanvasRenderingContext2D | null = null;
```

In `captureAndSend()`, replace the per-frame construction with reuse + resize-on-change. Note the mirror transform must be reset each frame since the context persists (`setTransform` replaces the old translate/scale pair):

```ts
const { videoWidth: w, videoHeight: h } = this.videoEl;
if (!this.captureCanvas || this.captureCanvas.width !== w || this.captureCanvas.height !== h) {
  this.captureCanvas = new OffscreenCanvas(w, h);
  this.captureCtx = this.captureCanvas.getContext("2d");
}
const ctx = this.captureCtx;
if (!ctx) {
  this.busy = false;
  this.queueNextFrame();
  return;
}
ctx.setTransform(-1, 0, 0, 1, w, 0); // mirror horizontally (replaces translate+scale)
ctx.drawImage(this.videoEl, 0, 0);
const bitmap = await createImageBitmap(this.captureCanvas);
```

`setTransform(-1, 0, 0, 1, w, 0)` is exactly equivalent to `translate(w, 0); scale(-1, 1)` but idempotent across frames. Keep the rest of the try block (status re-check, `bitmap.close()`, `process`, `queueNextFrame`) unchanged.

In `stop()`, release the cache (add near `this.stream = null;`):

```ts
this.captureCanvas = null;
this.captureCtx = null;
```

**Verify**: `bun run check-types` → exit 0. `grep -c "new OffscreenCanvas" packages/runtime/src/runtime/vision-system.ts` → 1 (only inside the resize branch).

### Step 2: Surface errors from the catch block

Replace the bare catch:

```ts
} catch (err) {
  this.busy = false;
  const message = err instanceof Error ? err.message : "Frame capture failed.";
  this.emit("error", message);
  this.queueNextFrame();
}
```

Deliberate choices: do **not** call `this.setStatus("error")` here (a single bad frame shouldn't kill the session — the loop continues, matching current behavior) and do not add a `console.error` (the `error` event is the package's reporting channel; `useHandTracking` already maps it to React state).

**Note on error-spam**: if a persistent failure occurs (e.g. video element detached), this will emit per frame. That is acceptable for now — consumers see a live error state instead of silence. If you want to be tidy, dedupe identical consecutive messages with a `private lastEmittedFrameError: string | null` field reset in `stop()`; this is optional.

**Verify**: `grep -n "catch {" packages/runtime/src/runtime/vision-system.ts` → no matches. `bun run check-types && bun run test` → exit 0.

## Test plan

- The runtime package has no test harness at planning time; do not create one here (plan 008 owns it). If plan 008 has already landed (check `plans/README.md`), add: a fake `HandProcessor` + stubbed `videoEl`/`OffscreenCanvas` test asserting that a `drawImage` throw causes one `error` event emission and the loop survives. Otherwise verification is typecheck + the greps above + (optional) the manual playground smoke test.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "new OffscreenCanvas" packages/runtime/src/runtime/vision-system.ts` → 1
- [ ] `grep -n "setTransform(-1" packages/runtime/src/runtime/vision-system.ts` → 1 match
- [ ] `grep -n "catch {" packages/runtime/src/runtime/vision-system.ts` → 0 matches
- [ ] `grep -n 'emit("error"' packages/runtime/src/runtime/vision-system.ts` → ≥3 matches (start, processor handler, frame catch)
- [ ] `bun run check-types` exits 0
- [ ] `bun run test` exits 0
- [ ] `git status --short` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `captureAndSend` no longer matches the excerpt (plan 005 or the in-flight refactor changed it) — re-read the live method; if the canvas-per-frame and bare-catch patterns are both gone, mark this plan REJECTED in the index with "fixed independently".
- TypeScript does not know `OffscreenCanvasRenderingContext2D` (lib config) — check `packages/runtime/tsconfig.json` / `@ikiraro/config`; if the DOM lib doesn't include it, report rather than adding lib entries.

## Maintenance notes

- If a future change introduces multiple concurrent capture sessions per VisionSystem (unlikely — `start()` guards against it), the single cached canvas assumption breaks.
- Reviewer: confirm the mirror orientation is unchanged (selfie-view flip) by running the playground camera — `setTransform` vs translate/scale equivalence is the one visually-verifiable risk.
- The `busy`-flag backpressure (frames dropped while the worker is processing) is intentional and unchanged; if frame-drop visibility is ever wanted, add a counter — deferred.
