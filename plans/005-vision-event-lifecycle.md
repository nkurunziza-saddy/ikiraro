# Plan 005: Give the vision event stack unsubscribe semantics and fix the hook's listener accumulation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d114cc3..HEAD -- packages/engine/src/vision/types.ts packages/runtime/src/runtime/vision-system.ts packages/runtime/src/capture/worker-hand-processor.ts packages/runtime/src/react/use-hand-tracking.ts`
> This plan was written against the **working tree** (which contained
> uncommitted changes). Compare the "Current state" excerpts below against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (additive API change — return values where `void` was returned)
- **Depends on**: plans/001-ci-baseline-and-green-typecheck.md
- **Category**: bug
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

The vision event stack has no way to unregister listeners: `VisionSystem.on()` returns `void`, and `WorkerHandProcessor.onResult/onError/onReady` add callbacks to `Set`s that nothing ever clears (even `dispose()` leaves them populated). The React hook `useHandTracking` registers five listeners in an effect whose cleanup only calls `vision.stop()` / `processor.dispose()` — so whenever the effect re-runs (React StrictMode double-invocation in dev, or any future dep change), listeners accumulate on the same memoized instances: state setters fire multiple times per frame event, and old closures are retained. The repo already has the correct pattern in `EventBus.on()` (returns an unsubscribe function); this plan extends that pattern to `VisionSystem`, `WorkerHandProcessor`, the `HandProcessor` interface that defines their contract, and the hook's cleanup.

## Current state

- `packages/engine/src/vision/types.ts:79-87` — the `HandProcessor` interface (the contract both classes implement against):

  ```ts
  export interface HandProcessor {
    ...
    onResult(cb: (tracking: import("../types").CameraTrackingState) => void): void;
    onError(cb: (error: string) => void): void;
    onReady(cb: (delegate: "GPU" | "CPU") => void): void;
  }
  ```

- `packages/runtime/src/runtime/vision-system.ts:135-142` — `on()` returns void, `off()` exists:

  ```ts
  on<K extends keyof VisionEventMap>(event: K, handler: (data: VisionEventMap[K]) => void): void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler);
    this.handlers.set(event, set);
  }
  off<K extends keyof VisionEventMap>(event: K, handler: (data: VisionEventMap[K]) => void): void {
    this.handlers.get(event)?.delete(handler);
  }
  ```

- `packages/runtime/src/capture/worker-hand-processor.ts:62-78` — `dispose()` doesn't clear handler sets; `onX` return void:

  ```ts
  dispose(): void {
    this.worker?.postMessage({ type: "dispose" } satisfies MainToWorkerMessage);
    this.worker?.terminate();
    this.worker = null;
    this.frameId = 0;
    globalResourceRegistry.unregister(this);
  }
  onResult(cb: (tracking: CameraTrackingState) => void): void {
    this.resultHandlers.add(cb);
  }
  onError(cb: (error: string) => void): void {
    this.errorHandlers.add(cb);
  }
  onReady(cb: (delegate: "GPU" | "CPU") => void): void {
    this.readyHandlers.add(cb);
  }
  ```

- `packages/runtime/src/react/use-hand-tracking.ts:31-56` — the effect registers 1 processor + 4 vision listeners, cleanup doesn't remove them:

  ```ts
  useEffect(() => {
    processor.onReady((d: "GPU" | "CPU") => { ... });
    vision.on("status-change", (s: VisionStatus) => { setIsActive(s === "active"); });
    vision.on("fps-update", (f: number) => setFps(f));
    vision.on("error", (e: string) => setError(e));
    vision.on("tracking-update", (t: CameraTrackingState) => {
      startTransition(() => { setTracking(t); });
    });
    processor.init().catch((err) => { ... });
    return () => {
      vision.stop();
      processor.dispose();
    };
  }, [vision, processor]);
  ```

- **The repo's exemplar pattern to match** — `packages/runtime/src/runtime/event-bus.ts:17-28`:

  ```ts
  on<K extends keyof EventRegistry>(type: K, handler: (event: IkiraroEvent<K>) => void): () => void {
    const typeStr = type as string;
    const set = this.handlers.get(typeStr) ?? new Set();
    set.add(handler as (event: IkiraroEvent<any>) => void);
    this.handlers.set(typeStr, set);
    return () => {
      this.handlers.get(typeStr)?.delete(handler as (event: IkiraroEvent<any>) => void);
    };
  }
  ```

- Other implementors of `HandProcessor`: search `implements HandProcessor` across `packages/` — at planning time only `WorkerHandProcessor` implements it, but verify (`grep -rn "implements HandProcessor" packages/ --include="*.ts"`).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `bun run check-types` (repo root) | exit 0, all 6 packages |
| Tests     | `bun run test`           | exit 0              |
| Find implementors | `grep -rn "implements HandProcessor" packages/ --include="*.ts"` | list to update |

## Scope

**In scope** (the only files you should modify):
- `packages/engine/src/vision/types.ts` (HandProcessor interface return types)
- `packages/runtime/src/runtime/vision-system.ts` (`on()` return type)
- `packages/runtime/src/capture/worker-hand-processor.ts` (`onX` return types, `dispose()` clearing)
- `packages/runtime/src/react/use-hand-tracking.ts` (effect cleanup)
- Any other `implements HandProcessor` class found by the grep above
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):
- `packages/runtime/src/runtime/event-bus.ts` — it's the exemplar; already correct.
- `packages/runtime/src/runtime/core.ts` and plugin lifecycle — separate system.
- The `useMemo`-based construction of `processor`/`vision` in the hook — changing instance lifecycle (e.g. to refs) is a bigger refactor; this plan only fixes listener cleanup.
- `holistic-landmarker.worker.ts` — worker internals unchanged.

## Git workflow

- Branch: `advisor/005-vision-event-lifecycle`
- Commit style: conventional commits, e.g. `fix(runtime): return unsubscribe functions from vision event registration`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Update the HandProcessor contract

In `packages/engine/src/vision/types.ts`, change the three callback registrations to return an unsubscribe function:

```ts
onResult(cb: (tracking: import("../types").CameraTrackingState) => void): () => void;
onError(cb: (error: string) => void): () => void;
onReady(cb: (delegate: "GPU" | "CPU") => void): () => void;
```

**Verify**: `bun run check-types` now FAILS in `packages/runtime` (implementors don't match yet) — that failure list is your worklist; confirm it contains `worker-hand-processor.ts` and nothing unexpected.

### Step 2: Update WorkerHandProcessor

In `packages/runtime/src/capture/worker-hand-processor.ts`:

```ts
onResult(cb: (tracking: CameraTrackingState) => void): () => void {
  this.resultHandlers.add(cb);
  return () => this.resultHandlers.delete(cb);
}
onError(cb: (error: string) => void): () => void {
  this.errorHandlers.add(cb);
  return () => this.errorHandlers.delete(cb);
}
onReady(cb: (delegate: "GPU" | "CPU") => void): () => void {
  this.readyHandlers.add(cb);
  return () => this.readyHandlers.delete(cb);
}
```

And clear the sets in `dispose()` (after `terminate()`):

```ts
this.resultHandlers.clear();
this.errorHandlers.clear();
this.readyHandlers.clear();
```

**Caution**: `VisionSystem.setupProcessorHandlers()` (called from its constructor) registers `processor.onResult(...)` and `processor.onError(...)` once per VisionSystem. Clearing on `dispose()` is correct because the hook disposes processor and discards the VisionSystem together. Do not clear inside `init()`.

**Verify**: `cd packages/runtime && bunx tsc --noEmit` → errors remaining only in files not yet updated (next steps), or exit 0.

### Step 3: Update VisionSystem.on()

In `packages/runtime/src/runtime/vision-system.ts`, mirror `EventBus.on`:

```ts
on<K extends keyof VisionEventMap>(
  event: K,
  handler: (data: VisionEventMap[K]) => void,
): () => void {
  const set = this.handlers.get(event) ?? new Set();
  set.add(handler);
  this.handlers.set(event, set);
  return () => {
    this.handlers.get(event)?.delete(handler);
  };
}
```

Keep `off()` — it's public API; removing it is out of scope.

**Verify**: `cd packages/runtime && bunx tsc --noEmit` → exit 0 (or only `use-hand-tracking.ts` remaining if it now misuses returns — proceed to Step 4).

### Step 4: Capture and call unsubscribes in useHandTracking

In `packages/runtime/src/react/use-hand-tracking.ts`, collect every registration's return value and call them in cleanup, before `stop()`/`dispose()`:

```ts
useEffect(() => {
  const subs = [
    processor.onReady((d: "GPU" | "CPU") => {
      setDelegate(d);
      setIsReady(true);
      setError(null);
    }),
    vision.on("status-change", (s: VisionStatus) => {
      setIsActive(s === "active");
    }),
    vision.on("fps-update", (f: number) => setFps(f)),
    vision.on("error", (e: string) => setError(e)),
    vision.on("tracking-update", (t: CameraTrackingState) => {
      startTransition(() => {
        setTracking(t);
      });
    }),
  ];
  processor.init().catch((err) => {
    setError(err instanceof Error ? err.message : "Failed to initialize worker");
  });
  return () => {
    for (const unsub of subs) unsub();
    vision.stop();
    processor.dispose();
  };
}, [vision, processor]);
```

**Verify**: `bun run check-types` (root) → exit 0 for all packages. `bun run test` → all pass.

### Step 5: Check for other registration call sites

`grep -rn "\.onResult(\|\.onReady(\|\.onError(\|vision\.on(" packages/ apps/web/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v worker-hand-processor.ts | grep -v vision-system.ts`

For each hit outside the files already updated: callers that ignore the new return value are fine (the change is backward-compatible at call sites); only update call sites that should clean up, i.e. inside React effects or disposable classes. At planning time the known callers are `use-hand-tracking.ts` (Step 4) and `VisionSystem.setupProcessorHandlers` (constructor-scoped, lives as long as the system — leave as-is).

**Verify**: grep output reviewed; any newly-updated file passes `bun run check-types`.

## Test plan

- The runtime package has no test script at planning time (`packages/runtime/package.json` has no `"test"`). Do NOT add test infrastructure in this plan (plan 008 owns that). Verification here is typecheck + existing engine tests + the behavioral greps in Done criteria.
- If plan 008 has already landed when you execute (check `plans/README.md`), add one test to its runtime suite: register a handler on `VisionSystem`, call the returned unsubscribe, emit via a fake processor, assert the handler was not called.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "): () => void" packages/engine/src/vision/types.ts` → ≥3 matches (the three onX methods)
- [ ] `grep -A2 "onResult(cb" packages/runtime/src/capture/worker-hand-processor.ts | grep -c "return ()"` → 1
- [ ] `grep -n "resultHandlers.clear()" packages/runtime/src/capture/worker-hand-processor.ts` → 1 match inside dispose
- [ ] `grep -n "const subs" packages/runtime/src/react/use-hand-tracking.ts` → 1 match, and cleanup calls the unsubscribes
- [ ] `bun run check-types` exits 0
- [ ] `bun run test` exits 0
- [ ] `git status --short` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The grep in Step 1's verify reveals implementors of `HandProcessor` other than `WorkerHandProcessor` that you cannot update with the same mechanical pattern (e.g. a class in `apps/web` or the sdk with different semantics).
- `VisionEventMap` or `HandProcessor` has moved out of `packages/engine/src/vision/types.ts` (the vision module is mid-refactor).
- Updating the interface breaks `packages/sdk` dts generation or the web app's typecheck in a way the pattern above doesn't fix.

## Maintenance notes

- Convention now repo-wide: **every** callback-registration method returns an unsubscribe function (`EventBus`, `RendererDirector.subscribe`, `VisionSystem`, `HandProcessor`). New event sources should follow it; reviewers should flag any `on*(): void` in PRs.
- The hook still constructs `WorkerHandProcessor`/`VisionSystem` in `useMemo`, which React may re-run; the worker itself is only spawned in `init()`, so this is acceptable — but if a worker-per-render leak is ever observed, the fix is moving construction into the effect (deferred deliberately).
- Plan 006 touches `vision-system.ts` too (different method, `captureAndSend`) — execute in either order, but rebase carefully if run concurrently.
