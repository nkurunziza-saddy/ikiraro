# Known Issues & Engineering Debt

Tracked as of 2026-05-20. Ordered roughly by impact.

---

## Avatar / Rendering

### 1. `arc` motion is overused and wrong for HELLO

**Where:** `packages/engine/src/planning/lexeme-poses.ts`

HELLO, LEARN, GOOD, BAD, COME, HAVE, SEE, MUSIC, HELP, GO, FIND all share `motion: "arc"`.
The arc implementation in `motion-paths.ts` is `sin(p * π)` — a symmetric bell curve that starts
at zero, peaks in the middle, and returns to zero. That makes HELLO look like the hand sweeps
out and sweeps back. Real HELLO is a one-directional salute sweep away from the forehead —
it does not return. LEARN (hand opens from forehead forward) has nothing to do with HELLO.
Grouping them into the same motion makes every sign look identical.

**Fix needed:** At minimum, add a `one-way-arc` or `sweep` motion type for outward-only
movements. HELLO and THANK-YOU are salutes; LEARN, SEE are forward pushes. These are
geometrically different trajectories. Each group needs its own motion.

---

### 2. Left arm is frozen — two-handed signs are broken

**Where:** `packages/renderer/src/sign-model-gltf.tsx`, lines 297–312

```ts
setDelta("LeftArm",  lerp(IDLE.lArmX, SIGN.lArmX, ek), ...)
setDelta("LeftForeArm", lerp(IDLE.lForeX, SIGN.lForeX, ek), ...)
```

The left arm always lerps to the generic `SIGN` constants regardless of what lexeme is playing.
It has no per-sign target, no motion delta, no `armTarget` overrides. Signs that are genuinely
two-handed (PLEASE, FAMILY, MEDICINE, WORK, MORE, SCHOOL) show only the right hand moving;
the left just hovers at the generic signing position. PLEASE circles on the chest — neither
hand is doing that correctly. The `ArmTarget` type in `types.ts` has no left-arm fields at all.

**Fix needed:** Extend `ArmTarget` with `lArmX/Y/Z`, `lForeX/Y/Z`, `lHandX` fields.
Add left-arm entries to the relevant `LEXEME_POSES` entries. Apply the same arm target
resolution to the left arm in the renderer.

---

### 3. No hold phase — signs have no peak

Signs in ASL have a three-part rhythm: **approach → hold → release**. The current
implementation runs `computeMotionDelta(motion, progress)` from `p = 0` to `p = 1` uniformly
across the entire frame duration. There is no hold at peak. The hand flies through the peak
of the motion and immediately starts returning — which reads as rushed and unnatural.

**Fix needed:** Remap the frame progress through a hold envelope:
`approach [0 → 0.35] → hold [0.35 → 0.65] → release [0.65 → 1.0]`.
The hold width and position can be a per-motion property. For tap/nod motions,
the hold is at the bottom of the dip; for arc, at the peak.

---

### 4. Arm position jumps between consecutive signs with different `armTarget`

When a sign at `FOREHEAD` (HELLO) is immediately followed by a sign at `CHIN` (FOOD),
the arm target value changes in a single frame. The spring on `ek` (sign progress) smooths
the IDLE↔SIGN transition, but the base target itself (`rArmXBase`) changes discontinuously.
The arm jumps from forehead height to chin height at the frame boundary.

**Fix needed:** Spring-track the arm target values independently from the sign progress spring.
`rArmXBase`, `rForeZBase`, etc. should each have their own spring state that follows the
incoming target, not just be read directly from `frame.armTarget`.

---

### 5. `coarticulation` blends handshapes but not arm position

`coarticulationBlend` (lines 22–24 of `coarticulation.ts`) blends the finger pose in the
last 20% of a frame. However, the arm motion (`computeMotionDelta`) is applied raw with
no corresponding blend-out. At the end of an `arc` or `tap`, the motion delta snaps to zero
at the frame boundary rather than easing out. This creates a visible jerk in the arm.

**Fix needed:** Apply the same cosine blend window to the motion delta scale — ramp
`motionScale` toward zero in the coarticulation window so the arm stops smoothly.

---

### 6. `pointing` ignores its spatial target

**Where:** `packages/engine/src/planning/frame-queue.ts`, line 83

```ts
queue.push({
  type: "pointing",
  value: "D",
  label: `Point: ${token.target}`,
  duration: token.durationMs,
});
```

Pointing tokens (PTR:SELF, PTR:YOU, PTR:THAT) all render as a D-handshape at the
generic SIGN arm position. The directional meaning (pointing at self vs. pointing at
the viewer vs. pointing away) is completely lost. SELF should point the finger toward
the signer's chest; YOU toward the camera; THAT to the side.

**Fix needed:** Add arm target presets for each pointing direction (SELF, YOU, THAT)
and assign them in `buildFrameQueue` when the token type is `pointing`.

---

### 7. Numbers get `motion: "none"` and no arm target

All number tokens render at the default SIGN arm position with no motion. Number signs
in ASL range from fully static (1–5) to wrist-rotation-based (6–9) to multi-digit sequences
that need consistent placement. Currently every number looks identical to a fingerspelled
letter happening to be at an arbitrary arm position.

---

## Vision / Sign Detection

### 8. SurgicalMatcher fails silently when fingerprint doesn't match

**Where:** `packages/engine/src/vision/implementations/surgical-matcher.ts`, line 23

```ts
const relevantDefs = this.definitionsByFingerprint.get(vector.fingerprint) ?? [];
```

If a user's hand produces a fingerprint that doesn't exactly match any definition,
the candidate list is empty. No fallback, no nearest-neighbour, no partial match.
Any hand shape that falls slightly outside the expected bit pattern gets zero output.
This is the primary cause of signs that "just don't detect."

**Fix needed:** Add a fallback that checks adjacent fingerprints (single-bit flips on
the fingerprint hash) when the exact match returns empty. Alternatively, keep a
flat list and score all definitions rather than pre-bucketing by fingerprint.

---

### 9. Temporal smoother discards score magnitude

**Where:** `packages/engine/src/vision/implementations/temporal-smoother.ts`, line 18

```ts
const match = candidates[0] ?? null;
const rawSign = match && match.score >= this.config.rawScoreThreshold ? match.name : null;
```

Only the top candidate is ever considered, and then it's binarized (pass/fail the
`rawScoreThreshold`). A frame where A scores 0.72 and S scores 0.70 gets the same
treatment as A scoring 0.98 with no competition. The history window accumulates
sign _names_, not scores — so the confidence output is vote frequency, not signal
strength. This makes M/N/S/T confusion especially bad because their scores are
genuinely close and the winner flips frame-to-frame.

**Fix needed:** Store `{ name, score }` in history, not just name. Weight the consensus
calculation by score. Apply a score-gap threshold: if the top two candidates are within
0.05 of each other, treat the frame as ambiguous (null) regardless of absolute score.

---

### 10. `double-letter-bounce` is unimplemented

**Where:** `packages/engine/src/vision/gesture-detector.ts`

The `GestureDetection` type includes `"double-letter-bounce"` but the `update()` method
never returns it. Only `double-letter-slide` is detected (X-axis lateral slide). Bounce
(quick Y-axis dip used for letters like L-L, B-B) has no detection logic at all. The
gesture detector itself is also not connected to the word buffer — it fires but the
downstream `WorkerHandProcessor` currently doesn't act on gesture type to emit a repeat letter.

---

### 11. `isMoving` flag has no hysteresis

**Where:** `packages/engine/src/vision/classifier.ts`, lines 61–62

```ts
const speed = Math.sqrt(vector.velocity.x ** 2 + ...);
vector.isMoving = speed > this.config.motionVelocityThreshold;
```

This is a hard threshold on raw velocity — no smoothing, no hysteresis. Small vibrations
from holding a pose (natural hand tremor) will toggle `isMoving` on and off across frames.
This directly affects J and Z detection (`requiresMotion` checks `isMoving`) and can cause
them to score low even during a genuine stroke.

**Fix needed:** Apply exponential smoothing to the speed estimate before thresholding,
or use a Schmitt-trigger (different on/off thresholds) to prevent rapid toggling.

---

### 12. Disambiguation functions are hand-tuned with no rejection class

The `disambiguate` callbacks in `asl-defaults.ts` return a score in [0, 1] but there is
no "I don't know" output — even a hand that vaguely resembles A will score something
above zero. The matcher always produces a winner within each fingerprint bucket.
Combined with issue #9 (binarized threshold), this means the system commits to a sign
even when the signal is genuinely ambiguous.

**Fix needed:** Add a minimum absolute score floor independent of the threshold
(e.g., only emit a candidate if `score > 0.55`). Let the temporal smoother abstain
when confidence is genuinely low rather than always locking to the plurality winner.

---

## Planning / Tokenizer

### 13. Many lexeme poses share identical motion + handshape combinations

From `lexeme-poses.ts`:

- HELLO, LEARN both: `{ handshape: B, armTarget: FOREHEAD, motion: "arc" }`
- GOOD, BAD both: `{ handshape: B, armTarget: CHIN, motion: "arc" }`
- THANK-YOU: `{ handshape: B, armTarget: CHIN, motion: "arc" }` — same as GOOD/BAD
- STOP: `{ handshape: B, motion: "none" }` — generic hold, not positioned

Signs that are semantically different but render identically make the avatar meaningless
as a communication tool — a viewer cannot distinguish them. This is not just a visual
quality issue; it defeats the purpose of the lexeme registry.

---

### 14. Lexeme durations are not calibrated to their motion type

Dynamic signs (`arc`, `circle`, `shake`) and static signs (`none`) all get the same
base duration from `GLOSS_REGISTRY`. A `circle` motion (PLEASE, FAMILY) needs more
time than a `tap` (YES, NAME) or the motion looks rushed. There is no per-motion
minimum duration floor beyond what's hard-coded in `frame-queue.ts` for fingerspell only.
