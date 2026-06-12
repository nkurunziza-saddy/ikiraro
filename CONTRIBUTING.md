# Contributing to Ikiraro SDK

First off, thank you for considering contributing to Ikiraro! It's people like you that make open source such a great community.

## Local Development Setup

1. **Prerequisites**: Ensure you have [Bun](https://bun.sh/) installed.
2. **Clone the repository**:
   ```bash
   git clone https://github.com/nkurunziza-saddy/ikiraro.git
   cd ikiraro
   ```
3. **Install dependencies**:
   ```bash
   bun install
   ```
4. **Start the development server**:
   ```bash
   bun run dev:web
   ```

## Repository Structure

Ikiraro is a monorepo utilizing Turborepo and Bun workspaces.

- `apps/web`: The documentation and playground dashboard (React/Vite).
- `packages/sdk`: The public-facing entry point.
- `packages/runtime`: Core state management, plugins, and the React bindings (`createIkiraroClient`).
- `packages/engine`: Pure math, computer vision algorithms, and ASL pose generation (zero dependencies).
- `packages/renderer`: The 3D Three.js/R3F renderer (`AvatarViewer`).

## Development Workflow

1. **Branch out**: Create a new branch for your feature or bugfix.
2. **Make changes**: Implement your changes in the appropriate package.
3. **Verify**: Run the following commands to ensure everything is solid:
   ```bash
   bun run lint         # Lints code (no changes written)
   bun run format       # Formats code in place
   bun run check-types  # Type-checks all packages
   bun run build        # Builds the SDK
   ```
4. **Changesets**: If your changes affect published packages, generate a changeset.
   ```bash
   bun run changeset
   ```
   Follow the prompts to select which packages are affected and whether it's a `patch`, `minor`, or `major` bump. Note: all `@ikiraro/*` packages are linked and will bump together.
5. **Submit a PR**: Push your branch and open a Pull Request!

## Community

Please abide by our [Code of Conduct](./CODE_OF_CONDUCT.md) when participating in our community.
