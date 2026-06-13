# Ikiraro — System Status

_Last updated: 2026-06-12. Companion to [guides/sign-quality-workflow.md](guides/sign-quality-workflow.md), which has the data sources, calibration scripts, and measurement methodology behind every number here._

## Feature matrix

### Text/Speech → Sign (production)

- [x] Text → token plan → frame queue → 3D avatar (tokenizer, frame-builder, renderer-director)
- [x] Fingerspelling A–Z, digits 0–5, `/` — **20 letters' flexion angles derived from real hands** (sid220 dataset medians); rest hand-authored
- [x] Lexical signs via gloss registry with ~20 procedural motion types (arc, salute, tap, traces…)
- [x] Data-calibrated pacing: 200 ms/letter, 240 ms/digit (measured 183–315 / 226–351 ms on 952 real sequences)
- [x] Per-letter fingerspelling micro-pulse (`fs-pulse`, measured 0.73 cycles/letter, amplitude from data)
- [x] Spring kinematics with substepped integration (frame-rate independent; no ringing at 30 fps)
- [x] Finger transitions settle in ~80 ms (matches measured 67 ms median)
- [x] Coarticulation blending + rhythm envelopes
- [x] Audio-duration sync (token timing rescales to speech length)
- [x] Avaturn avatar, Mixamo-compatible rig, full right-hand finger rig verified
- [x] Speech input (speech capture → translate)
- [x] TTS feedback via priority audio queue; earcons; accessibility mode; shortcut manager

### Camera → Text (recognition)

- [x] MediaPipe holistic worker (hands + face + pose), GPU/CPU delegate
- [x] Letter recognition A–Z: 44 multi-templates, palm-length normalization, chirality-invariant scoring, margin acceptance — **66.7% per-frame held-out (6.5% wrong, rest rejected)**, up from 19.5%
- [x] Offline eval harness with confusion matrix and score-distribution calibration (`eval-recognition.ts`)
- [x] Letters → words: 3-frame/120 ms stability gate, double-letter hold (900 ms), pause commit (1 s)
- [x] Sign-as-input: committed words land in the playground input field with spoken feedback
- [x] Left-handed signers (free side effect of chirality-invariant matching)
- [x] Aspect-correct, correctly-mirrored hand skeleton overlay
- [x] Manual correction hook (`overrideLast`), quality/signing-zone gating

## Implemented, but not well

| Area | Problem | Path forward |
|---|---|---|
| J, Z recognition | Motion letters; static templates fundamentally can't catch them (J 11%, Z 25%) | Temporal trajectory matching on the landmark history |
| P, Q recognition (~25–50%) | Downward orientation collapses MediaPipe depth | Self-capture training data; orientation-conditioned templates |
| G/H/P/Q avatar handshapes | Same depth problem in training data — still hand-authored | Self-capture via own webcam pipeline |
| Splay channels (avatar) | Sign-ambiguous in mirrored datasets — still hand-authored | Self-capture (known handedness removes ambiguity) |
| Lexical motion ("hello" etc.) | Procedural sine/linear joint ramps — the remaining "robotic" feel | Record-and-import pipeline → `RecordedTrajectory` (specced in workflow doc) |
| Per-frame rejection rate (27%) | Adds recognition latency on hard letters (the word gate hides most of it) | More/better templates; per-letter thresholds; temporal voting in recognizer itself |
| `doubleLetterHoldMs = 900` | UX choice, not measured — real signers slide, not re-strike | Double-letter timing mining from Kaggle data (needs alignment pass) |
| `facialExpression` field | Flows through the whole pipeline but the renderer never applies it | Blocked on avatar blendshapes (below) |

## Not done

- [ ] **Non-manual markers** (mouthing, eyebrows, head tilt) — blocked first on avatar re-export: current Avaturn GLB has **zero morph targets**
- [ ] **Left-hand avatar fingers** — renderer drives only `Right*` finger bones; left hand gets arm/wrist motion but a static hand
- [ ] **Two-handed signs** (production has limited left-arm targets; recognition is single-hand)
- [ ] **Lexical sign recognition** (camera recognizes fingerspelling only, no word-level signs)
- [ ] **Digit recognition** (templates are A–Z only; production supports 0–5)
- [ ] **Digits 6–9 production handshapes**
- [ ] **ASL grammar** (translation is gloss-sequencing + fingerspelling; no real syntax transformation)
- [ ] **Dictionary/autocorrect** on recognized words (e.g., "HELO" → "HELLO")
- [ ] **User-facing signing speed control** (single constant today; learners may need 0.5×)
- [ ] **Per-user recognition calibration** (templates are population-level)

## What we might do, in rough priority order

1. **Self-capture tool** — a page that records labeled samples through the existing tracking stack. One build fixes four "not well" rows at once (G/H/P/Q both directions, splay, J/Z motion data, per-user calibration). Highest leverage per effort.
2. **Record-and-import lexical motion** — kills the biggest remaining quality gap ("hello" feels hacky). One recorded sign at a time, prioritized by gloss frequency.
3. **Avatar re-export with ARKit blendshapes** → unblocks non-manual markers, which carry real grammatical weight in ASL (questions, negation).
4. **Temporal matching for J/Z** — the recognizer already keeps a 10-frame history; match wrist/tip trajectories against recorded traces.
5. **Word-level autocorrect** — cheap accuracy multiplier on top of per-letter recognition (edit distance against a word list at commit time).
6. **Kaggle alignment pass** — DTW against letter templates unlocks double-letter timing, letter-pair transition durations, and harvesting the 75 GB corpus for orientation-varied letter samples.
7. **Long-term**: replace template matching with a small temporal model trained on the Kaggle data (the competition's actual task) — the ceiling for continuous fingerspelling recognition.

## Verification status

- Engine: 40/40 tests pass (recognizer characterization incl. mirror-invariance + margin rejection; kinematics; pipeline; buffer)
- Typecheck: engine, runtime, renderer, web all clean
- Recognition numbers: held-out split (never used for templates), `bun scripts/eval-recognition.ts train_landmarks/aslnow`
- Manual verification pending: end-to-end camera → word → input on a live signer after the latest worker change (image-landmark classification)
