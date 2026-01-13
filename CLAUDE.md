# MCP Config Monorepo

## Structure

- `packages/mcp-config-schema/` - Core schema package (see [CLAUDE.md](./packages/mcp-config-schema/CLAUDE.md))
- `packages/mcp-config-glean/` - Glean-specific defaults

## Commands

- `npm run build` - Build all packages (schema first, then glean)
- `npm run test` - Run all tests
- `npm run test:all` - Lint, typecheck, and test all packages
- `npm run lint` - Run linting across all packages
- `npm run typecheck` - Run TypeScript type checking across all packages

## Release

Uses release-it with workspaces plugin for synchronized versioning across all packages.

Run `npx release-it` from the root to release all packages with the same version.
