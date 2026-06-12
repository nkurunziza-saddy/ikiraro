# Plan 007: Make cloud TTS failures observable — speak() must reject instead of silently resolving

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat d114cc3..HEAD -- packages/renderer/src/web-speech.ts apps/web/src/routes/playground.tsx`
> This plan was written against the **working tree** (which contained
> uncommitted changes). Compare the "Current state" excerpts below against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED (callers that previously never saw rejections will now; all known call sites are listed below and must be checked)
- **Depends on**: plans/001-ci-baseline-and-green-typecheck.md
- **Category**: bug
- **Planned at**: commit `d114cc3`, 2026-06-10

## Why this matters

`WebSpeechProvider.speakElevenLabs()` and `speakOpenAI()` wrap their whole body in `try { ... } catch (err) { console.error(err); }`. Any failure — bad API key, network error, quota exhausted, undecodable audio — is logged and discarded, and `speak()` **resolves successfully**. Callers (including `speakQueue`, which awaits each item) cannot distinguish "spoke" from "failed", so apps can't show an error state, retry, or fall back to browser TTS. By contrast, `speakBrowser()` correctly rejects on `utterance.onerror`. Secondary issue: the thrown error messages embed the raw API response body (`ElevenLabs API error (${res.status}): ${errText}`), which can leak provider-internal details into UI surfaces; status code is enough for the message, with the body logged separately at debug level.

## Current state

- `packages/renderer/src/web-speech.ts:74-110` (ElevenLabs; OpenAI at 112-144 is structurally identical):

  ```ts
  private async speakElevenLabs(text: string, options: SpeakOptions): Promise<void> {
    this.cloudSpeaking = true;
    try {
      ...
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`ElevenLabs API error (${res.status}): ${errText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      if (!this.cloudSpeaking) return; // cancelled during fetch
      await this.playAudioBuffer(arrayBuffer, options);
    } catch (err) {
      console.error(err);            // ← swallowed; speak() resolves
    } finally {
      this.cloudSpeaking = false;
    }
  }
  ```

- `speak()` (lines 61–72) dispatches to the provider methods and returns their promise directly.

- `speakQueue()` (lines 204–211) awaits `speak()` in a loop with a `queueActive` flag — once `speak()` can reject, an unhandled rejection would escape the loop.

- Known `speak()` call sites outside the class (verified by grep at planning time):
  - `apps/web/src/routes/playground.tsx:42` — `(text) => tts.speak(text)` (a fire-and-forget callback; will need `.catch`).
  - `packages/runtime/src/audio/priority-queue.ts:62` — **different class** (`AudioQueue.speak`), not affected; do not modify.
  - Re-exported from sdk (`packages/sdk/src/index.ts:26` exports `WebSpeechProvider`) — external consumers exist; this is a behavior change to document in the changeset.

- Repo error-message convention for this file: `speakBrowser` rejects with `new Error("Speech synthesis failed: ${event.error}")` — short, single-line reason.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `bun run check-types` (root) | exit 0          |
| Tests     | `bun run test`           | exit 0              |
| Grep call sites | `grep -rn "\.speak(\|speakQueue(" packages apps/web/src --include="*.ts" --include="*.tsx" \| grep -v node_modules \| grep -v priority-queue` | review each hit |

## Scope

**In scope** (the only files you should modify):
- `packages/renderer/src/web-speech.ts`
- `apps/web/src/routes/playground.tsx` (add `.catch` at the call site)
- A changeset file under `.changeset/` (patch bump for the behavior change)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):
- `packages/runtime/src/audio/priority-queue.ts` — `AudioQueue.speak` is a different subsystem.
- Adding retry/fallback logic (e.g. cloud → browser fallback) — product decision, deferred.
- The `playAudioBuffer` resolve-on-`onended` flow — unchanged.

## Git workflow

- Branch: `advisor/007-tts-error-propagation`
- Commit style: conventional commits, e.g. `fix(renderer): propagate cloud TTS failures from speak()`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rethrow in both cloud speak methods and sanitize messages

In `speakElevenLabs` and `speakOpenAI`, change the catch to log-and-rethrow, and stop embedding response bodies in the Error message:

```ts
if (!res.ok) {
  const errText = await res.text().catch(() => "");
  console.error(`[Ikiraro:TTS] ElevenLabs ${res.status}:`, errText);
  throw new Error(`ElevenLabs TTS failed (HTTP ${res.status})`);
}
...
} catch (err) {
  console.error("[Ikiraro:TTS] ElevenLabs speech failed:", err);
  throw err;
} finally {
  this.cloudSpeaking = false;
}
```

Apply the same shape to `speakOpenAI` (with "OpenAI" in the strings). Keep the `if (!this.cloudSpeaking) return;` cancellation early-return — cancellation is not an error and must keep resolving.

**Verify**: `cd packages/renderer && bunx tsc --noEmit` → exit 0.

### Step 2: Make speakQueue stop on failure without unhandled rejections

`speakQueue` awaits `speak()` and will now propagate the rejection to its own caller — that is the desired behavior (queue aborts on failure), but make the flag cleanup exception-safe:

```ts
async speakQueue(texts: string[], options: SpeakOptions = {}): Promise<void> {
  this.queueActive = true;
  try {
    for (const text of texts) {
      if (!this.queueActive) break;
      await this.speak(text, options);
    }
  } finally {
    this.queueActive = false;
  }
}
```

**Verify**: `grep -A8 "async speakQueue" packages/renderer/src/web-speech.ts` shows the try/finally.

### Step 3: Handle the rejection at the playground call site

`apps/web/src/routes/playground.tsx:42` currently passes `(text) => tts.speak(text)`. Read the surrounding code first to see how errors are surfaced in that component (look for an existing error state or toast). If there is an obvious error setter in scope, use it; otherwise:

```ts
(text) => void tts.speak(text).catch((err) => console.error("TTS failed:", err))
```

**Verify**: `cd apps/web && bun run check-types` → exit 0.

### Step 4: Sweep remaining call sites and add the changeset

Run the call-site grep from "Commands you will need". For each `WebSpeechProvider`-instance `speak()`/`speakQueue()` call not yet handled: if it `await`s inside a try/catch or returns the promise to a caller that handles it, leave it; if it's fire-and-forget, append `.catch(...)` as in Step 3.

Create `.changeset/tts-error-propagation.md`:

```md
---
"@ikiraro/sdk": patch
---

WebSpeechProvider.speak() and speakQueue() now reject when cloud TTS (ElevenLabs/OpenAI) fails instead of resolving silently. Wrap fire-and-forget calls in .catch().
```

(Note: only `@ikiraro/sdk` and `@ikiraro/engine` are publishable; the renderer change ships to consumers through the sdk bundle. If `changeset` complains about bumping a private package, bump only the sdk as shown.)

**Verify**: `bun run check-types && bun run test` (root) → exit 0.

## Test plan

- The renderer package has no test infrastructure at planning time — do not create it here. The machine-checkable gates are the greps + typecheck.
- If a renderer test harness exists by execution time (check `packages/renderer/package.json` for a `test` script), add: mock `fetch` returning `{ ok: false, status: 401 }`, call `speak("hi")` with provider `elevenlabs` + apiKey set, assert the promise rejects with a message containing `HTTP 401` and NOT containing the mocked response body text.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "throw err" packages/renderer/src/web-speech.ts` → 2 (one per cloud method)
- [ ] `grep -n 'errText}\`' packages/renderer/src/web-speech.ts` → 0 matches (response bodies no longer embedded in Error messages)
- [ ] `grep -A8 "async speakQueue" packages/renderer/src/web-speech.ts` contains `finally`
- [ ] Playground call site handles rejection (grep `tts.speak` in `apps/web/src/routes/playground.tsx` shows a `.catch`)
- [ ] A changeset file exists for the behavior change
- [ ] `bun run check-types` exits 0; `bun run test` exits 0
- [ ] `git status --short` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `web-speech.ts` no longer matches the excerpts (refactored since planning).
- The call-site grep reveals `speak()` callers inside `packages/runtime` or `packages/sdk` source (not just re-exports) — those integrations may depend on never-rejecting behavior; list them and stop.
- The changeset tooling refuses the patch bump in a way the note in Step 4 doesn't resolve.

## Maintenance notes

- This is a **consumer-visible behavior change** for anyone using `WebSpeechProvider` from the sdk: previously-silent failures now reject. The changeset documents it; the release notes should call it out.
- A sensible follow-up (deferred): automatic fallback to `speakBrowser()` when a cloud provider fails, behind an opt-in config flag.
- Reviewer: check that cancellation (`cancel()` during fetch → `cloudSpeaking` false → early `return`) still resolves rather than rejects — cancellation is success, not failure.
