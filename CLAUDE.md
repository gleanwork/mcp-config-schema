# MCP Config Schema - Claude Code Assistant Context

## Project Overview

This is `@gleanwork/mcp-config-schema`, a TypeScript library that provides type-safe configuration schemas and builders for MCP (Model Context Protocol) client configurations. It serves as the **Single Source of Truth** for MCP client configurations across various code editors and IDEs.

## Key Concepts

### MCP (Model Context Protocol)

- A protocol for connecting AI assistants to external tools and data sources
- Clients include editors like Claude Code, VS Code, Cursor, Claude Desktop, etc.
- Servers expose tools, resources, and prompts that clients can use

### Configuration Modes

- **Local**: Direct connection to a local Glean instance using `@gleanwork/local-mcp-server`
- **Remote**: Connection to a remote server via HTTP or through `mcp-remote` bridge

### Client Types

- **Native HTTP**: Can connect directly to HTTP servers (Claude Code, VS Code)
- **stdio-only**: Require `mcp-remote` bridge for HTTP connections (Cursor, Claude Desktop, Windsurf)

## Architecture

### Core Classes

#### `MCPConfigRegistry` (src/registry.ts:22)

Central registry that loads and manages all client configurations from JSON files in `/configs/`.

Key methods:

- `getConfig(clientId)` - Get specific client config
- `createBuilder(clientId)` - Create configuration builder
- `getNativeHttpClients()` - Get HTTP-capable clients
- `getBridgeRequiredClients()` - Get clients needing mcp-remote

#### `ConfigBuilder` (src/builder.ts:12)

Generates configuration content for specific clients.

Key methods:

- `buildConfiguration(serverConfig)` - Generate config JSON/YAML
- `writeConfiguration(serverConfig)` - Write to client's config file (Node.js only)
- `buildOneClickUrl(serverConfig)` - Generate one-click install URLs
- `getConfigPath()` - Get platform-specific config file path

### Configuration Structure

Each client has a JSON config in `/configs/` defining:

- **Capabilities**: HTTP support, stdio support, platform availability
- **File locations**: Platform-specific config file paths
- **Schema structure**: Field names for different connection types
- **One-click support**: URL template and encoding format

Example client config structure (configs/cursor.json:1):

```json
{
  "id": "cursor",
  "displayName": "Cursor",
  "clientSupports": "http",
  "requiresMcpRemoteForHttp": false,
  "configStructure": {
    "serverKey": "mcpServers",
    "httpConfig": { "typeField": "type", "urlField": "url" },
    "stdioConfig": { "typeField": "type", "commandField": "command", "argsField": "args" }
  }
}
```

## Build & Development

### Scripts

- `npm run build` - Build the package using tsup
- `npm run test` - Run tests with vitest
- `npm run test:all` - Run lint, typecheck, and tests
- `npm run lint` - ESLint with auto-fix
- `npm run typecheck` - TypeScript type checking
- `npm run generate:docs` - Generate examples and documentation

### Testing

Tests are in `/test/` covering:

- `builder.test.ts` - Configuration generation tests
- `registry.test.ts` - Registry functionality tests
- `validation.test.ts` - Schema validation tests
- `browser-build.test.ts` - Browser compatibility tests

### Configuration Management

- Client configs in `/configs/*.json` are validated on load
- Business rules enforced (e.g., stdio-only clients must require mcp-remote)
- Supports both Node.js and browser environments

## File Locations

Configuration files are written to client-specific locations:

- **Claude Code**: `~/.claude.json` (macOS only)
- **VS Code**: `~/Library/Application Support/Code/User/mcp.json` (macOS)
- **Cursor**: `~/.cursor/mcp.json` (all platforms)
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- **Goose**: `~/.config/goose/config.yaml` (macOS/Linux)
- **Windsurf**: `~/.codeium/windsurf/mcp_config.json` (all platforms)

## Common Tasks

### Adding a New Client

1. Create config JSON in `/configs/`
2. Add import to `src/registry.ts:3-10`
3. Add to `allConfigs` array (src/registry.ts:11)
4. Update TypeScript types if needed

### Testing Configurations

Use the test files to verify generated configs match expected formats for each client.

### Browser vs Node.js

- Browser build excludes file system operations
- Use `/browser` import path for browser-safe functionality
- File operations (`writeConfiguration`, `getConfigPath`) throw clear errors in browser

## Dependencies

Key dependencies:

- **zod**: Schema validation and TypeScript types
- **js-yaml**: YAML generation for Goose configs
- **chalk**: Colored console output
- **mkdirp**: Directory creation for config files

Dev dependencies include TypeScript, ESLint, Prettier, Vitest for testing.
