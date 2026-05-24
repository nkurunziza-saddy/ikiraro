# Ikiraro Sign Language Engine: Architectural Whitepaper & Differentiators

Ikiraro is a **stateful, spatial-temporal language runtime**. It is not a 3D animation player. It is a highly concurrent, fully decoupled ecosystem designed to solve the hardest problems in digital sign language generation: spatial grammar, physical precision, and animation fluidity.

This document records every architectural decision, every package layer, and every technical differentiator that makes Ikiraro the most advanced browser-based sign language system in the world.

---

## 1. The Core Philosophy: Determinism Meets Semantics

Most sign language avatars fail because they either rely purely on LLMs (which hallucinate physical constraints and invent impossible gestures) or purely on deterministic video dictionaries (which sound robotic and lack grammatical nuance). Ikiraro bridges both via a **Two-Pass Pipeline**.

- **Pass 1 (Semantic AI - `@ikiraro/runtime`):** Natural language input (voice or text) is parsed by the `GroqSemanticPlanner`. It outputs a `SignGraph`—a highly compressed semantic intent containing roles (topic, action, object) and spatial referents.
- **Pass 2 (Deterministic Engine - `@ikiraro/engine`):** The `SignCompiler` takes the `SignGraph` and applies uncompromising physical rules. It calculates emphasis curves, transition durations, handshapes, and Inverse Kinematics (IK) arm targets. It ensures the avatar _never_ performs an impossible or grammatically incorrect physical movement.

**Decision Record:** We deliberately chose this hybrid architecture because LLMs do not understand 3D spatial boundaries, but they are unparalleled at semantic parsing. The engine enforces the physics; the LLM provides the meaning.

---

## 2. Package Architecture (Deep Dive)

The monorepo is managed by **Turborepo** and **Bun**, strictly enforcing boundaries between math, state, and UI.

### `@ikiraro/engine` (The Brain)

- **Zero Dependencies:** Pure math and TypeScript. Absolutely no DOM, React, or Node dependencies. It can run in Web Workers, Edge Functions, or native mobile environments.
- **LanguageRegistry:** A dynamic plugin system that decouples the engine from English/ASL.
- **The Compiler:** Translates a semantic `SignGraph` into a precise array of `MotionInstruction` blocks.

### `@ikiraro/runtime` (The Orchestrator)

- **Event-Driven EventBus:** A strict pub/sub architecture (`IkiraroRuntime`) that manages the flow of data.
- **Concurrency Model:** Orchestrates parallel tasks. While the microphone records audio, the `VisionPlugin` runs MediaPipe in a Web Worker, and the UI remains unblocked.
- **Plugin System:** Everything is a plugin (`SessionPlugin`, `CompositionPlugin`, `SpeechPlugin`). They intercept, debounce, and transform events.

### `@ikiraro/renderer` (The Visualizer)

- **React Three Fiber (R3F):** Declarative 3D rendering.
- **The 3-Layer Execution Loop:** Inside `sign-model-gltf.tsx`, the `RendererDirector` executes instructions frame-by-frame.

### `@ikiraro/sdk` (The Facade)

- **Exceptional DX:** Exposes a clean, unified public API (`useIkiraro`, `createIkiraroClient`). Consumers do not need to wire the engine to the runtime—the SDK handles it instantly.

---

## 3. The 3-Layer Rendering Runtime

Instead of playing pre-rendered `.glb` animation clips end-to-end (which causes violent snapping when chaining words), Ikiraro executes a mathematically blended, layered hierarchy every single frame (at 60 FPS).

1. **Layer 1: The Body (AnimationMixer)**
   Uses high-quality Rokoko/Mixamo mocap clips for natural spine sway, breathing, and base body arcs. This provides the organic "human feel".
   _Decision:_ We kept standard Mixamo rigs rather than forcing a proprietary Rokoko character, ensuring maximum compatibility with open-source 3D models.

2. **Layer 2: Spatial Overrides (Procedural IK)**
   The true powerhouse. It mathematically calculates exactly where the wrists and arms need to be to execute the sign, overriding the mocap layer using Inverse Kinematics. This guarantees _millimeter precision_ for fingerspelling and spatial grammar.

3. **Layer 3: Hands & Face (Direct Bone/Morph Control)**
   Handshapes (like a tight 'A' fist or open '5' hand) and facial micro-expressions (raised eyebrows for questions, squinting for emphasis) are applied strictly on top of the IK layer.

---

## 4. Episodic Spatial Memory (Stateful Grammar)

Sign language is intrinsically spatial. You do not just sign "HE GAVE IT TO HER" in the center of your chest. You establish "HE" on the left, "HER" on the right, and move the sign for "GIVE" between those points.

- **Persistent 3D Canvas:** Ikiraro implements an `EpisodicSpatialMemory`. When the engine encounters a pronoun, it assigns a 3D anchor (a coordinate in space) to that concept.
- **Referential Pointing:** Subsequent signs referring to that entity automatically adjust their `armTarget` IK overrides to interact with that established 3D slot.
- **TTL Decay:** Memory resets gracefully when topics shift or sessions restart, mirroring natural human conversation.

---

## 5. Multilingual Agnosticism (The Plugin System)

Ikiraro is not hardcoded to American Sign Language (ASL). It features a completely decoupled `LanguageRegistry` and `SignLanguagePlugin` architecture.

- **Hot-Swappable Languages:** Developers can instantly switch between ASL, Rwanda Sign Language (RSL), or any other language at runtime (`LanguageRegistry.setActive('rsl')`).
- **Encapsulated NLP Rules:** Each plugin dictates its own pronoun resolution (e.g., Kinyarwanda noun classes), its own native lexicon mapping, its own procedural fingerspelling logic, and its own unique set of handshapes.

---

## 6. Concurrency & Web Worker Vision

Performance is paramount. A sign language avatar must render at 60 FPS while simultaneously handling camera streams, microphone inputs, and network requests.

- **Web Worker Offloading:** The `@mediapipe/tasks-vision` Holistic landmarker runs entirely inside a dedicated Web Worker (`holistic-landmarker.worker.ts`). This ensures that heavy tensor calculations never block the React UI thread.
- **Debounced Composition:** The `CompositionPlugin` handles rapid input (typing or signing) by debouncing tokens in a 400ms window, collapsing redundant characters before sending them to the compiler.
- **Non-Blocking LLMs:** If the Groq API lags, the runtime gracefully falls back or pauses the semantic track, while deterministic track requests (like typing a letter) resolve instantly (0 network latency).

---

## 7. Developer Experience (DX) & Fallback Reliability

We built Ikiraro so that a Junior Developer can drop an avatar into a React app in 3 lines of code.

- **The `useIkiraro` Hook:** Wraps the entire highly concurrent ecosystem in a simple, reactive hook. `const { translate, isTranslating } = useIkiraro()` is all it takes.
- **Graceful Degradation:** If the user does not provide a Groq API key, the system does not crash. It seamlessly falls back to the `DeterministicUnitsPlanner`, which completely bypasses the network and translates inputs locally using the active language plugin.
- **Strict Type Safety:** Using Zod and strict TypeScript configurations, all Events, Payloads, and Motion Instructions are typed end-to-end. If an action word is added to the `ASLPlugin`, the type-checker enforces that its pose exists in the dictionary.

---

## Summary of Core Architectural Decisions

1. **Separation of Concerns:** Engine (Math) -> Runtime (State) -> Renderer (UI).
2. **Hybrid Intelligence:** LLMs for intent. Deterministic algorithms for physics.
3. **Mocap as a Base, IK as a Law:** Mocap provides human flair, but IK overrides enforce precise signing.
4. **Stateful over Stateless:** Avatars must remember spatial entities across sentences to speak grammatically correct sign language.
5. **Language Plugins over Hardcoding:** Building for scalability so new languages can be integrated without touching core engine logic.
6. **Thread Isolation:** Offloading computer vision to Web Workers for uncompromised rendering performance.
