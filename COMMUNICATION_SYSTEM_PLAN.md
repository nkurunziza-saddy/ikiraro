# Sensa Communication System Plan

Date: 2026-05-12

## Why This Plan Exists

The current repo has a real idea inside it, but the editable product surface and the communication libraries are out of sync:

- The checked-in web dashboard is still a placeholder.
- The sign/communication logic exists only as compiled package output in the workspace.
- The current sign logic is closer to a fingerspelling/classification prototype than a production communication bridge.

This plan separates immediate product work from the deeper accuracy work that has to happen before this becomes a trustworthy npm package.

## Current Review

### 1. Package structure is blocking the real library direction

What is happening:

- `packages/shared` and `packages/communication` contain built `dist/` output in the current workspace, but not the editable `src/` tree and package manifest structure needed for clean maintenance.
- Turbo currently scopes active workspace work to `@sensa/auth`, `@sensa/config`, `@sensa/db`, `@sensa/env`, `@sensa/infra`, `server`, and `web`, which means the sign libraries are not in the active typed build graph.

Why this matters:

- You cannot turn the communication bridge into a reliable npm package if its core source is not first-class in the workspace.
- Accuracy work becomes unsafe because you are effectively patching compiled output instead of evolving tested source modules.

How to fix it:

1. Restore `packages/shared` as a normal workspace package with `package.json`, `tsconfig.json`, and editable `src/`.
2. Restore `packages/communication` the same way.
3. Move the current compiled logic back into typed source files.
4. Add tests before changing behavior.

### 2. The current recognition logic is a useful prototype, not the final translation engine

What is happening:

- The current logic uses handcrafted landmarks, a heuristic feature vector, a static handshape lookup table, and a word buffer.
- This is enough for early fingerspelling experiments and diagnostics.
- It is not enough for high-accuracy conversation-grade sign communication.

Why this matters:

- Real sign communication is not just handshape classification.
- Similar-looking signs, dynamic signs, body position, palm orientation, facial expression, and context all matter.

How to fix it:

1. Keep the current classifier as the low-level gesture and fingerspelling layer.
2. Add a higher semantic layer that turns text or speech into a structured sign plan.
3. Treat fingerspelling as a fallback path for names, numbers, and unknown terms.

### 3. Speech-to-sign cannot be word substitution

What is happening:

- The existing direction implicitly moves from speech or letters toward signs without a stable semantic planning layer.

Why this matters:

- Spoken English and ASL do not share grammar one-to-one.
- A system that simply rewrites words or letters into sign tokens will look plausible but be wrong.

How to fix it:

1. Build a normalization stage that converts input into structured meaning.
2. Produce a sign-plan intermediate representation.
3. Drive the renderer from that sign-plan, not directly from raw transcript text.

## Proven Direction To Use

This is the direction I recommend:

### A. Two-track architecture

Track 1: fast deterministic interaction

- Fingerspelling
- Sign keyboard
- Fixed phrase library
- Manual confirmation controls

Track 2: semantic translation

- Speech or text input
- Language normalization
- Structured sign-plan generation
- Avatar rendering

Reason:

- Track 1 gives you dependable fallback behavior.
- Track 2 is where accuracy improves over time without breaking the simple product API.

### B. A sign-plan intermediate representation

Do not send raw text directly to the SVG/WebGL renderer.

Instead, define a stable intermediate object:

```ts
type SignPlan = {
  sourceText: string;
  normalizedText: string;
  clauses: Array<{
    intent: string;
    tokens: Array<{
      type: "lexeme" | "fingerspell" | "pause" | "pointing" | "number";
      value: string;
      durationMs?: number;
      emphasis?: "low" | "normal" | "high";
    }>;
  }>;
  metadata: {
    confidence: number;
    fallbackUsed: boolean;
    reviewNeeded: boolean;
  };
};
```

Why:

- Your renderer can stay deterministic.
- Your LLM layer can change later without breaking the avatar contract.
- You can test sign planning separately from rendering.

### C. Use Groq for normalization, not for invented sign truth

Recommended Groq role:

- Speech-to-text
- Sentence cleanup
- Entity preservation
- Structured output into the `SignPlan` schema
- Clarification and fallback policies

Do not use Groq to:

- freestyle sign sequences with no schema
- invent nonexistent lexicon mappings
- bypass manual or rule-based fallback for unknown signs

Why:

- LLMs are useful for semantic cleanup and structure.
- They are not an authoritative source of sign correctness on their own.

### D. Keep context across turns

Conversation context should be part of the translation state:

- recent turns
- speaker role
- unresolved references
- named entities
- active topic

Why:

- Discourse matters in sign translation.
- Isolated sentence handling will cap accuracy early.

## Package Design

The library should expose one simple surface and keep the hard parts internal.

### Public API

```ts
export type CommunicationMode = "speech" | "text" | "sign-keys";

export interface TranslateInput {
  mode: CommunicationMode;
  value: string | Blob;
  context?: {
    conversationId?: string;
    previousTurns?: Array<{ role: "hearing" | "signer"; text: string }>;
    locale?: string;
  };
}

export interface CommunicationBridge {
  translate(input: TranslateInput): Promise<TranslationResult>;
  fingerspell(text: string): Promise<SignPlan>;
  plan(text: string, context?: TranslateInput["context"]): Promise<SignPlan>;
  render(plan: SignPlan): Promise<RendererOutput>;
}
```

### Internal modules

1. `capture`
   - microphone adapters
   - browser speech APIs
   - camera/sign keyboard adapters

2. `normalize`
   - punctuation cleanup
   - entity handling
   - sentence segmentation

3. `planning`
   - lexical lookup
   - Groq structured output
   - fallback policy

4. `render`
   - SVG/WebGL contract
   - timing
   - transition rules

5. `evaluation`
   - lexical tests
   - phrase tests
   - conversation tests

## Workstreams

## Workstream 0: Recover the packages

Tasks:

1. Restore `packages/shared` source and package manifest.
2. Restore `packages/communication` source and package manifest.
3. Add them back to the active build graph.
4. Verify `bun run check-types` and `bun run build` include them.

Why:

- This is prerequisite work. Everything else sits on top of it.

How:

- Recreate package manifests using the same workspace conventions as `@sensa/auth` and `@sensa/env`.
- Move compiled logic into `src/`.
- Add tests before refactoring behavior.

## Workstream 1: Input adapters

Tasks:

1. Add a text adapter.
2. Add a sign keyboard adapter with click and physical keyboard support.
3. Add a speech adapter using Groq STT for production.
4. Keep the browser speech API only as a local preview tool.

Why:

- Input capture must be swappable without changing the planning layer.

How:

- Standardize all input sources into a shared `NormalizedInput` object.

## Workstream 2: Gesture and fingerspelling foundation

Tasks:

1. Keep the current low-level classifier as a prototype baseline.
2. Add missing letters and explicitly mark dynamic signs as unsupported until motion logic exists.
3. Extend features beyond curl and three distances:
   - handedness
   - palm orientation
   - thumb placement
   - finger crossing
   - motion traces
4. Add tests for ambiguous letters and repeated letters.

Why:

- The current layer is useful but too narrow for robust output.

How:

- Add test fixtures from landmark snapshots.
- Build a confusion matrix for commonly confused letters.

## Workstream 3: Translation and sign planning

Tasks:

1. Create a canonical sign lexicon interface.
2. Add rule-based phrase handling for high-value domains.
3. Add Groq structured outputs for semantic normalization into `SignPlan`.
4. Add explicit fallback markers:
   - fingerspell
   - unknown token
   - clarification required

Why:

- This is where the system becomes communication-oriented rather than demo-oriented.

How:

- Use JSON-schema-constrained outputs.
- Keep sign planning deterministic after model output validation.

## Workstream 4: Renderer contract

Tasks:

1. Define the exact contract between planner and SVG/WebGL renderer.
2. Encode timing, boundaries, coarticulation hints, and fallback markers.
3. Separate diagnostics from user-facing rendering.

Why:

- The renderer should not need to infer meaning from raw strings.

How:

- Introduce a `RendererFramePlan` generated from `SignPlan`.
- Keep a debug mode that shows tokens and timings on screen.

## Workstream 5: Communication UI

Tasks:

1. Keep one page with three entry modes:
   - speech
   - text
   - sign keyboard
2. Show the pipeline stages visibly:
   - raw input
   - normalized text
   - sign plan
   - renderer queue
3. Keep conversation context visible.
4. Add operator controls:
   - confirm
   - correct
   - replay
   - fingerspell fallback

Why:

- This creates a product flow that matches the library flow.

How:

- Treat the dashboard as a consumer of the library, not as a place where translation logic lives.

## Workstream 6: Evaluation and quality bar

Tasks:

1. Build a benchmark set:
   - isolated letters
   - common phrases
   - domain phrases
   - multi-turn conversations
2. Add regression tests for:
   - repeated letters
   - proper nouns
   - numbers
   - unknown vocabulary
3. Add human review with fluent Deaf signers before claiming accuracy.

Why:

- Accuracy claims need evidence, not intuition.

How:

- Track precision and fallback rate separately.
- Track semantic correctness and rendering correctness separately.

## Immediate Implementation Sequence

1. Recover `packages/shared` and `packages/communication` as editable packages.
2. Wire `apps/web` to consume the library through one clean bridge API.
3. Add production speech-to-text through Groq.
4. Add `SignPlan` structured output generation with schema validation.
5. Connect `SignPlan` to the SVG/WebGL renderer.
6. Add test fixtures and benchmark tasks.
7. Run human review on core conversation paths.

## Open Questions

These answers affect the exact implementation:

1. Is the initial production target strictly ASL, or do you need multiple sign languages later?
2. Do you want the first serious accuracy push to focus on fingerspelling plus fixed phrases, or direct sentence-level signing?
3. What domain matters first: general conversation, support, healthcare, education, or something else?
4. Is the avatar renderer expected to handle non-manual markers soon, or only hand/arm output in the first production version?
