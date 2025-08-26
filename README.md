# @gleanwork/mcp-config-schema

Type-safe configuration schemas and builders for MCP (Model Context Protocol) clients.

## Installation

```bash
npm install @gleanwork/mcp-config-schema
```

## Quick Start

```typescript
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema';

const registry = new MCPConfigRegistry();

// Create a configuration builder for a specific client
const builder = registry.createBuilder('cursor');

// Generate configuration
const config = builder.buildConfiguration({
  mode: 'remote',
  serverUrl: 'https://your-server.com/mcp/default',
  serverName: 'my-server',
});

// Write configuration to the client's config file (Node.js only)
await builder.writeConfiguration({
  mode: 'remote',
  serverUrl: 'https://your-server.com/mcp/default',
  serverName: 'my-server',
});

// Generate one-click install URL for supported clients (currently only Cursor)
const oneClickUrl = builder.buildOneClickUrl({
  mode: 'remote',
  serverUrl: 'https://your-server.com/mcp/default',
  serverName: 'my-server',
});
// Returns: cursor://anysphere.cursor-deeplink/mcp/install?name=my-server&config=...
```

## What This Package Does

This package serves as the **Single Source of Truth** for MCP client configurations. It provides:

- **Registry** of all MCP clients and their capabilities
- **Configuration builders** that generate correct configs for each client
- **Type-safe schemas** with TypeScript types and Zod validation
- **Browser support** for web-based configuration tools
- **Client detection** to identify which clients need special handling

## Supported Clients

For detailed configuration examples and requirements for each client, see **[CLIENTS.md](CLIENTS.md)**.

### Fully Supported (can generate local configs)

| Client                 | Connection Type | Requires mcp-remote? | Platform              |
| ---------------------- | --------------- | -------------------- | --------------------- |
| **Claude Code**        | HTTP native     | No                   | macOS                 |
| **Visual Studio Code** | HTTP native     | No                   | All                   |
| **Claude Desktop**     | stdio only      | Yes (for HTTP)       | macOS                 |
| **Cursor**             | stdio only      | Yes (for HTTP)       | All                   |
| **Goose**              | HTTP native     | No                   | macOS, Linux, Windows |
| **Windsurf**           | stdio only      | Yes (for HTTP)       | All                   |

### Not Configurable via Local Files

- **ChatGPT** - Requires web UI configuration
- **Claude Desktop (Organization)** - Managed by organization admins

### One-Click Installation Support

Currently, only Cursor has documented one-click installation support:

| Client     | Protocol    | Format                                                               |
| ---------- | ----------- | -------------------------------------------------------------------- |
| **Cursor** | `cursor://` | `cursor://anysphere.cursor-deeplink/mcp/install?name=...&config=...` |

Note: VSCode may support one-click installation in the future, but the format has not been documented yet.

## Core Usage

### Query Client Capabilities

```typescript
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema';

const registry = new MCPConfigRegistry();

// Get client configuration
const cursorConfig = registry.getConfig('cursor');
console.log(cursorConfig.displayName); // "Cursor"
console.log(cursorConfig.requiresMcpRemoteForHttp); // true

// Query different client groups
const httpClients = registry.getNativeHttpClients();
const bridgeClients = registry.getBridgeRequiredClients();
const macClients = registry.getClientsByPlatform('darwin');
```

### Generate Configurations

```typescript
const builder = registry.createBuilder('claude-code');

// Remote server configuration
const remoteConfig = builder.buildConfiguration({
  mode: 'remote',
  serverUrl: 'https://api.example.com/mcp/default',
  serverName: 'my-server',
});

// Local server configuration
const localConfig = builder.buildConfiguration({
  mode: 'local',
  instance: 'your-instance',
  apiToken: 'your-api-token',
});

// Generate partial configuration (without wrapper)
const partialConfig = builder.buildConfiguration({
  mode: 'remote',
  serverUrl: 'https://api.example.com/mcp/default',
  serverName: 'my-server',
  includeWrapper: false, // Returns just the server entry without mcpServers wrapper
});
// Returns: { "my-server": { "type": "http", "url": "..." } }
// Instead of: { "mcpServers": { "my-server": { "type": "http", "url": "..." } } }
```

#### Partial Configuration (without wrapper)

The `includeWrapper` option allows you to generate just the server configuration entry without the outer wrapper (`mcpServers`, `servers`, or `extensions` depending on the client). This is useful when you need to merge configurations into an existing setup:

```typescript
// Generate partial config for merging into existing configuration
const partialConfig = JSON.parse(
  builder.buildConfiguration({
    mode: 'remote',
    serverUrl: 'https://api.example.com/mcp/default',
    serverName: 'glean_custom',
    includeWrapper: false,
  })
);

// Now you can easily merge it into an existing config
const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
existingConfig.mcpServers = {
  ...existingConfig.mcpServers,
  ...partialConfig,
};
fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
```

### Validate Configurations

```typescript
import { validateServerConfig, safeValidateServerConfig } from '@gleanwork/mcp-config-schema';

// Validate input configuration
const result = safeValidateServerConfig({
  mode: 'remote',
  serverUrl: 'https://your-server.com/mcp/default',
});

if (!result.success) {
  console.error('Validation errors:', result.error.issues);
}
```

## Browser Support

This package works in browsers! Use the `/browser` import path:

```javascript
// Browser-safe import
import { MCPConfigRegistry, ConfigBuilder } from '@gleanwork/mcp-config-schema/browser';

const registry = new MCPConfigRegistry();
const builder = registry.createBuilder('cursor');

// Generate configuration (works in browser)
const config = builder.buildConfiguration({
  mode: 'remote',
  serverUrl: 'https://your-server.com/mcp/default',
});

// Copy to clipboard
navigator.clipboard.writeText(config);
```

**Note:** File operations (`writeConfiguration`, `getConfigPath`) are not available in browsers and will throw clear error messages.

### React Example

```tsx
import React from 'react';
import { MCPConfigRegistry, ClientId } from '@gleanwork/mcp-config-schema/browser';

function MCPConfigGenerator() {
  const registry = new MCPConfigRegistry();

  const handleGenerateConfig = (clientId: ClientId, serverUrl: string) => {
    const builder = registry.createBuilder(clientId);
    const config = builder.buildConfiguration({
      mode: 'remote',
      serverUrl,
      serverName: 'glean',
    });

    navigator.clipboard.writeText(config);
  };

  const clients = registry.getSupportedClients();

  return (
    <div>
      {clients.map((client) => (
        <button
          key={client.id}
          onClick={() => handleGenerateConfig(client.id, 'https://api.example.com/mcp')}
        >
          Configure {client.displayName}
        </button>
      ))}
    </div>
  );
}
```

## Configuration Examples

> **📖 For complete configuration examples for all clients, see [CLIENTS.md](CLIENTS.md)**

### Native HTTP Client (Claude Code, VS Code)

```json
{
  "mcpServers": {
    "my-server": {
      "type": "http",
      "url": "https://your-server.com/mcp/default"
    }
  }
}
```

### Bridge Client (Cursor, Claude Desktop, Windsurf)

```json
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://your-server.com/mcp/default"]
    }
  }
}
```

### Goose (YAML format)

```yaml
extensions:
  my-server:
    name: my-server
    cmd: npx
    args: ['-y', 'mcp-remote', 'https://your-server.com/mcp/default']
    type: stdio
    timeout: 300
    enabled: true
```

## Configuration File Locations

| Client         | macOS                                                             | Linux                                 | Windows                                           |
| -------------- | ----------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| Claude Code    | `~/.claude.json`                                                  | -                                     | -                                                 |
| VS Code        | `~/Library/Application Support/Code/User/mcp.json`                | `~/.config/Code/User/mcp.json`        | `%APPDATA%\Code\User\mcp.json`                    |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | -                                     | -                                                 |
| Cursor         | `~/.cursor/mcp.json`                                              | `~/.cursor/mcp.json`                  | `%USERPROFILE%\.cursor\mcp.json`                  |
| Goose          | `~/.config/goose/config.yaml`                                     | `~/.config/goose/config.yaml`         | `%APPDATA%\Block\goose\config\config.yaml`        |
| Windsurf       | `~/.codeium/windsurf/mcp_config.json`                             | `~/.codeium/windsurf/mcp_config.json` | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |

## API Reference

### Types

- `ClientId` - Union of all supported client identifiers
- `MCPClientConfig` - Full client configuration schema
- `GleanServerConfig` - Server connection configuration
- `Platform` - 'darwin' | 'linux' | 'win32'
- `LocalConfigSupport` - 'full' | 'none'
- `ClientConnectionSupport` - 'http' | 'stdio-only' | 'both'

### Registry Methods

- `getConfig(clientId)` - Get configuration for a specific client
- `getAllConfigs()` - Get all client configurations
- `getSupportedClients()` - Get clients with local config support
- `getNativeHttpClients()` - Get HTTP-native clients
- `getBridgeRequiredClients()` - Get clients needing mcp-remote
- `getClientsByPlatform(platform)` - Get platform-specific clients
- `createBuilder(clientId)` - Create a configuration builder

### Builder Methods

- `buildConfiguration(serverConfig)` - Generate configuration content
- `writeConfiguration(serverConfig)` - Write config to file (Node.js only)
- `getConfigPath()` - Get the config file path (Node.js only)

### Validation Functions

- `validateServerConfig(config)` - Validate server configuration (throws)
- `safeValidateServerConfig(config)` - Safe validation (returns result)
- `validateGeneratedConfig(config, clientId)` - Validate generated output

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm run test

# Run all checks (lint, typecheck, test)
npm run test:all

# Generate documentation
npm run generate:docs
```

## Documentation

- **[CLIENTS.md](CLIENTS.md)** - Comprehensive client compatibility matrix with detailed configuration examples
- **[API Reference](#api-reference)** - Complete API documentation

## License

MIT - See [LICENSE](LICENSE) file for details

## Contributing

This package is part of the Glean MCP ecosystem. For issues and contributions, please visit the repository.
