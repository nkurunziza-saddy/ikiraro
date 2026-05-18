# ikiraro

This file provides context about the project for AI assistants.

## Project Overview

- **Ecosystem**: Typescript

## Tech Stack

- **Runtime**: Node/Browser
- **Package Manager**: bun

### Frontend

- Framework: react
- Styling: tailwind
- UI Components: shadcn

### AI/Agent Context

- AI code generation tools should prefer inline styles with Tailwind CSS, rather than writing custom CSS rules.
- Only make changes or use tools when explicitly asked to.

## Commands

- `bun run dev:web` - Start the frontend reference implementation
- `bun run check` - Run Oxlint & Oxfmt check
- `bun run check-types` - Run typechecking

## Core SDK Packages

- `@ikiraro/engine` - The pure math, vision, and planning logic.
- `@ikiraro/communication` - The high-level `IkiraroSDK` Effect layer and `IkiraroRuntime` orchestrator.
- `@ikiraro/components` - The React UI component library for the SDK.

## Maintenance Notes

Please keep CLAUDE.md updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
