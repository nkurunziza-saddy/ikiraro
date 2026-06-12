# Ikiraro Documentation

Welcome to the Ikiraro documentation index.

- [Architecture Map](architecture.md) — The ultimate developer map of the monorepo, data flow, and engine layers.
- [SDK Reference](api/sdk.md) — API reference for `createIkiraroClient` and React hooks.
- [Runtime API](api/runtime.md) — API reference for the core `IkiraroRuntime` and plugin authoring.
- [Hand Tracking Guide](guides/hand-tracking.md) — How to use the Web Worker vision pipeline and integrate it with the runtime.
- [Accessibility System](guides/accessibility.md) — Guides on using the mode manager, TTS audio queue, earcons, and shortcut manager.

---

## Restoration Report

This repository recently underwent a docs restoration spike. 

**Restored Docs:**
- `architecture.md`: Recovered from the deleted `architecture-map.md`.
- `api/sdk.md`: Extracted and synthesized from the deleted TSX docs routes (`hooks.tsx`, `components.tsx`).
- `api/runtime.md`: Extracted from the deleted TSX docs routes (`runtime.tsx`).
- `guides/hand-tracking.md`: Extracted from the deleted TSX docs routes (`vision.tsx`).
- `guides/accessibility.md`: Extracted from the deleted TSX docs routes (`accessibility.tsx`).

**Dropped Docs:**
- The raw React components (`apps/web/src/routes/docs/*`) were deliberately dropped because the TanStack site is undergoing a redesign and these Markdown files serve as the new SSOT.
- `roadmap.md` and `features.md`: These were deemed obsolete as the current implementation and tracking have moved past them.
- `types.tsx` and `events.tsx`: Were dropped to avoid duplicating standard TypeScript typings already present in the codebase.
- API sections describing out-of-date hooks or parameters were omitted or simplified.

**Open Question for the Maintainer:**
Should the documentation live on the website (`apps/web`) again in the future? If so, the recommendation is to generate the site directly from these Markdown files (e.g. using MDX or Vitepress) rather than hand-writing React components, ensuring there is a single source of truth.
