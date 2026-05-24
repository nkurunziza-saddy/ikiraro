# Ikiraro Sign Language Engine - Roadmap & Architecture History

This document serves as the master roadmap for the Ikiraro engine and a historical record of the architectural implementation plan we have completed so far.

## Part 1: What We Built (The 30% Foundation)

We successfully transitioned the engine from a simple sequential animation player into a **2-Pass Spatial-Temporal Language Runtime**.

### Phase 1: Core Linguistic Architecture

- **Linguistic Parser (Pass 1):** Replaced hardcoded gloss-to-clip mappings with a semantic parser that outputs a `SignGraph`. It understands intent (statements vs questions), roles (topic, action, object), and spatial referents (e.g., mapping pronouns to 3D coordinate slots).
- **Spatial Grammar & Memory:** Implemented an `EpisodicSpatialMemory` that tracks 3D coordinates for entities (like "JOHN" or "YOU") within a conversation session, enabling natural referential pointing.
- **Sign Compiler (Pass 2):** Built a deterministic compiler that translates the `SignGraph` into precise `MotionInstruction` blocks. It handles timing normalization, emphasis curves, and transition injections (pre-computing blends based on motion arcs).
- **Director & Render Loop Upgrade:** Rewrote the `RendererDirector` to consume `MotionInstruction` timelines instead of a naive frame queue. Updated the Three.js GLTF render loop (`sign-model-gltf.tsx`) to implement a strict 3-layer execution logic (Mixer for body -> IK for spatial overrides -> Handshapes for fingers -> Morph Targets for face).

### Phase 2: Multilingual & RSL Support

- **Language Plugin Architecture:** Decoupled the engine from hardcoded ASL/English. Created the `SignLanguagePlugin` interface and a `LanguageRegistry`.
- **ASL Plugin:** Extracted all ASL specific dictionary items, poses, and NLP rules into a standalone `ASLPlugin`.
- **RSL Plugin:** Scaffolded the `RSLPlugin` (Rwanda Sign Language) stub with Kinyarwanda NLP rules, proving the engine can dynamically switch languages at runtime.

---

## Part 2: Polishing the Foundation (Getting from 30% to 100%)

Before adding new massive features, our immediate focus is polishing the current foundation to achieve highly fluid, production-grade sign generation.

### 1. Linguistic Tuning

- **Lexicon Expansion:** Populate the `ASLPlugin` and `RSLPlugin` dictionaries with a comprehensive vocabulary.
- **Advanced Coarticulation:** Refine the `computeCoarticulationOffsets` logic so hands don't snap when interpolating between complex handshapes. Add "Sign Elision" (skipping redundant motions) and "Sign Merging" (fluidly blending two signs like THANK + YOU into one continuous arc).
- **Procedural Motion Path Tuning:** Fine-tune the Bezier/IK curves for the `MotionDelta` procedural paths (e.g., `j-trace`, `wrist-twist`) to feel less robotic and more human.

### 2. Handshape Precision

- **Finger IK Smoothing:** Introduce a slerp-based smoothing layer for finger bones so transitioning from a tight fist ('A') to a spread hand ('5') happens on a natural biological curve rather than linear interpolation.
- **Micro-expression Timings:** Tie facial blendshapes strictly to the emphasis curves of the compiler so that eyebrows and squints react precisely at the apex of the sign.

### 3. State Management & Transitions

- **Inertial Blending:** Implement the "inertial" transition type for when the avatar abruptly changes direction (e.g., pushing forward then instantly pulling back).
- **Memory Decay:** Fine-tune the TTL (Time-To-Live) for `EpisodicSpatialMemory` so that the avatar naturally "forgets" spatial anchors when topics shift.

---

## Part 3: Future Roadmap (Phases 3 & 4)

Once the core animation is polished and perfected, we will proceed with the following phases:

### Phase 3: Browser Accessibility Agent

**Goal:** Enable the Ikiraro engine to read and interact with the DOM, allowing the avatar to natively narrate e-commerce sites or web applications.

- **DOM Observer:** A mutation observer to detect focused elements, ARIA labels, and product details.
- **Interactive Prompts:** The avatar can look at specific HTML elements using `spatialTarget` IK overrides to direct the user's attention.
- **Action Execution:** The agent can click, scroll, and add items to a cart on behalf of the user via voice/sign commands.

### Phase 4: Premium Voice & Audio Engine

**Goal:** Integrate top-tier Text-To-Speech (TTS) for the avatar's vocalizations when signing.

- **ElevenLabs Integration:** Implement the ElevenLabs API for highly emotive, natural voices.
- **Voice-to-Sign Synchronization:** Ensure the audio phonemes and sign language timings align correctly, prioritizing the manual sign speed while stretching/compressing audio dynamically if necessary.
- **Local Fallback:** Ensure standard Browser SpeechSynthesis remains available as an offline/free fallback.
