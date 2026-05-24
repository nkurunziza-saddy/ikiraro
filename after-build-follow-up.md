# Post-Build / Follow-up Guide

This document is for future AI agents and developers picking up the Ikiraro project. It explains how to handle changes, our package management system, and the web platform implementation.

## 1. Package Management & Build System

The Ikiraro SDK is a **Turborepo** monorepo using **Bun**.

### Key Commands:

- `bun run check-types`: Runs strict type-checking across all packages (`@ikiraro/engine`, `@ikiraro/runtime`, `@ikiraro/renderer`, `@ikiraro/sdk`, and `web`). ALWAYS run this after refactoring core engine types.
- `bun run build`: Triggers the Turborepo pipeline. It builds the Vite app (`web`) and compiles the TS SDK packages using `tsup`.
- `bun run dev`: Starts the web platform (Vite dev server) on localhost.

### Package Architecture

- **`@ikiraro/engine` (Pure TypeScript):** The deterministic brain. Contains the `LanguageRegistry`, compilers, parsers, and poses. Absolutely NO React, DOM, or Node dependencies allowed.
- **`@ikiraro/runtime` (State & Events):** The `IkiraroRuntime` orchestrator. Connects to Groq (LLMs) and manages the event bus.
- **`@ikiraro/renderer` (React + Three.js):** Contains `AvatarViewer` (R3F) and UI overlays. Consumes `MotionInstruction[]` from the engine to drive GLTF avatars.
- **`@ikiraro/sdk` (Facade):** Re-exports the public API of the above three packages for external consumers.
- **`apps/web` (or `web` directory):** The consumer React app. Uses `@ikiraro/sdk` (or the underlying packages) to render the UI.

## 2. Web Platform Implementation Notes

### React UI Initialization

In the `web` platform, the `useIkiraro` hook initializes the engine.
**Crucial Note on Language Loading:** The `LanguageRegistry` must be loaded _before_ any translation happens. To ensure this, `packages/engine/src/planning/index.ts` automatically runs:

```ts
LanguageRegistry.register(ASLPlugin);
LanguageRegistry.register(RSLPlugin);
LanguageRegistry.setActive("asl");
```

When `web` (or the runtime) imports the engine, the active language is instantly ready. To switch languages from the UI, call `LanguageRegistry.setActive('rsl')` before dispatching a translation.

## 3. How to Pick Up Where We Left Off (The 30% Mark)

If you are a future agent tasked with completing "Phase 2 Polishing" (from `roadmap.md`):

1. **Test the Runtime:** Before changing code, run `bun run dev` and ensure the Avatar renders and responds to text input.
2. **Diagnose via Logs:** The runtime emits detailed timeline logs. If the avatar "just raises its hand" or snaps violently, check the `MotionInstruction[]` payload in the DevTools console.
3. **Refining Coarticulation (`coarticulation.ts`):** Your primary task is smoothing transitions. When a sign ends and the next begins, `getTransitionRule()` determines the blend time. Adjust `RendererDirector` or the procedural path IK curves so fingers don't "snap" instantly between lexemes.
4. **Expanding Lexicons (`asl-plugin.ts` / `rsl-plugin.ts`):** When adding new signs, you must map a `LexemePose` consisting of a `Handshape` (defined in `pose-library.ts`), a `motion` (procedural delta), and an `armTarget` (3D coordinate for the IK solver).
5. **DO NOT Convert the Avatar to Rokoko:** Keep Michelle as the Mixamo-rigged avatar. Rokoko/Mocap clips are only used as _motion sources_ for the base body layer, while the procedural IK engine overrides the arms/hands.

## 4. Golden Rules for Modification

1. **Preserve the 3-Layer Execution:**
   - Layer 1: Body Mocap (AnimationMixer)
   - Layer 2: Spatial Overrides (Arm/Wrist IK)
   - Layer 3: Handshapes (Finger bones) & Face (Morph targets)
2. **Never Break the Registry:** If you extract a new language (e.g., BSL), create `bsl-plugin.ts`, implement `SignLanguagePlugin`, and add it to `LanguageRegistry` inside `planning/index.ts`.
3. **Use Types:** `types.ts` is the absolute source of truth. Do not bypass `SignPlan` or `MotionInstruction` with `any`.
