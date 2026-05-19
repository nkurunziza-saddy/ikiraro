# @ikiraro/sdk

The SDK package is the public npm distribution facade. It re-exports the full public API of `@ikiraro/communication`, `@ikiraro/components`, and selected `@ikiraro/engine` exports under a single package name.

**Package name**: `@ikiraro/sdk`  
**Built with**: tsup (bundler for npm distribution)

---

## Purpose

Internal monorepo consumers import directly from `@ikiraro/communication`, `@ikiraro/components`, and `@ikiraro/engine`. External npm consumers (`npm install @ikiraro/sdk`) import everything from `@ikiraro/sdk`.

The SDK package does not add any logic — it is purely an aggregation layer.

---

## Exports

### `@ikiraro/sdk` (main)

```typescript
// From @ikiraro/communication
export * from "@ikiraro/communication";         // createIkiraro, IkiraroRuntime, EventBus, plugins,
                                                 // IkiraroSDK, useIkiraro, useHandTracking, etc.

// From @ikiraro/components
export { SignPlayer3D, SignModelGLTF, ... } from "@ikiraro/components";
export { PipelineView, HandOverlay, AudioVisualizer, ... } from "@ikiraro/components";

// From @ikiraro/engine/planning
export { buildPlanFromGloss, buildPlanFromUnits, createEnvelope, RendererDirector, ... } from "@ikiraro/engine/planning";

// From @ikiraro/engine/types
export type { SignToken, SignPlan, TranslationEnvelope, FrameItem, IkiraroToken, ... } from "@ikiraro/engine/types";
```

---

## Release Scripts

From the root `package.json`:

```bash
# Bump version (patch/minor/major)
bun run release:sdk:version:patch
bun run release:sdk:version:minor
bun run release:sdk:version:major

# Verify before publishing (build + typecheck + test + pack dry-run)
bun run release:sdk:verify

# Publish to npm
bun run release:sdk:publish
```

`release:sdk:verify` runs the full pipeline before any publish:

1. `bun run build` — turbo builds all packages.
2. `bun run check-types` — TypeScript check.
3. `bun run test` — vitest.
4. `bun pm pack --dry-run` — verifies the tarball without uploading.

---

## Usage (External Consumer)

```typescript
import {
  createIkiraro,
  useHandTracking,
  SignPlayer3D,
  PipelineView,
} from "@ikiraro/sdk";

// Bootstrap the runtime
const runtime = await createIkiraro({
  sdk: { groqApiKey: process.env.GROQ_API_KEY },
});

// React app
function App() {
  const camera = useHandTracking();

  return (
    <div>
      <video ref={camera.videoRef} autoPlay muted playsInline />
      <HandOverlay tracking={camera.tracking} />
      <PipelineView envelope={currentEnvelope} />
    </div>
  );
}
```
