# @ikiraro/sdk

## 0.4.3

### Patch Changes

- bug fixes

## 0.4.2

### Patch Changes

- 5150bf9: WebSpeechProvider.speak() and speakQueue() now reject when cloud TTS (ElevenLabs/OpenAI) fails instead of resolving silently. Wrap fire-and-forget calls in .catch().

## 0.3.5

### Patch Changes

- 5a0b721: Reduced dependencies

## 0.3.4

### Patch Changes

- Rename internal package `@ikiraro/communication` → `@ikiraro/runtime`; make `@mediapipe/tasks-vision` an optional peer dependency in both `@ikiraro/sdk` and the runtime layer (only needed when using `useHandTracking`); add `translate(text, config): Promise<TranslationEnvelope>` convenience helper that runs a one-off translation without a persistent runtime; add CDN build entry to `@ikiraro/engine` (`src/cdn.ts` + `tsup.config.ts`) targeting pure planning utilities as ESM + IIFE bundles.
