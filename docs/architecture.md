# Ikiraro — System Architecture

## What Ikiraro Is

Ikiraro is a local-first SDK for real-time hearing-to-signer communication. It takes hearing input (speech audio, typed text, or camera fingerspelling) and produces a synchronized ASL sign plan that drives a 3D hand renderer — giving a signing-impaired or Deaf communication partner a visual output in their language.

The system runs entirely in the browser. No server is required for the vision or rendering path. Only the AI translation path (text → gloss → plan) requires an external API call to Groq.

---

## Monorepo Layout

```
sensa/
├── apps/
│   └── web/                  Reference implementation (React + Vite)
└── packages/
    ├── engine/               Pure math, vision, and planning logic
    ├── communication/        Runtime orchestration, plugins, AI services
    ├── components/           React UI — sign player, hand overlay, primitives
    ├── sdk/                  Public npm distribution facade
    └── config/               Shared TypeScript config (tsconfig.base.json)
```

**Toolchain**: Bun (package manager + runtime), Turbo (task orchestration), TypeScript 6, Oxlint + Oxfmt (lint/format), Vitest (tests).

---

## Package Dependency Graph

```
web app
  ├── @ikiraro/communication
  │     ├── @ikiraro/engine          (types, planning, vision)
  │     ├── effect / @effect/platform (dependency injection)
  │     └── @mediapipe/tasks-vision  (hand landmarking, worker only)
  └── @ikiraro/components
        └── @ikiraro/engine          (types, RendererDirector, Handshape)

@ikiraro/sdk  (npm distribution)
  ├── @ikiraro/communication
  └── @ikiraro/components
```

Rule: **engine has no runtime dependencies** (only `effect` for service tags and `zod` for schema validation). It is pure, portable, and testable without a browser.

---

## The Three Input Modes

Every session starts with one of three input modes:

| Mode                 | Source                                     | Primary path                        |
| -------------------- | ------------------------------------------ | ----------------------------------- |
| `speech`             | Microphone (Web Audio API + MediaRecorder) | Audio → Groq STT → Gloss → SignPlan |
| `text`               | Typed string                               | Text → Groq Gloss → SignPlan        |
| `sign-keys`          | Manual lexeme/fingerspell entry            | Units → deterministic SignPlan      |
| `camera-fingerspell` | Webcam (MediaPipe in Web Worker)           | Landmarks → SignToken stream        |

The first three produce a `TranslationEnvelope` that drives the 3D sign player. The camera mode produces `SignToken`s that feed into the composition buffer — they are committed to a sentence that can then be translated through the text path.

---

## Data Flow Summary

```
                        ┌───────────────────────────────────────┐
                        │           IkiraroRuntime               │
                        │  EventBus + Plugin Lifecycle           │
                        └─────────────┬─────────────────────────┘
                                      │ events
          ┌───────────────────────────┼──────────────────────────────┐
          │                           │                              │
    ┌─────▼──────┐           ┌────────▼───────┐             ┌───────▼──────┐
    │ SpeechPlugin│           │SessionPlugin   │             │VisionPlugin  │
    │ (capture)   │           │(orchestrator)  │             │(camera feed) │
    └─────┬───────┘           └────────┬───────┘             └───────┬──────┘
          │speech:cmd:stop             │                              │vision:tracking
          ▼                            │                              ▼
    Groq STT API             ┌─────────▼──────────┐      SignDetectionPipeline
          │                  │TranslationPlugin    │      (classifier + buffer)
          │translation        │(planners)           │              │
          │:cmd:request       └─────────┬───────────┘              │input:token
          │                            │                            │
          │                  GroqSemanticPlanner              CompositionPlugin
          │                  or DeterministicUnitsPlanner     (fuse + debounce)
          │                            │                            │
          └────────────────────────────▼────────────────────────────┘
                                  TranslationEnvelope
                                  (SignPlan + FrameItem[])
                                        │
                                  RendererDirector
                                  (drives SignCanvas)
                                        │
                                  3D Hand Renderer
                                  (React Three Fiber)
```

---

## Core Design Principles

### 1. Plugin architecture with a typed event bus

The runtime (`IkiraroRuntime`) coordinates plugins through `EventBus`. Plugins only communicate by emitting and subscribing to typed events. No plugin holds a direct reference to another. `EventRegistry` maps every event name to its payload type, enforced at compile time.

### 2. Deep modules behind narrow interfaces

The vision pipeline exposes `process(landmarks) → SignToken | null`. The renderer exposes `play()`, `pause()`, `seek()`, `setQueue()`. Complex implementations hide behind small surfaces, making them testable and swappable.

### 3. Effect for AI services

Groq STT and Gloss services are declared as Effect `Context.Tag` interfaces in `@ikiraro/engine/planning` and implemented in `@ikiraro/communication`. `IkiraroSDK` composes them via `Layer.mergeAll`. This keeps AI dependencies out of the engine and injectable in tests.

### 4. Local-first: Web Worker for vision

MediaPipe hand landmarking runs in a dedicated Web Worker (`hand-landmarker.worker.ts`). The main thread never touches landmark data directly — it receives `CameraTrackingState` via `postMessage`. This keeps the UI at 60fps regardless of inference cost.

### 5. Deterministic fallback

The `DeterministicUnitsPlanner` can produce a complete `TranslationEnvelope` from sign keys without any network call. The `GroqSemanticPlanner` enhances this with LLM-generated gloss when a Groq API key is present.

---

## Key Types at a Glance

| Type                  | Package       | Role                                                                              |
| --------------------- | ------------- | --------------------------------------------------------------------------------- |
| `SignToken`           | engine/types  | Atomic sign unit (lexeme, fingerspell, number, pause, pointing)                   |
| `SignPlan`            | engine/types  | Ordered clauses of `SignToken[]` with metadata                                    |
| `FrameItem`           | engine/types  | Renderer-ready frame (value, label, duration, motion, coarticulation)             |
| `TranslationEnvelope` | engine/types  | Full output: intake + plan + rendererQueue                                        |
| `IkiraroToken`        | engine/types  | Runtime input token (sign, speech, text, control) with stability                  |
| `CameraTrackingState` | engine/types  | Per-frame vision output: landmarks, classification, buffer state                  |
| `IkiraroEvent<K>`     | communication | Typed event envelope: `{ type: K, payload: EventRegistry[K], timestamp, source }` |
| `IkiraroPlugin`       | communication | Plugin interface: `setup(ctx)`, `reducer(state, event)`, `teardown()`             |
| `EventRegistry`       | communication | Map of every event name → payload type (34 events total)                          |
