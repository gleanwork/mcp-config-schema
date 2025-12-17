# Migration Guide: v3 Factory API

This guide covers migrating from the standalone convenience functions to the new factory-based API introduced in v3.

## Overview

The package now uses an explicit factory pattern instead of standalone functions with implicit global configuration. This change:

- Makes the package vendor-neutral (no implicit defaults)
- Enables multiple configurations in the same application
- Improves testability by eliminating global state

## Breaking Changes

### Standalone Functions Removed

The following standalone exports have been removed:

- `buildCommand(clientId, options)`
- `buildConfiguration(clientId, options)`
- `buildConfigurationString(clientId, options)`
- `clientNeedsMcpRemote(clientId)`
- `clientSupportsHttpNatively(clientId)`
- `clientSupportsStdio(clientId)`

These functions are now methods on the instance returned by `createMCPConfigFactory()`.

### Type and Property Renames

The following types have been renamed for clarity:

| Old Name | New Name |
|----------|----------|
| `McpConfig` | `MCPConfig` |
| `EnvVars` | `MCPEnvVarNames` |
| `MCPServerConfig` | `MCPConnectionOptions` |
| `ConfiguredMcp` | `MCPConfigFactory` |
| `createMcpConfig()` | `createMCPConfigFactory()` |
| `validateServerConfig()` | `validateConnectionOptions()` |
| `safeValidateServerConfig()` | `safeValidateConnectionOptions()` |

The following properties in `MCPConfig` have been renamed:

| Old Name | New Name |
|----------|----------|
| `serverCommand` | `serverPackage` |
| `installCommand` | `cliPackage` |

The following properties in `MCPConnectionOptions` have been renamed:

| Old Name | New Name |
|----------|----------|
| `configureMcpServerVersion` | `cliPackageVersion` |
| `installCommandVersion` | `cliPackageVersion` |

## Migration

### Before: Standalone Functions

```typescript
import {
  buildCommand,
  buildConfiguration,
  clientNeedsMcpRemote,
  clientSupportsHttpNatively,
} from '@gleanwork/mcp-config-schema';

const command = buildCommand('cursor', {
  transport: 'stdio',
  instance: 'my-company',
  apiToken: 'token123',
});

const config = buildConfiguration('vscode', {
  transport: 'http',
  serverUrl: 'https://api.example.com/mcp/default',
});

if (clientNeedsMcpRemote('claude-desktop')) {
  // Handle mcp-remote requirement
}
```

### After: Factory Pattern

```typescript
import { createMCPConfigFactory } from '@gleanwork/mcp-config-schema';

// Create a configured instance with your MCP server settings
const mcp = createMCPConfigFactory({
  serverPackage: '@my-org/mcp-server',
  cliPackage: '@my-org/configure-mcp',
  envVars: {
    instance: 'MY_INSTANCE',
    token: 'MY_API_TOKEN',
  },
});

const command = mcp.buildCommand('cursor', {
  transport: 'stdio',
  instance: 'my-company',
  apiToken: 'token123',
});

const config = mcp.buildConfiguration('vscode', {
  transport: 'http',
  serverUrl: 'https://api.example.com/mcp/default',
});

if (mcp.clientNeedsMcpRemote('claude-desktop')) {
  // Handle mcp-remote requirement
}
```

### Using MCPConfigRegistry Directly

If you were using `MCPConfigRegistry` directly, you can now pass `mcpConfig` to the constructor:

```typescript
// Before
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema';
const registry = new MCPConfigRegistry();

// After
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema';

const config = {
  serverPackage: '@my-org/mcp-server',
  envVars: { instance: 'MY_INSTANCE', token: 'MY_TOKEN' },
};
const registry = new MCPConfigRegistry({ mcpConfig: config });
```

## Custom Configuration

Provide your own configuration for your MCP server:

```typescript
import { createMCPConfigFactory } from '@gleanwork/mcp-config-schema';

const mcp = createMCPConfigFactory({
  serverPackage: '@my-org/mcp-server',
  cliPackage: '@my-org/configure-mcp',
  envVars: {
    url: 'MY_SERVER_URL',
    instance: 'MY_INSTANCE',
    token: 'MY_API_TOKEN',
  },
  urlPattern: 'https://[instance].my-company.com/mcp/[endpoint]',
});
```

## API Reference

The `createMCPConfigFactory()` function returns an `MCPConfigFactory` instance with these methods:

| Method | Description |
|--------|-------------|
| `createBuilder(clientId)` | Create a configuration builder for a specific client |
| `buildConfiguration(clientId, options)` | Build configuration object |
| `buildConfigurationString(clientId, options)` | Build configuration as formatted string |
| `buildCommand(clientId, options)` | Build CLI installation command |
| `buildOneClickUrl(clientId, options)` | Build one-click installation URL |
| `clientNeedsMcpRemote(clientId)` | Check if client needs mcp-remote bridge |
| `clientSupportsHttpNatively(clientId)` | Check if client has native HTTP support |
| `clientSupportsStdio(clientId)` | Check if client supports stdio transport |
| `getConfig(clientId)` | Get client configuration |
| `getAllConfigs()` | Get all client configurations |
| `getNativeHttpClients()` | Get clients with native HTTP support |
| `getBridgeRequiredClients()` | Get clients requiring mcp-remote |
| `getClientsByPlatform(platform)` | Get clients for a specific platform |
| `hasClient(clientId)` | Check if client exists |
| `getRegistry()` | Get underlying MCPConfigRegistry |
