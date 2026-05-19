# Data Flows

This document traces the complete path for each input mode, from raw user action to rendered sign output.

---

## Mode 1: Text → Sign Plan

**Trigger**: user types a sentence and calls `session:cmd:start` with `mode: "text"`.

```
UI dispatches session:cmd:start { mode: "text", text: "..." }
    │
    ▼
SessionPlugin.handleStart()
    └─ emits translation:cmd:request { mode: "text", text }
         │
         ▼
    TranslationPlugin.handleTranslationRequest()
         │
         ├─ emits translation:started
         │
         └─ GroqSemanticPlanner.plan()
               │
               ▼
          IkiraroSDK.translateText(text)          [Effect pipeline]
               │
               ├─ GlossService.generate(text)
               │    └─ POST /openai/v1/chat/completions
               │         model: llama-3.3-70b-versatile
               │         prompt: "Convert to ASL Gloss JSON"
               │         response: { gloss: "HELLO WORLD", confidence: 0.92 }
               │
               └─ buildPlanFromGloss(intent)
                    │
                    ├─ For each gloss token:
                    │   • "/" → pauseToken(300ms)
                    │   • digits → numberToken
                    │   • known gloss (GLOSS_REGISTRY) → lexemeToken + duration lookup
                    │   • WH-words → lexemeToken + facialExpression: "inquisitive"
                    │   • unknown → fingerspellToken (FS:WORD)
                    │   • inter-word → pauseToken(100ms)
                    │
                    └─ createEnvelope(plan, { mode, rawInput, intent })
                          └─ buildFrameQueue(plan)
                               └─ explode tokens into FrameItem[]
                                  (fingerspell → one FrameItem per letter)

    TranslationPlugin emits translation:finished { envelope }
         │
         ├─ SessionPlugin.reducer: state.lastEnvelope = envelope
         ├─ useCommunicationSession fires onCommit(envelope)
         └─ UI renders PipelineView + SignPlayer3D
```

---

## Mode 2: Speech → Sign Plan

**Trigger**: user speaks, session started with `mode: "speech"`, user stops speaking.

```
UI: session:cmd:start { mode: "speech", sttModel, prompt }
    │
    ▼
SessionPlugin → speech:cmd:start
    │
    ▼
SpeechPlugin.adapter.start()
    │
    ├─ navigator.mediaDevices.getUserMedia({ audio: true })
    ├─ MediaRecorder.start()
    ├─ Web Audio API → AnalyserNode → speech:level-update (per rAF)
    └─ speech:status-change "capturing"

... user speaks ...

UI: session:cmd:stop
    │
    ▼
SessionPlugin → speech:cmd:stop { sttModel, prompt }
    │
    ▼
SpeechPlugin.adapter.stop() → Blob (webm/mp4/ogg)
    │
    ├─ emits translation:cmd:request { mode: "speech", audio: Blob, sttModel }
    │
    ▼
GroqSemanticPlanner.plan()
    │
    ▼
IkiraroSDK.translateSpeech(file, model, prompt)   [Effect pipeline]
    │
    ├─ SttService.transcribe(audio, model, prompt)
    │    └─ POST /openai/v1/audio/transcriptions   (Groq Whisper)
    │         response_format: verbose_json
    │         timestamp_granularities: [word, segment]
    │         → SpeechIntake { text, words: [{word, start, end}], segments, durationSeconds }
    │
    ├─ GlossService.generate(intake.text)
    │    → SemanticIntent { rawGloss, glossTokens, confidence, model }
    │
    └─ buildPlanFromGloss(intent, intake)
          │
          ├─ same token building as text mode
          │
          └─ Speech timing synchronization:
               totalSpeechMs = intake.durationSeconds * 1000
               totalBaseMs   = sum of all token.durationMs
               scale = clamp(totalSpeechMs / totalBaseMs, 0.5, 2.0)
               → non-pause token durations scaled to match speech rhythm

    → TranslationEnvelope with intake field populated
```

---

## Mode 3: Manual Sign Keys → Deterministic Plan

**Trigger**: user selects lexemes/fingerspell from SignKeyboard, calls commit.

```
UI: session:cmd:start { mode: "sign-keys", units: ["HELLO", "A", "B", "C"] }
    │
    ▼
SessionPlugin → translation:cmd:request { mode: "sign-keys", units }
    │
    ▼
DeterministicUnitsPlanner.plan()
    │
    └─ buildPlanFromUnits(units)
          │
          ├─ "/" → pauseToken(300ms)
          ├─ digits → numberToken
          ├─ uppercase single char → fingerspellToken
          ├─ "PTR:YOU" → pointingToken("YOU")
          └─ else → lexemeToken

    No network call. Purely local.
    → TranslationEnvelope { plan.track: "deterministic" }
```

---

## Mode 4: Camera Fingerspelling → Vision Tokens → Text Path

This mode is always running in parallel when `VisionPlugin` is active. It does not go through the session lifecycle — instead it produces tokens that accumulate in `CompositionPlugin` and can be submitted via the text path.

```
Camera feed (getUserMedia)
    │
    ▼
VisionSystem.queueNextFrame()   [main thread, rAF or videoFrameCallback]
    │
    ├─ createImageBitmap(videoElement)
    └─ WorkerHandProcessor.process(bitmap, timestamp)
          │ postMessage (transfers bitmap)
          ▼
    ┌─────────────────────────────────────────────────────┐
    │               hand-landmarker.worker.ts             │
    │                                                     │
    │  HandLandmarker.detectForVideo(bitmap, timestampMs) │
    │    → landmarks (image), worldLandmarks, handedness  │
    │                                                     │
    │  evaluateHandGeometry(imageLandmarks)               │
    │    → { bounds: { centerX, centerY, area }, score }  │
    │                                                     │
    │  Gating (isUsable):                                 │
    │    • geometry.score >= 0.5                          │
    │    • geometry.bounds.area >= 0.005                  │
    │    • centerX in [0.08, 0.92]  (signing zone)       │
    │    • centerY in [0.06, 0.94]                        │
    │    • handedness.score >= 0.5 (if present)           │
    │                                                     │
    │  If usable:                                         │
    │    SignDetectionPipeline.process(worldLandmarks,    │
    │                                 imageLandmarks)     │
    │     │                                               │
    │     ├─ IkiraroSurgicalClassifier.process()          │
    │     │    ├─ LandmarkSmoother (1€ filter, 21 pts)    │
    │     │    ├─ IkiraroFeatureExtractor.extract()        │
    │     │    │    → FeatureVector (fingerprint + 14 fields)
    │     │    ├─ IkiraroSurgicalMatcher.match(vector)    │
    │     │    │    → candidates sorted by score          │
    │     │    ├─ IkiraroTemporalSmoother.smooth()        │
    │     │    │    → { sign, confidence } (hysterersis)  │
    │     │    ├─ IkiraroTransitionDetector               │
    │     │    └─ IkiraroGestureDetector                  │
    │     │         → gesture type (slide/bounce/none)    │
    │     │                                               │
    │     └─ LinguisticBuffer.update(sign, context)       │
    │          │                                          │
    │          ├─ FingerspellStrategy: build letter buffer │
    │          │    double-letter: gesture OR hold 1500ms  │
    │          └─ LexemeStrategy: hold multi-char sign     │
    │               commits word → FingerspellToken        │
    │                         or LexemeToken               │
    │                                                     │
    │  postMessage { type: "result", tracking }           │
    └─────────────────────────────────────────────────────┘
          │ onmessage (main thread)
          ▼
    WorkerHandProcessor → VisionSystem
          │
          ├─ emit "tracking-update" (full CameraTrackingState)
          ├─ emit "sign-detected" { sign, confidence }
          ├─ emit "word-committed" (SignToken) ← when pipeline fires
          ├─ emit "buffer-update" { currentWord, sentenceText }
          └─ emit "fps-update" (every second)

    VisionPlugin (in runtime event bus)
          │
          ├─ vision:tracking → CameraTrackingState (for UI display)
          ├─ input:token (stability: "stable") ← sign-detected
          └─ input:token (stability: "committed") ← word-committed
                │
                ▼
          CompositionPlugin
                │
                ├─ collects input:token events into eventBuffer
                ├─ debounces 400ms (FLUSH_DEBOUNCE_MS)
                └─ TimeWindowTokenFusionPolicy.fuse()
                     • deduplicates tokens within 150ms window
                     → composition:update { newTokens, allEvents }

    Dashboard: camera.tracking.sentenceText accumulates
    User clicks "Commit Fingerspelled Message"
          │
          ▼
    translation:cmd:request { mode: "text", text: sentenceText }
          → same as Mode 1 text path
```

---

## The FrameItem Queue

Every `TranslationEnvelope` contains a `rendererQueue: FrameItem[]` built by `buildFrameQueue(plan)`. This is the flat, renderer-ready representation:

| Token type            | Expansion                                                          |
| --------------------- | ------------------------------------------------------------------ |
| `lexeme`              | 1 FrameItem (value = first char of lexemeId for handshape lookup)  |
| `fingerspell "HELLO"` | 5 FrameItems (H, E, L, L, O), duration = max(180, totalMs/letters) |
| `number "42"`         | 2 FrameItems (4, 2), duration = max(180, totalMs/digits)           |
| `pause`               | 1 FrameItem (type: "pause", triggers canvas.clear())               |
| `pointing`            | 1 FrameItem (value = "D" for pointing index finger)                |

`RendererDirector` plays back this queue frame by frame, calling `SignCanvas` methods at each tick. Each frame carries coarticulation hints (`blend` / `snap` / `none`) that control whether the director blends adjacent handshapes.

---

## Coarticulation

Between frames, `RendererDirector` applies coarticulation blending via `coarticulationBlend(mode, progress, hasNext)`:

- `"blend"` (default) — lerp toward the next handshape as `progress → 1`. Produces smooth transitions.
- `"snap"` — no blend. Used for pointing tokens that must be crisp.
- `"none"` — no blend. Hold current pose until the next frame starts.

`mixHandshapes(current, next, t)` lerps all joint angles (MCP, PIP, DIP, splay, thumb) by factor `t`.
