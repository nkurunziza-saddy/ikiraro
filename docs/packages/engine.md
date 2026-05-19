# @ikiraro/engine

The engine is the pure, framework-agnostic core of the Ikiraro SDK. It contains all domain logic: type definitions, sign planning algorithms, the vision classification pipeline, and math utilities. It has no browser dependencies and no knowledge of React, MediaPipe, or Groq — those concerns live in `@ikiraro/communication`.

**Package name**: `@ikiraro/engine`

**Exports**:

- `.` / `./types` → `src/types.ts` — all shared domain types
- `./planning` → `src/planning/index.ts` — sign plan building and rendering
- `./vision` → `src/vision/index.ts` — classification pipeline, buffers, strategies
- `./math` → `src/math/index.ts` — vector utilities

---

## Types (`src/types.ts`)

Central type definitions used across all packages.

### Communication Domain

```typescript
type CommunicationMode = "speech" | "text" | "sign-keys" | "camera-fingerspell";
type TranslationTrack = "semantic" | "deterministic";
type PlanningStrategy = "semantic" | "deterministic";
type SttModel = "whisper-large-v3" | "whisper-large-v3-turbo";
```

### Token Domain

`SignToken` is the atomic unit of sign language output. Every translation plan is a sequence of `SignToken`s.

```typescript
type SignToken =
  | LexemeToken // { type: "lexeme", lexemeId, durationMs, emphasis, facialExpression?, coarticulationHint? }
  | FingerspellToken // { type: "fingerspell", text, durationMs, emphasis, ... }
  | NumberToken // { type: "number", value, durationMs, emphasis, ... }
  | PauseToken // { type: "pause", durationMs }
  | PointingToken; // { type: "pointing", target, durationMs, ... }
```

**LexemeToken**: A known whole-word sign identified by its gloss ID (e.g., `"HELLO"`, `"THANK-YOU"`). The renderer looks up the corresponding 3D handshape by first character of `lexemeId`. Duration is looked up in `GLOSS_REGISTRY`.

**FingerspellToken**: A word to be spelled letter-by-letter using the ASL manual alphabet. The text is split into individual `FrameItem`s by `buildFrameQueue`. Default duration: `max(420ms, text.length × 120ms)`.

**NumberToken**: A digit sequence signed using ASL numbers. Default duration: `max(420ms, value.length × 110ms)`.

**PauseToken**: A rest period. Used between words (100ms) and between clauses (300ms).

**PointingToken**: A pointing gesture toward a referent (e.g., `"PTR:SELF"`, `"PTR:YOU"`). Rendered as the D handshape. Duration: 360ms.

### Emphasis and Facial Expression

```typescript
type EmphasisLevel = "low" | "normal" | "high";
type FacialExpression = "neutral" | "inquisitive" | "assertive" | "urgent" | "empathetic";
type CoarticulationMode = "blend" | "snap" | "none";
```

WH-questions (`WHAT`, `WHERE`, `WHO`, `WHEN`, `WHY`, `HOW`) automatically receive `facialExpression: "inquisitive"` and `emphasis: "high"`.

### SignPlan

The structured output of the planning stage:

```typescript
type SignPlan = {
  sourceText: string; // original gloss or unit string
  normalizedText: string; // after normalizer.ts lowercasing/cleanup
  glossText: string; // human-readable gloss (e.g., "HELLO FS:WORLD")
  track: TranslationTrack; // "semantic" | "deterministic"
  strategy: PlanningStrategy;
  clauses: SignClause[]; // [{ intent: string, tokens: SignToken[] }]
  metadata: {
    confidence: number;
    reviewNeeded: boolean; // true if confidence < 0.6
    notes: string[]; // e.g., "Gloss model: llama-3.3-70b-versatile"
  };
};
```

### TranslationEnvelope

The complete output of a translation session:

```typescript
type TranslationEnvelope = {
  mode: CommunicationMode;
  intake: SpeechIntake | null; // populated only for "speech" mode
  plan: SignPlan;
  rendererQueue: FrameItem[]; // flat, renderer-ready frame sequence
  rawInput: string;
  normalizedText: string;
  intent?: SemanticIntent; // Groq gloss model output (semantic track only)
};
```

### SpeechIntake

Populated for speech mode, carries Whisper transcription with timing:

```typescript
type SpeechIntake = {
  model: SttModel;
  text: string;
  language: string | null;
  durationSeconds: number | null;
  prompt: string;
  words: SpeechWordTiming[]; // [{ word, start, end, confidence? }]
  segments: SpeechSegment[]; // [{ id, start, end, text }]
};
```

### IkiraroToken (Runtime Input Token)

Unified token for the composition layer. Different from `SignToken` — this is the runtime's representation of any user input event:

```typescript
interface IkiraroToken {
  id: string;
  value: string;
  type: "sign" | "speech" | "text" | "control";
  source: string;
  timestamp: number;
  confidence: number;
  stability: "draft" | "stable" | "committed";
  correlationId?: string;
  metadata?: Record<string, any>;
}
```

### FrameItem

The renderer-ready representation used by `RendererDirector`:

```typescript
type FrameItem = {
  type: "lexeme" | "fingerspell" | "number" | "pause" | "pointing";
  value: string; // handshape lookup key (single char for alphabet frames)
  label: string; // human-readable display
  sublabel?: string; // e.g., "2/5 · HELLO" for fingerspell progress
  duration: number; // milliseconds
  motion?: "none" | "shake" | "arc" | "tap" | "circle";
  facialExpression?: string;
  coarticulation?: CoarticulationMode;
};
```

### Vision Types

See [`../vision-pipeline.md`](../vision-pipeline.md) for full detail. Key interfaces:

```typescript
interface IFeatureExtractor {
  extract(landmarks: HandLandmarks, imageLandmarks?: HandLandmarks): FeatureVector;
}

interface ISignMatcher {
  match(vector: FeatureVector): Array<{ name: string; score: number }>;
}

interface ITemporalSmoother {
  smooth(candidates: Array<{ name: string; score: number }>): {
    sign: string | null;
    confidence: number;
  };
  reset(): void;
}

interface ILandmarkSmoother {
  smooth(landmarks: HandLandmarks): HandLandmarks;
  getVelocity(): Point3D;
  reset(): void;
}

interface IGestureDetector {
  update(velocity: Point3D): {
    type: "double-letter-slide" | "double-letter-bounce" | "none";
    confidence: number;
  };
  reset(): void;
}

interface ITransitionDetector {
  isTransitioning(velocity: Point3D, confidence: number): boolean;
  reset(): void;
}
```

---

## Planning (`src/planning/`)

### `tokenizer.ts` — `buildPlanFromGloss`, `buildPlanFromUnits`, `createEnvelope`

**`buildPlanFromGloss(intent, intake?)`** — Converts a `SemanticIntent` (Groq gloss output) into a `SignPlan`.

1. Splits `intent.glossTokens` and converts each:
   - `"/"` → `pauseToken(300ms)`
   - digits → `numberToken`
   - known gloss (in `GLOSS_REGISTRY`) → `lexemeToken` with duration from registry
   - WH-words → `lexemeToken` with `facialExpression: "inquisitive"` and `emphasis: "high"`
   - unknown → `fingerspellToken`
   - after each non-pause token: `pauseToken(100ms)`

2. If `intake.durationSeconds` is present: scales non-pause token durations by `clamp(totalSpeechMs / totalBaseMs, 0.5, 2.0)` to synchronize sign timing with the original speech rhythm.

**`buildPlanFromUnits(units)`** — Deterministic. Takes manual sign key strings and builds a plan without any AI call.

Unit format:

- `"/"` → pause
- digits → number
- uppercase single char → fingerspell
- `"PTR:YOU"` → pointing
- else → lexeme

**`createEnvelope(plan, options)`** — Wraps a `SignPlan` into a `TranslationEnvelope` and calls `buildFrameQueue(plan)` to produce the renderer queue.

### `frame-queue.ts` — `buildFrameQueue`

Converts a `SignPlan`'s `SignToken[]` into a flat `FrameItem[]`. Multi-character tokens are exploded:

- `fingerspell "HELLO"` → 5 items: H, E, L, L, O. Duration per letter: `max(180, totalMs/5)`.
- `number "42"` → 2 items: 4, 2. Duration per digit: `max(180, totalMs/2)`.
- `lexeme "HELLO"` → 1 item. The `value` field is set to the first character of `lexemeId` — this is used to look up the 3D handshape in `ASL_HAND_POSES`.

### `gloss-registry.ts`

Static map of 30 known ASL glosses to their `{ label, durationMs }`. Functions:

- `isKnownGloss(token)` — returns `true` if the token is in the registry.
- `getGlossDurationMs(token)` — returns the duration or 500ms default.

Currently covers: AGAIN, BATHROOM, DOCTOR, DRINK, EMERGENCY, FAMILY, FIND, FOOD, GO, HELLO, HELP, INTERPRETER, LEARN, MEDICINE, NAME, NEED, NO, NURSE, PAIN, PLEASE, SCHOOL, STOP, THANK-YOU, UNDERSTAND, WAIT, WATER, WHAT, WHEN, WHERE, WHO, YES.

### `tokens.ts` — Token factory functions

```typescript
lexemeToken(lexemeId, emphasis?, durationMs?)   → LexemeToken
fingerspellToken(text, emphasis?, durationMs?)  → FingerspellToken
numberToken(value, emphasis?, durationMs?)      → NumberToken
pointingToken(target, emphasis?, durationMs?)   → PointingToken
pauseToken(durationMs?)                         → PauseToken
```

Duration defaults:

- `DEFAULT_LEXEME_DURATION_MS` = 500ms
- `FINGERSPELL_PER_CHAR_MS` = 120ms (minimum 420ms total)
- `NUMBER_PER_DIGIT_MS` = 110ms (minimum 420ms total)
- `POINTING_DURATION_MS` = 360ms
- `INTER_WORD_PAUSE_MS` = 100ms
- `INTER_UNIT_PAUSE_MS` = 300ms

### `pose-library.ts` — 3D Handshapes

`ASL_HAND_POSES: Record<string, Handshape>` — Joint angle definitions for all 26 ASL letters and REST_POSE. Each `Handshape` specifies MCP, PIP, DIP, and splay angles for all four fingers plus the thumb (splay, flex, curl).

```typescript
type Handshape = {
  index: { mcp; pip; dip; splay };
  middle: { mcp; pip; dip; splay };
  ring: { mcp; pip; dip; splay };
  pinky: { mcp; pip; dip; splay };
  thumb: { splay; flex; curl };
};
```

- `resolveHandshape(value)` — looks up `ASL_HAND_POSES[value]`, falls back to REST_POSE.
- `mixHandshapes(a, b, t)` — linear interpolation of all joint angles by factor `t` (0–1). Used by `RendererDirector` for coarticulation blending.

### `renderer-director.ts` — `RendererDirector`

Coordinates playback of a `FrameItem[]` queue against a `SignCanvas` adapter.

**Key methods**:

- `setQueue(queue)` — sets the frame sequence and resets playback.
- `play()` / `pause()` / `seek(time)` / `reset()`
- `setOptions({ speed, loop })` — speed multiplier (default 1), loop mode (default false).
- `subscribe(cb)` — subscribe to `RendererState` changes: `{ time, frameIndex, progress, isPlaying }`.

**Playback loop** (`tick`): uses `requestAnimationFrame`. At each frame, advances `state.time` by `dt * speed`, calls `updateStateFromTime()` to find the current `FrameItem`, and calls `updateCanvas()` with the current pose + coarticulation blend.

**SignCanvas interface** (implemented by 3D and SVG renderers):

```typescript
interface SignCanvas {
  setPose(handshape: Handshape): void;
  setOverlay(label: string, sublabel?: string): void;
  setExpression?(expression: string): void;
  clear(): void;
}
```

### `coarticulation.ts`

`coarticulationBlend(mode, progress, hasNext)`:

- `"blend"` + `hasNext` → returns `progress` (blend linearly toward next handshape).
- `"snap"` or not `hasNext` → returns `null` (no blend, hold current pose).
- `"none"` → returns `null`.

### `services.ts` — Effect Service Tags

Effect `Context.Tag` interfaces that declare the AI service seams:

```typescript
const SttService = Context.GenericTag<{
  transcribe(audio: File, model: SttModel, prompt?: string): Effect.Effect<SpeechIntake, Error>;
}>("@ikiraro/engine/SttService");

const GlossService = Context.GenericTag<{
  generate(text: string, model?: string): Effect.Effect<SemanticIntent, Error>;
}>("@ikiraro/engine/GlossService");
```

Implementations (`SttGroqLive`, `GlossGroqLive`) live in `@ikiraro/communication` and are injected via Effect `Layer`.

### `schemas.ts`

`GLOSS_OUTPUT_SCHEMA` — Effect `Schema` for validating Groq's JSON gloss response. Expects `{ gloss: string, confidence: number }`.

---

## Vision (`src/vision/`)

See [`../vision-pipeline.md`](../vision-pipeline.md) for the full pipeline. Key exported modules:

| Export                      | File                                   | Purpose                                      |
| --------------------------- | -------------------------------------- | -------------------------------------------- |
| `SignDetectionPipeline`     | `pipeline.ts`                          | Deep module: landmarks → SignToken           |
| `IkiraroSurgicalClassifier` | `classifier.ts`                        | Classifier pipeline orchestrator             |
| `LinguisticBuffer`          | `linguistic-buffer.ts`                 | Token commitment via strategies              |
| `WordBuffer`                | `word-buffer.ts`                       | Legacy string-based buffer (still available) |
| `FingerspellStrategy`       | `linguistic/fingerspell-strategy.ts`   | Single-letter token strategy                 |
| `LexemeStrategy`            | `linguistic/lexeme-strategy.ts`        | Whole-word token strategy                    |
| `LandmarkSmoother`          | `smoothing.ts`                         | 1€ filter per landmark                       |
| `IkiraroFeatureExtractor`   | `implementations/feature-extractor.ts` | Landmark → FeatureVector                     |
| `IkiraroSurgicalMatcher`    | `implementations/surgical-matcher.ts`  | Fingerprint-based sign matcher               |
| `IkiraroTemporalSmoother`   | `implementations/temporal-smoother.ts` | Consensus + hysteresis smoother              |
| `ASL_ALPHABET`              | `handshapes.ts`                        | A–Z handshape definitions                    |
| `evaluateHandGeometry`      | `quality.ts`                           | Bounding box, area, quality score            |
| `extractFeatureVector`      | `feature-vector.ts`                    | Direct function for feature extraction       |

### Adding a New Sign Variant

To add a handshape (e.g., a new fingerspelling variant):

1. Add an entry to `ASL_ALPHABET` in `handshapes.ts`:

   ```typescript
   {
     name: "Ñ",
     fingerprint: "11000",            // which fingers are extended
     disambiguate: (v) => {           // return 0–1 score
       return v.indexMiddleSpread > 0.3 ? 0.9 : 0.2;
     }
   }
   ```

2. If it requires a 3D pose, add it to `ASL_HAND_POSES` in `pose-library.ts`.

### Adding a New Linguistic Strategy

Implement `ILinguisticStrategy` and add it to `LinguisticBuffer`'s `strategies` array:

```typescript
class NumberStrategy implements ILinguisticStrategy {
  name = "number";
  update(sign: string, context: WordBufferContext): SignToken | null { ... }
  reset(): void { ... }
}

const pipeline = new SignDetectionPipeline(undefined, {
  strategies: [new FingerspellStrategy(), new LexemeStrategy(), new NumberStrategy()],
});
```

---

## Math (`src/math/`)

### `index.ts` — Vector utilities

```typescript
getDistance(a: Point3D, b: Point3D): number
subtract(a: Point3D, b: Point3D): Point3D
scale(p: Point3D, factor: number): Point3D
normalizeVector(p: Point3D): Point3D
dotProduct(a: Point3D, b: Point3D): number
crossProduct(a: Point3D, b: Point3D): Point3D
getAngle(a: Point3D, b: Point3D, c: Point3D): number  // angle at vertex b
```

Used sparingly — primarily in feature extraction for joint angle calculations.

### `smoothing.ts`

Kalman-adjacent smoothing utilities (currently internal to `LandmarkSmoother`).
