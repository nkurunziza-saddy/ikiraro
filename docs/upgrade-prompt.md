# Ikiraro SDK Upgrade Prompt

> Paste this entire file as your opening message to a new Claude Code session
> in the project you want to upgrade. Claude will install the skill, read it,
> and work through the upgrade end-to-end.

---

You are upgrading this project to `@ikiraro/sdk@0.4.1` and `@ikiraro/engine@0.2.0`.

## Step 1 — Install the skill

Run this first so you have the full SDK reference available:

```bash
npx ikiraro-sdk
```

This copies `SKILL.md` and `references/` into `.agents/skills/ikiraro-sdk/` and
`.claude/skills/ikiraro-sdk/`. Read `SKILL.md` and `references/api_reference.md`
before touching any code — the skill is your primary source of truth for every
hook signature, type, and pattern.

## Step 2 — What changed (0.3.x → 0.4.1)

**No breaking changes.** All additions are additive.

| Change | Detail |
|--------|--------|
| `@ikiraro/engine` `0.1.2 → 0.2.0` | Landing avatar now accepts real `TranslationEnvelope`s. `buildPlanFromUnits` + `createEnvelope` are the idiomatic way to build envelopes without the runtime. |
| Skill bundled in SDK | `npx ikiraro-sdk` installs the Claude Code skill locally after `bun add @ikiraro/sdk`. |
| Accessibility system fully documented | `useAccessibilityMode`, `AudioQueue`, `EarconPlayer`, `AccessibilityShortcutManager` — all stable, all exported from `@ikiraro/sdk`. |

## Step 3 — Upgrade the dependency

```bash
bun add @ikiraro/sdk@0.4.1
# or
npm install @ikiraro/sdk@0.4.1
```

Then verify:

```bash
bun run check-types   # or: npx tsc --noEmit
bun run test          # run test suite
bun run build         # confirm production build
```

Fix any type errors before continuing.

## Step 4 — Audit the codebase

Search for these patterns and update them if found:

### 4a. `envelope={null}` on AvatarViewer at module level

If the avatar is being shown without any signs (static idle), that is fine.
But if you have a cycling demo or hero section that was meant to animate,
replace `null` with a real envelope built from `buildPlanFromUnits`:

```typescript
import { buildPlanFromUnits, createEnvelope } from "@ikiraro/engine/planning";

// Build once at module level — synchronous, no network call
const helloEnvelope = createEnvelope(buildPlanFromUnits(["HELLO"]));

// Pass to AvatarViewer
<AvatarViewer envelope={helloEnvelope} modelUrl="/models/avatar.glb" />
```

Known ASL lexemes with full pose + motion data: `HELLO`, `GOOD`, `SIGN`,
`THANK-YOU`, `HELP`, `PLEASE`, `LOVE`, `HELLO`, `PLEASE`, `HOW`, `SEE`, `WHO`,
`WHEN`, `GO`, `BAD`, `AGAIN`, `FAMILY`, `DOCTOR`, `MEDICINE`, `INTERPRETER`.
Everything else is fingerspelled automatically.

### 4b. Hardcoded text labels on top of AvatarViewer

If you added a `<span>` or overlay showing the sign name for debugging,
remove it. The avatar motion itself communicates the sign.

### 4c. Missing accessibility gates

If the app plays TTS or shows the avatar without checking the accessibility mode,
add the gates:

```typescript
import { useAccessibilityMode } from "@ikiraro/sdk";

const { isAvatarSuppressed, isTtsSuppressed } = useAccessibilityMode();

// Gate the avatar
{!isAvatarSuppressed && <AvatarViewer ... />}

// Gate TTS
if (!isTtsSuppressed) queue.speak(text, "normal");
```

### 4d. Unstructured TTS calls

If `window.speechSynthesis.speak()` or similar is called directly, replace
with `AudioQueue` for priority management:

```typescript
import { AudioQueue, WebSpeechProvider } from "@ikiraro/sdk";

const tts = WebSpeechProvider.getInstance();
const queue = AudioQueue.getInstance(
  (text) => tts.speak(text),
  () => tts.cancel(),
);

queue.speak("Hello", "normal");
```

## Step 5 — New features to wire up (optional)

These were already in the runtime but are now fully stable. Consider adding them
if the project would benefit:

- **`EarconPlayer`** — synthesized audio cues (no audio files needed). Good for
  focus/select/error feedback.
- **`AccessibilityShortcutManager`** — keyboard shortcut layer with double-tap
  and focus tracking. Good for motor accessibility.
- **`useAccessibilityMode`** with a settings UI — lets users switch between
  `standard`, `audio-first`, `visual-first`, and `motor` modes.

Full API for all of the above is in `references/api_reference.md` (installed by
`npx ikiraro-sdk`).

## Step 6 — Commit

```bash
git add -p   # stage selectively
git commit -m "chore: upgrade @ikiraro/sdk to 0.4.1, @ikiraro/engine to 0.2.0"
```

---

**Reference order when you get stuck:**

1. `.agents/skills/ikiraro-sdk/SKILL.md` — patterns and usage
2. `.agents/skills/ikiraro-sdk/references/api_reference.md` — full type/method signatures
3. `.agents/skills/ikiraro-sdk/references/model_specs.md` — avatar rig requirements
4. `https://ikiraro.dev/docs` — web docs (same content, searchable)
