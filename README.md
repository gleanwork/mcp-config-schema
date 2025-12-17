# @gleanwork/mcp-config-schema

Type-safe configuration schemas and builders for MCP (Model Context Protocol) clients.

## Installation

```bash
npm install @gleanwork/mcp-config-schema
```

## Quick Start

```typescript
import { createMCPConfigFactory } from '@gleanwork/mcp-config-schema';
import type { MCPConfig } from '@gleanwork/mcp-config-schema';

// Define your MCP server configuration
const config: MCPConfig = {
  serverPackage: '@my-org/mcp-server',
  cliPackage: '@my-org/configure-mcp',
  envVars: {
    url: 'MY_SERVER_URL',
    instance: 'MY_INSTANCE',
    token: 'MY_API_TOKEN',
  },
  urlPattern: 'https://[instance].example.com/mcp/[endpoint]',
};

// Create a configured MCP factory
const mcp = createMCPConfigFactory(config);

// Create a configuration builder for a specific client
const builder = mcp.createBuilder('cursor');

// Generate configuration
const cursorConfig = builder.buildConfiguration({
  transport: 'http',
  serverUrl: 'https://your-server.com/mcp/default',
  serverName: 'my-server',
});

// Write configuration to the client's config file (Node.js only)
await builder.writeConfiguration({
  transport: 'http',
  serverUrl: 'https://your-server.com/mcp/default',
  serverName: 'my-server',
});

// Generate one-click install URL for supported clients (Cursor, VS Code)
const oneClickUrl = builder.buildOneClickUrl({
  transport: 'http',
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
- **Factory pattern** for creating vendor-neutral configurations

## Supported Clients

For the complete list of supported clients, configuration examples, and file locations, see **[CLIENTS.md](CLIENTS.md)**.

## Configuration

This package is vendor-neutral. You provide configuration for your MCP server to customize the generated output.

### Configuration Options

```typescript
import { createMCPConfigFactory } from '@gleanwork/mcp-config-schema';
import type { MCPConfig } from '@gleanwork/mcp-config-schema';

const myConfig: MCPConfig = {
  // Package for local stdio server installations
  serverPackage: '@my-company/mcp-server',
  // Package for CLI configuration tool (optional)
  cliPackage: '@my-company/configure-mcp',
  // Default URL pattern with placeholders
  urlPattern: 'https://[instance].my-company.com/mcp/[endpoint]',
  // Environment variable mappings
  envVars: {
    url: 'MY_COMPANY_URL',
    instance: 'MY_COMPANY_INSTANCE',
    token: 'MY_COMPANY_API_TOKEN',
  },
};

const mcp = createMCPConfigFactory(myConfig);
```

| Property | Type | Description |
| --- | --- | --- |
| `serverPackage` | `string` | npm package for local stdio server (e.g., `@my-company/mcp-server`) |
| `cliPackage` | `string` | npm package for CLI configuration tool |
| `urlPattern` | `string` | URL pattern with `[instance]` and `[endpoint]` placeholders |
| `envVars.url` | `string` | Environment variable for full URL |
| `envVars.instance` | `string` | Environment variable for instance identifier |
| `envVars.token` | `string` | Environment variable for API token |

### HTTP-Only Configuration

For HTTP-only use cases (no stdio transport), you can use an empty config:

```typescript
const mcp = createMCPConfigFactory({});

const builder = mcp.createBuilder('cursor');
const config = builder.buildConfiguration({
  transport: 'http',
  serverUrl: 'https://api.example.com/mcp/default',
  serverName: 'my-server',
});
```

## Core Usage

### Query Client Capabilities

```typescript
import { createMCPConfigFactory } from '@gleanwork/mcp-config-schema';

const mcp = createMCPConfigFactory({ serverPackage: '@my-org/mcp-server' });

// Get client configuration
const cursorConfig = mcp.getConfig('cursor');
console.log(cursorConfig.displayName); // "Cursor"
console.log(cursorConfig.userConfigurable); // true

// Check client capabilities
console.log(mcp.clientSupportsHttpNatively('cursor')); // true
console.log(mcp.clientNeedsMcpRemote('claude-desktop')); // true

// Query different client groups
const httpClients = mcp.getNativeHttpClients();
const bridgeClients = mcp.getBridgeRequiredClients();
const macClients = mcp.getClientsByPlatform('darwin');
```

### Generate Configurations

```typescript
const mcp = createMCPConfigFactory({
  serverPackage: '@my-org/mcp-server',
  envVars: { instance: 'MY_INSTANCE', token: 'MY_TOKEN' },
});
const builder = mcp.createBuilder('claude-code');

// Remote server configuration (HTTP)
const remoteConfig = builder.buildConfiguration({
  transport: 'http',
  serverUrl: 'https://api.example.com/mcp/default',
  serverName: 'my-server',
});

// Local server configuration (stdio)
const localConfig = builder.buildConfiguration({
  transport: 'stdio',
  instance: 'your-instance',
  apiToken: 'your-api-token',
});

// Generate partial configuration (without root object wrapper)
const partialConfig = builder.buildConfiguration({
  transport: 'http',
  serverUrl: 'https://api.example.com/mcp/default',
  serverName: 'my-server',
  includeRootObject: false,
});
// Returns: { "my-server": { "type": "http", "url": "..." } }
// Instead of: { "mcpServers": { "my-server": { ... } } }
```

#### Partial Configuration (without root object)

The `includeRootObject` option generates just the server entry without the outer wrapper (`mcpServers`, `servers`, or `extensions` depending on the client). This is useful when merging into an existing configuration:

```typescript
// Generate partial config for merging
const partialConfig = builder.buildConfiguration({
  transport: 'http',
  serverUrl: 'https://api.example.com/mcp/default',
  serverName: 'my-server',
  includeRootObject: false,
});

// Merge into existing config file
const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
existingConfig.mcpServers = {
  ...existingConfig.mcpServers,
  ...partialConfig,
};
fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
```

### Validate Configurations

```typescript
import { validateConnectionOptions, safeValidateConnectionOptions } from '@gleanwork/mcp-config-schema';

// Validate connection options
const result = safeValidateConnectionOptions({
  transport: 'http',
  serverUrl: 'https://your-server.com/mcp/default',
});

if (!result.success) {
  console.error('Validation errors:', result.error.issues);
}
```

## Browser Support

This package works in browsers. Use the `/browser` import path:

```javascript
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema/browser';

const config = {
  serverPackage: '@my-org/mcp-server',
  envVars: { instance: 'MY_INSTANCE', token: 'MY_TOKEN' },
};

const registry = new MCPConfigRegistry({ mcpConfig: config });
const builder = registry.createBuilder('cursor');

// Generate configuration (works in browser)
const cursorConfig = builder.buildConfiguration({
  transport: 'http',
  serverUrl: 'https://your-server.com/mcp/default',
});

// Copy to clipboard
navigator.clipboard.writeText(JSON.stringify(cursorConfig, null, 2));
```

**Note:** File operations (`writeConfiguration`, `getConfigPath`) are not available in browsers and will throw clear error messages.

## Direct Registry Usage

For advanced use cases, you can use `MCPConfigRegistry` directly:

```typescript
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema';

const config = {
  serverPackage: '@my-org/mcp-server',
  envVars: { instance: 'MY_INSTANCE', token: 'MY_TOKEN' },
};

// Create registry with MCP configuration
const registry = new MCPConfigRegistry({ mcpConfig: config });

// Register custom clients
registry.registerClient({
  id: 'my-custom-editor',
  displayName: 'My Custom Editor',
  userConfigurable: true,
  transports: ['stdio', 'http'],
  supportedPlatforms: ['darwin', 'linux', 'win32'],
  configFormat: 'json',
  configPath: {
    darwin: '$HOME/.my-editor/mcp.json',
    linux: '$HOME/.my-editor/mcp.json',
    win32: '%USERPROFILE%\\.my-editor\\mcp.json',
  },
  configStructure: {
    serversPropertyName: 'mcpServers',
    httpPropertyMapping: {
      typeProperty: 'type',
      urlProperty: 'url',
      headersProperty: 'headers',
    },
    stdioPropertyMapping: {
      typeProperty: 'type',
      commandProperty: 'command',
      argsProperty: 'args',
      envProperty: 'env',
    },
  },
});

// Register custom builders for specific clients
import { BaseConfigBuilder } from '@gleanwork/mcp-config-schema';

class MyCustomBuilder extends BaseConfigBuilder {
  protected buildRemoteConfig(serverData, includeRootObject) {
    // Custom implementation
  }
}

registry.registerBuilder('my-custom-editor', MyCustomBuilder);
```

### Registry Options

| Option | Type | Description |
| --- | --- | --- |
| `mcpConfig` | `MCPConfig` | MCP server configuration (required for stdio transport) |
| `loadBuiltInConfigs` | `boolean` | Whether to load built-in client configs (default: `true`) |

## API Reference

### Types

- `MCPConfig` - Configuration for your MCP server
- `MCPEnvVarNames` - Environment variable name mappings
- `MCPConfigFactory` - Factory instance returned by `createMCPConfigFactory()`
- `MCPConnectionOptions` - Connection options for building configurations
- `ClientId` - Union of all supported client identifiers
- `MCPClientConfig` - Full client configuration schema
- `Platform` - 'darwin' | 'linux' | 'win32'
- `Transport` - 'http' | 'stdio'

### Factory Function

- `createMCPConfigFactory(config)` - Create a configured MCP factory instance

### MCPConfigFactory Methods

- `createBuilder(clientId)` - Create a configuration builder
- `buildConfiguration(clientId, options)` - Generate configuration
- `buildConfigurationString(clientId, options)` - Generate config as string
- `buildCommand(clientId, options)` - Generate CLI command
- `buildOneClickUrl(clientId, options)` - Generate one-click URL
- `getConfig(clientId)` - Get configuration for a specific client
- `getAllConfigs()` - Get all client configurations
- `getNativeHttpClients()` - Get HTTP-native clients
- `getBridgeRequiredClients()` - Get clients needing mcp-remote
- `getClientsByPlatform(platform)` - Get platform-specific clients
- `clientNeedsMcpRemote(clientId)` - Check if client needs mcp-remote
- `clientSupportsHttpNatively(clientId)` - Check if client supports HTTP
- `hasClient(clientId)` - Check if client exists

### Registry Methods

- `getConfig(clientId)` - Get configuration for a specific client
- `getAllConfigs()` - Get all client configurations
- `getSupportedClients()` - Get clients with local config support
- `getNativeHttpClients()` - Get HTTP-native clients
- `getBridgeRequiredClients()` - Get clients needing mcp-remote
- `getClientsByPlatform(platform)` - Get platform-specific clients
- `createBuilder(clientId)` - Create a configuration builder
- `registerClient(config)` - Register a custom client
- `registerBuilder(clientId, builder)` - Register a custom builder

### Builder Methods

- `buildConfiguration(options)` - Generate configuration content
- `writeConfiguration(options)` - Write config to file (Node.js only)
- `getConfigPath()` - Get the config file path (Node.js only)
- `buildCommand(options)` - Generate CLI command
- `buildOneClickUrl(options)` - Generate one-click URL

### Validation Functions

- `validateConnectionOptions(options)` - Validate connection options (throws)
- `safeValidateConnectionOptions(options)` - Safe validation (returns result)
- `validateGeneratedConfig(config, clientId)` - Validate generated output

## Migration from v1.x/v2.x

If you were using an older version, migrate to the current factory API:

```typescript
// Before (v1.x with plugins or v2.x)
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema';
const registry = new MCPConfigRegistry();
const builder = registry.createBuilder('cursor');

// After (v3.x with factory)
import { createMCPConfigFactory } from '@gleanwork/mcp-config-schema';

const config = {
  serverPackage: '@my-org/mcp-server',
  envVars: { instance: 'MY_INSTANCE', token: 'MY_TOKEN' },
};

const mcp = createMCPConfigFactory(config);
const builder = mcp.createBuilder('cursor');
```

Key changes:
- **No implicit defaults** - Must provide your own configuration
- **Factory function** - Use `createMCPConfigFactory()` to create a factory instance
- **Type renames** - `McpConfig` → `MCPConfig`, `EnvVars` → `MCPEnvVarNames`, `MCPServerConfig` → `MCPConnectionOptions`
- **Property renames** - `serverCommand` → `serverPackage`, `installCommand` → `cliPackage`
- **Function renames** - `createMcpConfig()` → `createMCPConfigFactory()`, `validateServerConfig()` → `validateConnectionOptions()`

See [docs/migrations/v3-factory-api.md](docs/migrations/v3-factory-api.md) for detailed migration instructions.

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

- **[CLIENTS.md](CLIENTS.md)** - Comprehensive client compatibility matrix with configuration examples
- **[API Reference](#api-reference)** - Complete API documentation

## License

MIT - See [LICENSE](LICENSE) file for details

## Contributing

For issues and contributions, please visit the repository.
