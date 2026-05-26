# Ikiraro Codebase & Architecture Map

This document is the ultimate developer map. It explains **exactly** how every major file in the monorepo connects, why it was designed this way, and traces the absolute flow of data from a user typing a word to the 3D avatar moving its fingers.

---

## 1. High-Level Data Flow

Before diving into files, you must understand the singular, unbreakable flow of data in Ikiraro:

1. **Input:** User types "HELLO" (or speaks/signs).
2. **Runtime (`@ikiraro/runtime`):** Captures the input via an EventBus, debounces it, and sends it to the LLM (or deterministic fallback).
3. **Parser (`@ikiraro/engine/linguistic`):** Analyzes the raw English gloss and assigns grammatical roles (Topic, Action) and 3D spatial anchors (Episodic Memory). Outputs a `SignGraph`.
4. **Compiler (`@ikiraro/engine/compiler`):** Translates the `SignGraph` into raw physical rules (`MotionInstruction[]`), attaching exact handshapes and IK targets.
5. **Director (`@ikiraro/engine/planning`):** A playback head that reads the `MotionInstruction[]` timeline. It uses the **Trajectory Engine** to calculate physical paths and the **Kinematic Controller** to ensure smooth, spring-tracked arm transitions.
6. **Renderer (`@ikiraro/renderer`):** The Three.js loop asks the Director "what is the current state?", and applies the calculated **KinematicPose** to the 3D model's bones.

---

## 2. `@ikiraro/engine` (The Brain)

This package contains pure math and logic. It has zero dependencies on React or the DOM.

### `trajectories/` (The Trajectory Engine)

- **What it is:** A polymorphic engine that separates **Rhythm** (how fast/slow/held a sign is) from **Space** (the physical path).
- **Why we did it:** To avoid a massive switch statement and allow signs to have natural "Hold" phases at their peaks. It replaces the old monolithic `motion-paths.ts`.

### `kinematics/` (The Kinematic Controller)

- **What it is:** A stateful physical engine that uses multi-variate spring tracking to manage the avatar's arm positions.
- **Why we did it:** To prevent "teleporting" hands. When switching between signs at different targets (e.g., forehead to chin), the Kinematic Controller guarantees a smooth, physically-plausible transition.

### `linguistic/parser.ts` & `linguistic/spatial-grammar.ts`
...

- **What it is:** Pass 1 of the engine. The parser converts sequential words into a grammatical `SignGraph`. `spatial-grammar.ts` tracks where entities live in 3D space.
- **Why we did it:** If you sign "HE GAVE IT TO HER", you cannot just sign it in the center of your chest. The parser intercepts pronouns, registers them in `EpisodicSpatialMemory` (e.g., assigning "HE" to the left, "HER" to the right), and passes those coordinates down.

### `compiler/sign-compiler.ts`

- **What it is:** Pass 2 of the engine. It takes the `SignGraph` and loops through it, validating it against the `LanguageRegistry`.
- **Why we did it:** LLMs hallucinate. The compiler enforces physical reality. If the parser says "Sign HELLO with emphasis", the compiler calculates exactly how many milliseconds that takes (e.g., 900ms), what the handshape is (open 'B' hand), and what the IK arm target is (near the forehead). It outputs a flat array of `MotionInstruction` blocks.

### `planning/renderer-director.ts`

- **What it is:** The bridge between the static compiler output and the real-time 3D renderer.
- **Why we did it:** We need a way to play, pause, seek, and interpolate between signs. The Director manages an internal clock (`currentTime`). When the renderer asks for the current frame, the Director finds the active `MotionInstruction` and applies `coarticulation` (smoothing) if we are transitioning between two signs.

---

## 3. `@ikiraro/runtime` (The Orchestrator)

This package manages state, side-effects (like microphone/camera), and asynchronous events.

### `ikiraro-runtime.ts`

- **What it is:** A strict pub/sub EventBus. Every action in the system is an event (e.g., `translation:cmd:request`, `vision:tracking`).
- **Why we did it:** React state is too slow and messy for real-time AI pipelines. The EventBus allows components to talk to each other without prop-drilling or re-rendering the whole tree.

### `plugins/composition-plugin.ts`

- **What it is:** Intercepts keyboard/input events and buffers them.
- **Why we did it:** If a user types "H-E-L-L-O", we don't want to fire 5 separate translation requests to the LLM. The composition plugin debounces the input in a 400ms window and dispatches a single batched translation request.

### `workers/holistic-landmarker.worker.ts`

- **What it is:** A Web Worker that runs the Google MediaPipe computer vision model.
- **Why we did it:** Running tensor calculations on the main thread causes the 3D avatar to stutter and drop frames. By isolating the vision model in a worker thread, the UI stays at a buttery-smooth 60 FPS while the camera tracks the user's hands.

---

## 4. `@ikiraro/renderer` (The UI Layer)

This package handles the actual React Three Fiber (R3F) integration.

### `avatar-viewer.tsx`

- **What it is:** The React component wrapper that sets up the Three.js Canvas, lighting, and camera.
- **Why we did it:** To provide a clean, drop-in `<AvatarViewer envelope={translation} />` component for developers using the SDK.

### `sign-model-gltf.tsx`

- **What it is:** The most complex file in the renderer. It loads the Mixamo `.glb` model and executes the **3-Layer Render Loop** inside `useFrame`.
- **Why we did it like this:**
  We must execute layers in a strict order every frame:
  1. `mixer.update(delta)`: Play the base mocap (breathing/sway).
  2. `applyIK()`: Mathematically force the arm bones to reach the `armTarget` defined by the Director.
  3. `applyHandshapes()` & `applyFacialExpressions()`: Overwrite the finger bones and morph targets perfectly on top of the IK.
     If we did this in the wrong order, the mocap animation would overwrite our precise sign language hand shapes.

---

## 5. End-to-End Code Example: "HELLO"

Here is exactly what happens in the code when the system processes the word "HELLO":

1. **User Types:**
   `runtime.dispatch({ type: "translation:cmd:request", payload: { text: "HELLO" } })`
2. **Parser Translates to Graph:**
   ```json
   {
     "gloss": "HELLO",
     "role": "action", // assigned by LinguisticParser
     "spatialAnchor": undefined
   }
   ```
3. **Compiler Resolves Physics (via LanguageRegistry):**
   ```json
   {
     "bodyMotion": "salute-out",
     "handshape": "B-open",
     "armTarget": { "rArmX": 1.2, "rArmZ": -0.5 }, // near forehead
     "duration": 600
   }
   ```
4. **Director Interpolates (Frame 30):**
   "We are 300ms into the HELLO sign. Lerp the arm 50% of the way to the armTarget."
5. **Renderer Draws (sign-model-gltf.tsx):**
   Applies the calculated rotation quaternions to `RightArm` and `RightForeArm` using the IK solver, applies the `B-open` rotation array to the 15 finger bones, and renders the pixel to the screen.
