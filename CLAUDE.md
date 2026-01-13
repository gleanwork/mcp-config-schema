# MCP Config Monorepo

## Structure

- `packages/mcp-config-schema/` - Core schema package (see [CLAUDE.md](./packages/mcp-config-schema/CLAUDE.md))
- `packages/mcp-config-glean/` - Glean-specific defaults

## Configuration

Tooling configuration is centralized at the root:

- `eslint.config.mjs` - ESLint flat config for all packages
- `.prettierrc` - Prettier formatting rules
- `tsconfig.base.json` - Shared TypeScript compiler options (packages extend this)
- `vitest.workspace.ts` - Vitest workspace config for running tests across packages

Shared devDependencies are hoisted to the root `package.json`.

## Commands

- `npm run build` - Build all packages (schema first, then glean)
- `npm run test` - Run all tests across packages
- `npm run test:all` - Lint, typecheck, and test all packages
- `npm run lint` - Run ESLint across all packages
- `npm run typecheck` - Run TypeScript type checking across all packages
- `npm run format` - Format all TypeScript files with Prettier

## Release

Uses release-it with workspaces plugin for synchronized versioning across all packages.

Run `npx release-it` from the root to release all packages with the same version.
