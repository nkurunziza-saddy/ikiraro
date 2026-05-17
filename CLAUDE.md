# sensa

This file provides context about the project for AI assistants.

## Project Overview

- **Ecosystem**: Typescript

## Tech Stack

- **Runtime**: workers
- **Package Manager**: bun

### Frontend

- Framework: tanstack-start
- CSS: tailwind
- UI Library: shadcn-ui
- State: jotai

### Backend

- Framework: hono
- Validation: valibot

### Database

- Database: sqlite
- ORM: drizzle

### Authentication

- Provider: better-auth

### Additional Features

- Testing: vitest
- Logging: pino

## Project Structure

```
sensa/
├── apps/
│   ├── web/         # Frontend application (TanStack Start, Vite)
│   └── server/      # Backend API (Hono, Cloudflare Worker)
├── packages/
│   ├── engine/      # Core ASL engine — @sensa/engine
│   │   ├── @sensa/engine/types    — all shared TypeScript types (server + client safe)
│   │   ├── @sensa/engine/planning — Groq STT, LLM gloss generation, tokenizer (server safe, no DOM/WASM)
│   │   └── @sensa/engine/vision   — hand tracking, classifier, word buffer, TTS (browser only)
│   ├── components/  # Shared React component library
│   ├── auth/        # Authentication (better-auth)
│   ├── db/          # Database schema (Drizzle + D1)
│   ├── env/         # Cloudflare Worker env bindings
│   └── infra/       # Alchemy IaC
```

## Engine Architecture (@sensa/engine)

The engine is the core brain. Translation flows through two layers:

1. **SemanticIntent** — Groq LLM converts English text to ASL gloss notation (MEDICINE NEED YOU)
2. **SignPlan** — Tokenizer converts gloss tokens to typed sign tokens (lexeme / fingerspell / number / pause / pointing)

`GLOSS_REGISTRY` maps known gloss tokens (HELLO, HELP, etc.) to sign durations for rendering.
For unknown gloss tokens, fingerspell fallback is applied automatically.

The vision subpath (`@sensa/engine/vision`) is browser-only — it contains MediaPipe-based hand tracking, the `SensaSurgicalClassifier` (fingerprint + disambiguation), and `WordBuffer`. Browser-facing sensory utilities like `WebSpeechProvider` and `CaptureAdapter` live in `@sensa/communication`. Never import either in Cloudflare Workers.

## Common Commands

- `bun install` - Install dependencies
- `bun dev` - Start development server
- `bun build` - Build for production
- `bun test` - Run tests
- `bun db:push` - Push database schema
- `bun db:studio` - Open database UI

## Maintenance

Keep CLAUDE.md updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
