# ikiraro

Ikiraro is a type-safe, local-first ASL (American Sign Language) translation SDK. It provides a robust pipeline for handling multimodal communication (speech, text, and manual sign input) and orchestrating computer vision to map hand tracking to a semantic sign sequence.

## Architecture

This project is structured as a standalone SDK rather than a monolithic fullstack application. All heavy lifting—including LLM-based Gloss generation and high-frequency hand tracking—has been pushed to the edges (browser or local runtime) via `@effect/platform`.

### Packages

- `@ikiraro/engine` - The core mathematical, planning, and vision logic. Pure, dependency-free TypeScript. Contains the surgical gesture classifier.
- `@ikiraro/runtime` - The orchestrator. Exposes the `IkiraroSDK` powered by `effect` and `IkiraroRuntime` which acts as an event bus for combining streams of signs and speech.
- `@ikiraro/renderer` - A specialized suite of React components for visualizing hand tracking, pipelines, and ASL rendering.
- `web` - A reference implementation dashboard that consumes the SDK.

## Getting Started

You will need a [Groq API Key](https://console.groq.com/keys) to power the speech-to-text (Whisper) and English-to-Gloss (LLaMA 3) translations.

```bash
bun install

# Create local environment config for the dashboard
echo "VITE_GROQ_API_KEY=your_key_here" > apps/web/.env.local

# Run the local-first console
bun run dev:web
```

## SDK Usage

To use Ikiraro in a React app, initialize the runtime with your config:

```tsx
import { createIkiraroClient, AvatarViewer } from "@ikiraro/sdk";

// Initialize once globally
export const ikiraroClient = createIkiraroClient({
  sdk: { groqApiKey: "YOUR_KEY" },
});
export const { useIkiraro } = ikiraroClient;

function App() {
  const { snapshot, translate } = useIkiraro();

  return <AvatarViewer envelope={snapshot.lastEnvelope} modelUrl="/avatar.glb" />;
}
```

## Workflows

- `bun run dev:web`: Start the console locally
- `bun run check-types`: Check TypeScript types across all apps
- `bun run check`: Run Oxlint and Oxfmt
- `bun run test`: Run the Vitest test suites
