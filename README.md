# @gleanwork/mcp-config-schema

Single Source of Truth (SSOT) for MCP client configurations. This package provides a comprehensive registry of MCP client configurations, including which clients support native HTTP connections and which require `mcp-remote` as a bridge.

## Overview

This package is a **library** that provides:

- **Type-safe configuration schemas** for all supported MCP clients
- **Automatic detection** of client capabilities (HTTP vs stdio)
- **Configuration builders** that generate correct config files for each client
- **Registry** for querying client capabilities and requirements

This package is designed to be used by `@gleanwork/configure-mcp-server` and other tools that need to understand MCP client configurations.

## Key Concepts

### Client Connection Types

1. **Native HTTP Clients**: Can connect directly to HTTP MCP servers
   - Claude Code
   - Visual Studio Code

2. **stdio-only Clients**: Require `mcp-remote` bridge for HTTP servers
   - Claude for Desktop
   - Cursor
   - Goose
   - Windsurf

### Compatibility Levels

- **Full**: Fully supported and tested
- **Investigating**: Under investigation, may have missing features
- **None**: Not yet supported

## Installation

```bash
npm install @gleanwork/mcp-config-schema
```

## Usage

### Basic Usage

```typescript
import { createMCPToolkit } from '@gleanwork/mcp-config-schema';

const toolkit = createMCPToolkit();

// Get configuration for a specific client
const cursorConfig = toolkit.registry.getConfig('cursor');
console.log(cursorConfig.displayName); // "Cursor"
console.log(cursorConfig.requiresMcpRemoteForHttp); // true

// Create a configuration builder
const builder = toolkit.createBuilder('cursor');

// Generate configuration
const config = builder.buildConfiguration({
  serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
  serverName: 'glean'
});

// Write configuration to the appropriate location
await builder.writeConfiguration({
  serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
  serverName: 'glean'
});
```

### Query Registry

```typescript
import { createMCPToolkit } from '@gleanwork/mcp-config-schema';

const toolkit = createMCPToolkit();

// Get all supported clients
const supportedClients = toolkit.registry.getSupportedClients();

// Get clients that support native HTTP
const httpClients = toolkit.registry.getNativeHttpClients();
console.log('Native HTTP support:', httpClients.map(c => c.displayName));
// Output: ['Visual Studio Code', 'Claude Code']

// Get clients that need mcp-remote bridge
const bridgeClients = toolkit.registry.getBridgeRequiredClients();
console.log('Need mcp-remote:', bridgeClients.map(c => c.displayName));
// Output: ['Claude for Desktop', 'Cursor', 'Goose', 'Windsurf']

// Get clients by platform
const macClients = toolkit.registry.getClientsByPlatform('darwin');
const linuxClients = toolkit.registry.getClientsByPlatform('linux');
const windowsClients = toolkit.registry.getClientsByPlatform('win32');

// Get clients with one-click installation support
const oneClickClients = toolkit.registry.getClientsWithOneClick();
```

### Generate Configurations

```typescript
import { createMCPToolkit, ClientId } from '@gleanwork/mcp-config-schema';

const toolkit = createMCPToolkit();

async function configureClient(clientId: ClientId) {
  const config = toolkit.registry.getConfig(clientId);
  if (!config) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  const builder = toolkit.createBuilder(clientId);
  
  // Check if client needs mcp-remote
  if (config.requiresMcpRemoteForHttp) {
    console.log(`${config.displayName} requires mcp-remote bridge`);
  }

  // Generate configuration
  const configContent = builder.buildConfiguration({
    serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
    serverName: 'glean'
  });

  // Get the config file path
  const configPath = builder.getConfigPath();
  console.log(`Config will be written to: ${configPath}`);

  // Write configuration (backs up existing config)
  await builder.writeConfiguration({
    serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
    serverName: 'glean'
  });
}
```

### Integration with @gleanwork/configure-mcp-server

This package is designed to work seamlessly with `@gleanwork/configure-mcp-server`:

```typescript
import { createMCPToolkit } from '@gleanwork/mcp-config-schema';

// The configure-mcp-server CLI can use this package to:
// 1. Determine which clients are supported
// 2. Generate correct configurations for each client
// 3. Know which clients need mcp-remote bridge
// 4. Get platform-specific configuration paths

const toolkit = createMCPToolkit();

// Example: Check if a client needs special handling
function shouldUseMcpRemote(clientId: string) {
  const config = toolkit.registry.getConfig(clientId);
  return config?.requiresMcpRemoteForHttp ?? false;
}

// Example: Get all clients that can be configured on current platform
function getAvailableClients() {
  const platform = process.platform;
  return toolkit.registry.getClientsByPlatform(platform);
}
```

## API Reference

### Types

- `ClientId`: Union type of all supported client identifiers
- `MCPClientConfig`: Full configuration schema for a client
- `GleanServerConfig`: Configuration for connecting to a Glean server
- `Platform`: 'darwin' | 'linux' | 'win32'
- `CompatibilityLevel`: 'full' | 'investigating' | 'none'

### Registry Methods

- `getConfig(clientId)`: Get configuration for a specific client
- `getAllConfigs()`: Get all client configurations
- `getSupportedClients()`: Get clients with full compatibility
- `getNativeHttpClients()`: Get clients that support HTTP natively
- `getBridgeRequiredClients()`: Get clients that need mcp-remote
- `getStdioOnlyClients()`: Get clients that only support stdio
- `getClientsByPlatform(platform)`: Get clients for a specific OS
- `getClientsWithOneClick()`: Get clients with one-click protocol support

### Builder Methods

- `buildConfiguration(gleanConfig)`: Generate configuration content
- `writeConfiguration(gleanConfig)`: Write configuration to file
- `getConfigPath()`: Get the configuration file path
- `generateExample()`: Generate example configuration
- `needsMcpRemote()`: Check if client needs mcp-remote bridge

## Client Configuration Examples

### Native HTTP Client (Claude Code)
```json
{
  "mcpServers": {
    "glean": {
      "type": "http",
      "url": "https://glean-dev-be.glean.com/mcp/default"
    }
  }
}
```

### stdio-only Client with mcp-remote (Cursor)
```json
{
  "mcpServers": {
    "glean": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://glean-dev-be.glean.com/mcp/default"
      ]
    }
  }
}
```

### YAML Configuration (Goose)
```yaml
extensions:
  glean:
    name: glean
    cmd: npx
    args:
      - '-y'
      - mcp-remote
      - https://glean-dev-be.glean.com/mcp/default
    type: stdio
    timeout: 300
    enabled: true
```

## Configuration Paths

| Client | Platform | Config Path |
|--------|----------|-------------|
| Claude Code | macOS | `~/.claude.json` |
| VS Code | macOS | `~/Library/Application Support/Code/User/mcp.json` |
| Claude Desktop | macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Cursor | All | `~/.cursor/mcp.json` |
| Goose | All | `~/.config/goose/config.yaml` |
| Windsurf | All | `~/.codeium/windsurf/mcp_config.json` |

## Security Notes

- **Cursor**: As of Jan 8, 2025, Cursor's native OAuth implementation does not use a state parameter and may be vulnerable to CSRF attacks.

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run all checks (lint, typecheck, test)
npm run test:all

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## License

MIT