# Getting Started

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3.11
- Node.js ≥ 20 (for tooling compatibility)
- A [Groq](https://console.groq.com) API key (free tier is sufficient for development)

---

## Setup

```bash
# Clone and install
git clone <repo-url>
cd sensa
bun install
```

Create an environment file for the web app:

```bash
# apps/web/.env.local
VITE_GROQ_API_KEY=gsk_...
```

---

## Development

```bash
# Start the web reference implementation
bun run dev:web

# Type-check all packages
bun run check-types

# Lint and format
bun run check

# Run tests
bun test
```

The web app runs at `http://localhost:5173`.

---

## Project Commands

| Command                       | What it does                                     |
| ----------------------------- | ------------------------------------------------ |
| `bun run dev:web`             | Start Vite dev server for `apps/web`             |
| `bun run check-types`         | TypeScript check across all 5 packages via turbo |
| `bun run check`               | Oxlint (lint) + Oxfmt (format, writes)           |
| `bun test`                    | Vitest across all packages                       |
| `bun run build`               | Build all packages for production via turbo      |
| `bun run release:sdk:publish` | Verify + publish `@ikiraro/sdk` to npm           |

---

## Monorepo Structure

```
sensa/
├── apps/
│   └── web/                  Vite + React + TanStack Router reference app
│       ├── src/
│       │   ├── routes/       File-based routes (dashboard, sdk-test)
│       │   ├── components/   CameraPanel, SpeechComposer, TextComposer, etc.
│       │   └── hooks/        useCommunicationSession
│       └── vite.config.ts
│
└── packages/
    ├── engine/               Pure domain logic — no browser APIs
    ├── communication/        Runtime, plugins, AI services, React hooks
    ├── components/           React UI components (sign player, overlays)
    ├── sdk/                  npm distribution facade
    └── config/               Shared tsconfig.base.json
```

---

## Using the Runtime Directly

```typescript
import { createIkiraro } from "@ikiraro/communication";

const runtime = await createIkiraro({
  sdk: { groqApiKey: "gsk_..." },
});

// Subscribe to translation output
runtime.subscribe("translation:finished", (event) => {
  const envelope = event.payload; // TranslationEnvelope
  console.log(envelope.plan.glossText);
  console.log(envelope.rendererQueue); // FrameItem[] ready for renderer
});

// Translate text
runtime.dispatch({
  type: "session:cmd:start",
  payload: { mode: "text", text: "Hello, how are you?" },
  timestamp: Date.now(),
  source: "app",
});

// Clean up
await runtime.stop();
```

---

## Using the Vision Pipeline

```typescript
import { createIkiraro, WorkerHandProcessor } from "@ikiraro/communication";

const processor = new WorkerHandProcessor();

const runtime = await createIkiraro({
  sdk: { groqApiKey: "gsk_..." },
  vision: { processor },
});

// Subscribe to camera tracking state
runtime.subscribe("vision:tracking", (event) => {
  const { currentWord, sentenceText, classification } = event.payload;
  // Update UI with live fingerspelling
});

// Subscribe to committed tokens (words)
runtime.subscribe("input:token", (event) => {
  if (event.payload.stability === "committed") {
    console.log("Committed:", event.payload.value);
  }
});

// Start camera (pass the <video> element)
runtime.dispatch({
  type: "vision:cmd:start",
  payload: { videoElement: document.querySelector("video")! },
  timestamp: Date.now(),
  source: "app",
});
```

---

## Using the Sign Player

```typescript
import { SignPlayer3D, PipelineView } from "@ikiraro/components";

// Simple sign player (auto-plays when envelope changes)
<SignPlayer3D envelope={translationEnvelope} autoPlay loop={false} />

// Full pipeline view (shows gloss, stats, sign player, frame steps)
<PipelineView envelope={translationEnvelope} />
```

---

## Adding a New Plugin

1. Create `packages/communication/src/runtime/plugins/my-plugin.ts`:

```typescript
import type { IkiraroPlugin, PluginContext, IkiraroEvent } from "../types";

export interface MyPluginState {
  count: number;
}

export class MyPlugin implements IkiraroPlugin<MyPluginState> {
  name = "my-plugin";
  initialState: MyPluginState = { count: 0 };

  setup(ctx: PluginContext<MyPluginState>) {
    const unsub = ctx.subscribe("translation:finished", (event) => {
      ctx.emit({
        type: "input:unit",
        payload: { unit: "DONE", confidence: 1.0, type: "sign" },
        timestamp: Date.now(),
        source: this.name,
      });
    });

    return unsub; // returned function is called on teardown
  }

  reducer(state: MyPluginState, event: IkiraroEvent): MyPluginState {
    if (event.type === "translation:finished") {
      return { ...state, count: state.count + 1 };
    }
    return state;
  }
}
```

2. Pass it to `createIkiraro` (or `articulate` directly):

```typescript
import { articulate } from "@ikiraro/communication";

const runtime = await articulate({
  plugins: [
    new SessionPlugin(),
    new CompositionPlugin(),
    new TranslationPlugin(),
    new SpeechPlugin(),
    new MyPlugin(),
  ],
});
```

---

## Adding a New Gloss

To add a known ASL gloss that the Groq planner can produce (for accurate timing and lexeme rendering):

1. Add to `GLOSS_REGISTRY` in `packages/engine/src/planning/gloss-registry.ts`:

```typescript
HAPPY: { label: "Happy", durationMs: 500 },
SAD: { label: "Sad", durationMs: 480 },
```

2. Add the 3D handshape to `ASL_HAND_POSES` in `packages/engine/src/planning/pose-library.ts` if it requires a novel handshape (most existing glosses use letters already defined there).

---

## Running Tests

```bash
# All tests
bun test

# Single package
cd packages/engine && bun test

# Watch mode
bun test --watch
```

Test files are co-located with source files using the `.test.ts` suffix. Currently tested: planning tokenizer, pose library, and the surgical classifier.

---

## Environment Variables

| Variable            | Required                    | Where                 |
| ------------------- | --------------------------- | --------------------- |
| `VITE_GROQ_API_KEY` | Yes (for text/speech modes) | `apps/web/.env.local` |

The Groq API key is used client-side (embedded in the Vite bundle). For production, proxy the API call through a server to avoid key exposure.

---

## Debugging

**Dev mode feature**: When running with `import.meta.env.DEV === true`, the worker logs high-confidence sign detections to the console:

```
[ikiraro:calibrate] sign=A confidence=0.92 { fingerprint: "00000", thumbVsFingerDepth: -0.12, ... }
```

**Inspector**: The `SensaInspector` dev component (in `apps/web/src/components/dev/`) connects to `InspectorPlugin` and shows a live event stream from the runtime bus. Add it anywhere in the dev app:

```typescript
import { SensaInspector } from "@/components/dev/sensa-inspector";
<SensaInspector runtime={runtime} />
```
