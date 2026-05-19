# Ikiraro Documentation

Ikiraro is a local-first browser SDK for real-time hearing-to-signer communication. It converts speech, typed text, or camera fingerspelling into a synchronized ASL sign plan that drives a 3D hand renderer.

---

## Contents

### Guides

- [**Getting Started**](./getting-started.md) — Setup, dev commands, quick usage examples, debugging
- [**Architecture**](./architecture.md) — System overview, package graph, design principles, key types
- [**Data Flows**](./data-flow.md) — Complete end-to-end traces for text, speech, sign-keys, and camera paths
- [**Vision Pipeline**](./vision-pipeline.md) — MediaPipe → classifier → linguistic buffer → SignToken, in full detail
- [**Event System**](./event-system.md) — All 34 typed events, plugin anatomy, CompositionPlugin fusion, EventBus API

### Package Reference

- [**@ikiraro/engine**](./packages/engine.md) — Types, planning, vision, math
- [**@ikiraro/communication**](./packages/communication.md) — Runtime, plugins, AI services, capture adapters, React hooks
- [**@ikiraro/components**](./packages/components.md) — SignPlayer3D, HandOverlay, PipelineView, Shadcn UI
- [**@ikiraro/sdk**](./packages/sdk.md) — npm distribution facade, release scripts

---

## Quick Orientation

```
Input (speech / text / fingerspell)
    ↓
IkiraroRuntime + EventBus + Plugins
    ↓
TranslationEnvelope { SignPlan, FrameItem[] }
    ↓
RendererDirector + SignCanvas
    ↓
3D Hand Animation
```

The three packages you'll touch most:

| Task                                                  | Package                  |
| ----------------------------------------------------- | ------------------------ |
| Add a new gloss / handshape / sign variant            | `@ikiraro/engine`        |
| Add a new input source / translation backend / plugin | `@ikiraro/communication` |
| Build UI that shows sign output                       | `@ikiraro/components`    |
