# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This monorepo contains packages for generating MCP (Model Context Protocol) client configurations across various code editors and IDEs.

| Package | Purpose |
|---------|---------|
| `@gleanwork/mcp-config-schema` | Vendor-neutral schemas and builders for MCP client configs |
| `@gleanwork/mcp-config-glean` | Glean-specific defaults, wraps schema package |

## Commands

```bash
npm run build              # Build all packages (schema first, then glean)
npm run test               # Run all tests
npm run test:all           # Lint, typecheck, and test
npm run lint               # ESLint with auto-fix
npm run typecheck          # TypeScript type checking
npm run format             # Prettier formatting

# Run single test file
npx vitest run packages/mcp-config-schema/test/builder.test.ts

# Run tests in watch mode
npm run test:watch

# Package-specific commands
npm run build -w @gleanwork/mcp-config-schema
npm run test -w @gleanwork/mcp-config-glean
```

## Key Constraint: Vendor Neutrality

**`@gleanwork/mcp-config-schema` MUST remain vendor-neutral.** Never add:
- Glean-specific strings, URLs, or environment variable names
- Hardcoded references to `@gleanwork/local-mcp-server` or other Glean packages
- Any Glean branding or product-specific logic

All vendor-specific configuration belongs in `@gleanwork/mcp-config-glean`, which wraps the schema package and injects Glean defaults via `RegistryOptions`.

## Architecture

### Package Relationship

```
@gleanwork/mcp-config-glean (vendor-specific)
    └── depends on → @gleanwork/mcp-config-schema (vendor-neutral)
                          └── /configs/*.json (client definitions)
```

The glean package adds Glean-specific:
- Server package name (`@gleanwork/local-mcp-server`)
- Environment variables (`GLEAN_INSTANCE`, `GLEAN_API_TOKEN`)
- Server name prefixes (`glean_local`, `glean_default`)
- Command builders for `@gleanwork/configure-mcp-server`

### Core Classes (mcp-config-schema)

**`MCPConfigRegistry`** (`packages/mcp-config-schema/src/registry.ts`)
- Loads client configs from `/configs/*.json`
- Creates builders for specific clients
- Categorizes clients by transport support (HTTP, stdio, bridge-required)

**`ConfigBuilder`** (and client-specific subclasses in `src/builders/`)
- Generates config content (JSON, YAML, TOML depending on client)
- Writes to client-specific config file paths
- Builds one-click install URLs and CLI commands

### Client Configurations

Each MCP client (Cursor, VS Code, Claude Desktop, etc.) has a JSON config in `packages/mcp-config-schema/configs/` defining:
- Transport support (stdio, HTTP)
- Config file locations per platform
- Property mappings for config structure
- Protocol handler for one-click installation

### Transport Modes

- **stdio**: Local MCP server process via stdio
- **HTTP**: Direct HTTP connection (native clients) or via `mcp-remote` bridge (Claude Desktop, Junie)

## Adding a New Client

1. Create config JSON in `packages/mcp-config-schema/configs/`
2. Add import to `packages/mcp-config-schema/src/registry.ts`
3. Add to `allConfigs` array
4. If custom builder logic needed, create class in `src/builders/` extending `BaseConfigBuilder`

## Release

Uses release-it with workspaces plugin. Run `npx release-it` from root.

## Tooling

Config files at root level apply to all packages:
- `eslint.config.mjs` - ESLint flat config
- `.prettierrc` - Formatting rules
- `tsconfig.base.json` - Shared TS config (packages extend)
- `vitest.workspace.ts` - Test runner workspace config
