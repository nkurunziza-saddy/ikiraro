# Communication Package MVP Overhaul

Complete overhaul of `@sensa/communication` and its web integration for production-grade sign detection, audio recording, text-to-speech, and clean sign playback.

## User Review Required

> [!IMPORTANT]
> This is a large-scope change touching 30+ files across `packages/shared`, `packages/communication`, and `apps/web`. The plan is organized into 6 phases that can be executed incrementally. Each phase produces a working state.

> [!WARNING]
> The current `AslHandSvg` component uses procedural/abstract finger positions — it does **not** render accurate ASL hand shapes. This plan replaces it with precise, verified SVG path data for all 26 letters based on the actual ASL manual alphabet.

## Open Questions

> [!IMPORTANT]
> **Groq API key availability**: The semantic planner and STT both require `GROQ_API_KEY`. Is this currently configured in the server `.env`? If not, the semantic track will always fall back to deterministic mode.

> [!IMPORTANT]  
> **Target sign language**: The plan assumes ASL only for now. Do you need BSL or other sign language support in this iteration?

---

## Current State Assessment (Aggressive Review)

### Critical Accuracy Problems

| Area                             | Problem                                                                                                                                | Severity    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Handshape definitions**        | Only **19 of 26** letters defined — missing J, M, N, P, Q, T, Z                                                                        | 🔴 Critical |
| **Fingerprint collisions**       | 6 letters share `01100`, 3 share `00000`, 2 share `01000`, 2 share `11000` — disambiguation is fragile                                 | 🔴 Critical |
| **Feature vector**               | Only 3 distance features (`thumbToIndex`, `thumbToMiddle`, `indexMiddleSpread`) — not enough to separate 26 handshapes                 | 🔴 Critical |
| **No palm orientation**          | Cannot distinguish G/H, M/N, P/Q which differ primarily by wrist rotation                                                              | 🔴 Critical |
| **No finger crossing detection** | R (crossed fingers) has same fingerprint as V and U — `indexMiddleSpread < 0.25` is not crossing detection                             | 🟡 High     |
| **Smoothing coefficients**       | `[0.0857, -0.1428, -0.0857, 0.2571, 0.8857]` — the negative weights introduce phase distortion and can amplify noise on jittery frames | 🟡 High     |
| **SVG hand graphics**            | `AslHandSvg` renders abstract rectangles with a letter overlay — **not actual ASL signs**                                              | 🔴 Critical |
| **WebSpeechProvider**            | No rate/pitch controls, no voice selection UX, no fallback for unsupported browsers, no queuing                                        | 🟡 High     |
| **Word buffer timing**           | Uses `Date.now()` which can drift — should use `performance.now()` for consistency with video frame timing                             | 🟡 Medium   |
| **No TTS for sign playback**     | Sign player has no "speak this" button — critical for bi-directional communication                                                     | 🟡 High     |

### Efficiency Problems

| Area               | Problem                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| `matchHandshape`   | Iterates all 19+ definitions linearly every frame — should pre-group by fingerprint |
| `LandmarkSmoother` | Creates new arrays every frame via `push/shift` — should use circular buffer        |
| Feature extraction | Recalculates `palmSize` normalization for every feature — could compute once        |
| Dashboard          | 1118 lines in a single route file — should extract into focused components          |
| Sign player        | Rebuilds all playback frames on every plan change — no memoization of heavy splits  |

### Integration Problems

| Area                  | Problem                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Keyboard in sign mode | Only captures A-Z, Space, Backspace — no way to type **word signs** from keyboard (e.g., typing "hello" should insert HELLO lexeme) |
| Sign/Word toggle      | No toggle between "each key = one letter" and "type a word → resolve to sign"                                                       |
| Audio recording       | Works but no visual waveform or level indicator — user can't tell if mic is picking up                                              |
| Camera + Sign player  | Camera output never feeds into the sign player — two disconnected systems                                                           |
| TTS output            | `WebSpeechProvider.speak()` fires on word commit but has no UI controls or voice selection                                          |

---

## Proposed Changes

### Phase 1: Fix ASL Detection Accuracy (packages/shared + packages/communication)

The core problem: the classifier is missing 7 letters and the feature vector doesn't capture enough hand geometry to disambiguate the 19 it has.

---

#### [MODIFY] [feature-vector.ts](file:///home/nkurunzizaa/Documents/dev/projects/sensa/packages/shared/src/asl-engine/feature-vector.ts)

**Add 6 new features to `FeatureVector`:**

- `thumbToPinkyDist` — normalized thumb tip to pinky tip distance (separates Y, I, A)
- `ringPinkySpread` — normalized ring-to-pinky tip distance (separates W from B)
- `palmOrientation` — dot product of palm normal with camera Z-axis (0 = facing camera, 1 = side view). Calculated from cross product of (wrist→index_mcp) × (wrist→pinky_mcp). **Critical for G/H, P/Q, M/N**
- `thumbPosition` — whether thumb is across palm vs. beside palm, using thumb tip Y relative to index MCP Y
- `fingerAngles[5]` — PIP joint angles for each finger (better curl granularity than tip-to-base ratio)
- `wristAngle` — angle of wrist-to-middle-mcp vector relative to vertical (detects wrist rotation)

Update `fingerprint` to remain a 5-char binary string for backward compatibility, but matching will use the richer feature set.

#### [MODIFY] [types.ts](file:///home/nkurunzizaa/Documents/dev/projects/sensa/packages/shared/src/asl-engine/types.ts)

Add the new fields to the `FeatureVector` interface.

#### [MODIFY] [smoothing.ts](file:///home/nkurunzizaa/Documents/dev/projects/sensa/packages/shared/src/asl-engine/smoothing.ts)

Replace the Savitzky-Golay-like filter with a **one-euro filter** — the standard for interactive landmark smoothing. Uses adaptive cutoff: low jitter when stationary, responsive when moving. This is the approach used by MediaPipe's own examples and is battle-tested. Implement as a circular buffer to avoid GC pressure from array shifts.

#### [MODIFY] [handshapes.ts](file:///home/nkurunzizaa/Documents/dev/projects/sensa/packages/communication/src/asl-intelligence/handshapes.ts)

**Add all 26 letters** with proper definitions:

| Letter | Fingerprint | Key disambiguators                                                |
| ------ | ----------- | ----------------------------------------------------------------- |
| A      | `10000`     | High avg curl, thumb beside fist                                  |
| B      | `01111`     | Low indexMiddleSpread, all 4 fingers straight                     |
| C      | `11111`     | Medium curl (0.12-0.5), curved shape                              |
| D      | `01000`     | Index straight (curl < 0.3)                                       |
| E      | `00000`     | Medium curl (0.35-0.55)                                           |
| F      | `00111`     | Thumb touching index (thumbToIndex < 0.5)                         |
| G      | `11000`     | thumbToIndex ≤ 0.8, palm facing side (palmOrientation > 0.4)      |
| H      | `01100`     | Palm facing side (palmOrientation > 0.4), fingers horizontal      |
| I      | `00001`     | Just pinky extended                                               |
| **J**  | `00001`     | **Same as I + motion trace** (mark as `requiresMotion: true`)     |
| K      | `11100`     | Thumb between index and middle                                    |
| L      | `11000`     | thumbToIndex > 0.8, clear L shape                                 |
| **M**  | `00000`     | **Thumb under 3 fingers, palm down (palmOrientation > 0.5)**      |
| **N**  | `00000`     | **Thumb under 2 fingers, palm down**                              |
| O      | `00000`     | Thumb touching index AND middle (both dists < 0.4)                |
| **P**  | `11100`     | **Palm down (palmOrientation > 0.5), like K but rotated**         |
| **Q**  | `11000`     | **Palm down, like G but pointing down**                           |
| R      | `01100`     | Fingers crossed (indexMiddleSpread < 0.15 + fingerAngles overlap) |
| S      | `00000`     | High curl (> 0.55), thumb across fingers                          |
| **T**  | `10000`     | **Thumb between index and middle, fist closed**                   |
| U      | `01100`     | indexMiddleSpread < 0.5, fingers parallel                         |
| V      | `01100`     | indexMiddleSpread ≥ 0.5, V shape                                  |
| W      | `01110`     | Three middle fingers extended                                     |
| X      | `01000`     | Index hooked (curl 0.3-0.6)                                       |
| Y      | `10001`     | Thumb and pinky out, others closed                                |
| **Z**  | `01000`     | **Same as D + motion trace** (mark as `requiresMotion: true`)     |

For J and Z: add `requiresMotion: true` flag. The classifier will report them as I/D respectively with a note that motion detection is needed. This is honest — no fake accuracy.

#### [MODIFY] [classifier.ts](file:///home/nkurunzizaa/Documents/dev/projects/sensa/packages/communication/src/asl-intelligence/classifier.ts)

- Pre-group handshape definitions by fingerprint in a `Map<string, HandshapeDefinition[]>` at initialization — O(1) lookup instead of O(n) scan per frame
- Increase `windowSize` from 5 → 7 for better consensus at 30fps
- Add `getTopCandidates(n)` method for showing alternate interpretations in the UI
- Add frame timestamp tracking for J/Z motion detection groundwork

#### [MODIFY] [word-buffer.ts](file:///home/nkurunzizaa/Documents/dev/projects/sensa/packages/communication/src/asl-intelligence/word-buffer.ts)

- Switch from `Date.now()` to `performance.now()` for consistency with video frame timing
- Add `forceCommit()` method for manual word commit from UI
- Add double-letter detection: if same sign held for >1.5s continuously after initial commit, add the letter again

---

### Phase 2: Accurate ASL Hand SVG Graphics (apps/web)

The current `AslHandSvg` renders rectangles with letter overlays. Replace with accurate SVG representations.

---

#### [MODIFY] [asl-hand-svg.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/components/asl-hand-svg.tsx)

Complete rewrite. For each of the 26 ASL letters, define a precise SVG hand shape using:

- A palm silhouette path
- Individual finger paths with correct bend/curl positions
- Thumb position accurate to each letter
- Smooth CSS transitions between letters (transform transitions on finger paths)

The approach: Define a **base hand skeleton** with 5 finger groups, each consisting of 3 segments (MCP→PIP, PIP→DIP, DIP→tip). Each letter defines rotation angles for each joint. This is computationally light (just CSS transforms) and visually accurate.

Add properties:

- `size`: responsive sizing
- `animate`: smooth morph between letters when the letter changes
- `showLabel`: optional letter label below the hand
- `variant`: `'light' | 'dark'` for different backgrounds

---

### Phase 3: Enhanced Web Speech & TTS (packages/communication + apps/web)

---

#### [MODIFY] [web-speech.ts](file:///home/nkurunzizaa/Documents/dev/projects/sensa/packages/communication/src/web-speech.ts)

Expand `WebSpeechProvider`:

- `speak(text, options)` — add `rate`, `pitch`, `volume`, `voiceName` options
- `getVoices()` — return available voices with language tags
- `cancel()` — stop current utterance
- `isSpeaking()` — check if currently speaking
- `speakQueue(texts[])` — speak multiple items sequentially with pauses
- `onBoundary(callback)` — word boundary events for highlighting current word during speech
- Add browser support detection: `isSupported()` static method
- Add fallback: if speechSynthesis unavailable, resolve silently instead of rejecting

#### [NEW] [tts-controls.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/components/tts-controls.tsx)

Standalone TTS control bar:

- Play/pause/stop buttons
- Voice selector dropdown (populated from `getVoices()`)
- Rate slider (0.5x–2x)
- Volume slider
- Visual indicator showing which word is being spoken (word boundary highlighting)
- Used in the sign player and conversation thread

---

### Phase 4: Audio Recording with Visual Feedback (apps/web)

---

#### [NEW] [audio-visualizer.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/components/audio-visualizer.tsx)

Real-time audio level visualization during recording:

- Use `AnalyserNode` from Web Audio API to get frequency data
- Render as an animated waveform bar or circular level meter
- Show in the speech recording area to give users confidence their mic is picking up
- Smooth animation using `requestAnimationFrame`
- Premium dark-mode design with amber accent glow

#### [MODIFY] [dashboard.tsx → speech section](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/routes/dashboard.tsx)

- Integrate audio visualizer into the speech recording panel
- Add audio playback waveform (using canvas rendering of the recorded blob)

---

### Phase 5: Sign Keyboard Enhancement (apps/web)

---

#### [MODIFY] [dashboard.tsx → sign keyboard section](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/routes/dashboard.tsx)

Add dual-mode keyboard:

**Mode A — Letter Keys (current behavior, enhanced):**

- Each key press = one fingerspelled letter
- Keys show the ASL hand SVG for that letter on hover
- Visual feedback: pressed key glows, current word builds visually
- Number row (0-9) for number tokens

**Mode B — Word Input (new):**

- Toggle switch: "Letters" ↔ "Words"
- In word mode, typing resolves against the lexicon:
  - Type "hello" → matches `HELLO` lexeme → inserts as sign
  - Type "xyz" → no match → falls back to fingerspell
- Autocomplete dropdown showing matching lexemes as you type
- Physical keyboard shortcut: `Tab` to toggle modes, `Enter` to commit word

**Both modes:**

- Visual sign sequence builder with drag-to-reorder
- Each token in the sequence shows its type (lexeme badge, fingerspell badge, pointing arrow, etc.)
- Keyboard shortcut reference bar

---

### Phase 6: Dashboard Decomposition & Polish (apps/web)

The dashboard is 1118 lines. Extract into clean components.

---

#### [NEW] [speech-composer.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/components/speech-composer.tsx)

Extract the speech recording panel (lines ~691-768 of dashboard) into its own component. Include the audio visualizer integration.

#### [NEW] [text-composer.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/components/text-composer.tsx)

Extract text input section.

#### [NEW] [sign-keyboard.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/components/sign-keyboard.tsx)

Extract the sign keyboard with letter/word mode toggle.

#### [NEW] [camera-panel.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/components/camera-panel.tsx)

Extract camera fingerspelling panel.

#### [NEW] [conversation-thread.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/components/conversation-thread.tsx)

Extract conversation history with TTS replay per entry.

#### [MODIFY] [sign-player.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/components/sign-player.tsx)

- Use new accurate `AslHandSvg` component
- Add TTS button: "Speak this plan" — reads the normalized text through `WebSpeechProvider`
- Add step-through mode: click to advance frame by frame
- Smoother transitions between frames with CSS animations
- Show motion description for lexemes more prominently

#### [MODIFY] [dashboard.tsx](file:///home/nkurunzizaa/Documents/dev/projects/sensa/apps/web/src/routes/dashboard.tsx)

Rewrite to compose the extracted components. Target: under 300 lines. Clean state management with clear data flow between components.

---

## Verification Plan

### Automated Tests

```bash
# Type checking across all packages
bun run check-types

# Run existing + new tests
bun test

# Specific communication package tests
cd packages/communication && bun test
```

**New test files to add:**

- `packages/communication/test/handshapes.test.ts` — verify all 26 letters have definitions, no duplicate fingerprint+disambiguator collisions, J/Z marked as motion-required
- `packages/communication/test/classifier.test.ts` — test consensus, hysteresis, and fingerprint pre-grouping
- `packages/communication/test/word-buffer.test.ts` — test double-letter, force-commit, timing with performance.now
- `packages/shared/test/feature-vector.test.ts` — test new features (palm orientation, finger angles) with fixture landmarks

### Manual Verification

1. **Start dev server** (`bun dev`) and navigate to dashboard
2. **Sign keyboard test**:
   - Letter mode: type A-Z, verify each shows correct ASL hand SVG
   - Word mode: type "hello", verify it resolves to HELLO lexeme
   - Physical keyboard shortcuts work
3. **Speech recording test**:
   - Record audio, verify waveform visualizer shows levels
   - Verify Groq STT returns transcript
   - Verify sign plan generated correctly
4. **Camera fingerspelling test**:
   - Start camera, show ASL letters A, B, D, L, V, W, Y
   - Verify detection accuracy improved for previously ambiguous pairs (D/X, V/U, S/E)
5. **TTS test**:
   - Translate a phrase, click "Speak" on the sign player
   - Verify voice selection works
   - Verify rate/volume controls work
6. **Sign player test**:
   - Play a multi-token plan, verify accurate hand SVGs animate between frames
   - Speed controls work (0.5x, 1x, 1.5x, 2x)
   - Step-through mode works

### Browser Testing

```
Use browser subagent to:
1. Navigate to dashboard
2. Test keyboard input in sign mode
3. Verify no console errors
4. Verify responsive layout at different viewport sizes
```
