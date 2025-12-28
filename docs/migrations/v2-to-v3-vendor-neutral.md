# Migration Guide: v2.x to v3.0 (Vendor-Neutral API)

This document provides comprehensive migration instructions for updating from `@gleanwork/mcp-config-schema` v2.x to v3.0. The v3.0 release introduces a vendor-neutral API that removes Glean-specific property names in favor of generic alternatives.

## Breaking Changes Summary

| Change Type | v2.x | v3.0 |
|-------------|------|------|
| Type rename | `MCPServerConfig` | `MCPConnectionOptions` |
| Type rename | `ServerConfig` | `MCPConnectionOptions` |
| Function rename | `validateServerConfig()` | `validateConnectionOptions()` |
| Function rename | `safeValidateServerConfig()` | `safeValidateConnectionOptions()` |
| Function removed | `buildConfiguration()` | Use `registry.createBuilder().buildConfiguration()` |
| Function removed | `buildConfigurationString()` | Use `builder.buildConfiguration()` then `builder.toString()` |
| Function removed | `buildOneClickUrl()` | Use `builder.buildOneClickUrl()` |
| Function removed | `buildCommand()` | Use `builder.buildCommand()` |
| Function removed | `clientNeedsMcpRemote()` | Use `registry.clientNeedsMcpRemote()` |
| Function removed | `clientSupportsHttpNatively()` | Use `registry.clientSupportsHttpNatively()` |
| Function removed | `clientSupportsStdio()` | Use `registry.clientSupportsStdio()` |
| Property removed | `instance` | Use `env` object instead |
| Property removed | `apiToken` | Use `headers` object instead |
| Property added | - | `env: Record<string, string>` |
| Property added | - | `headers: Record<string, string>` |
| Property added | - | `urlVariables: Record<string, string>` |

---

## Type Renames

### MCPServerConfig → MCPConnectionOptions

**Find and replace all occurrences:**

```typescript
// BEFORE (v2.x)
import type { MCPServerConfig } from '@gleanwork/mcp-config-schema'

const config: MCPServerConfig = {
  transport: 'http',
  serverUrl: 'https://example.com/mcp',
}
```

```typescript
// AFTER (v3.0)
import type { MCPConnectionOptions } from '@gleanwork/mcp-config-schema'

const config: MCPConnectionOptions = {
  transport: 'http',
  serverUrl: 'https://example.com/mcp',
}
```

### ServerConfig → MCPConnectionOptions

Some codebases use the `ServerConfig` alias:

```typescript
// BEFORE (v2.x)
import type { ServerConfig } from '@gleanwork/mcp-config-schema'
```

```typescript
// AFTER (v3.0)
import type { MCPConnectionOptions } from '@gleanwork/mcp-config-schema'
```

---

## Function Renames

### validateServerConfig → validateConnectionOptions

```typescript
// BEFORE (v2.x)
import { validateServerConfig } from '@gleanwork/mcp-config-schema'

const validated = validateServerConfig(options)
```

```typescript
// AFTER (v3.0)
import { validateConnectionOptions } from '@gleanwork/mcp-config-schema'

const validated = validateConnectionOptions(options)
```

### safeValidateServerConfig → safeValidateConnectionOptions

```typescript
// BEFORE (v2.x)
import { safeValidateServerConfig } from '@gleanwork/mcp-config-schema'

const result = safeValidateServerConfig(options)
```

```typescript
// AFTER (v3.0)
import { safeValidateConnectionOptions } from '@gleanwork/mcp-config-schema'

const result = safeValidateConnectionOptions(options)
```

---

## Removed Standalone Functions

The standalone convenience functions have been removed in favor of the registry/builder pattern. This provides a single, consistent API and ensures proper configuration (e.g., `serverPackage` for stdio transport).

### buildConfiguration() → registry.createBuilder().buildConfiguration()

```typescript
// BEFORE (v2.x)
import { buildConfiguration } from '@gleanwork/mcp-config-schema'

const config = buildConfiguration('cursor', {
  transport: 'http',
  serverUrl: 'https://example.com/mcp',
})
```

```typescript
// AFTER (v3.0)
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry()
const builder = registry.createBuilder('cursor')
const config = builder.buildConfiguration({
  transport: 'http',
  serverUrl: 'https://example.com/mcp',
})
```

### buildCommand() → builder.buildCommand()

```typescript
// BEFORE (v2.x)
import { buildCommand } from '@gleanwork/mcp-config-schema'

const command = buildCommand('cursor', {
  transport: 'http',
  serverUrl: 'https://example.com/mcp',
})
```

```typescript
// AFTER (v3.0)
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry()
const builder = registry.createBuilder('cursor')
const command = builder.buildCommand({
  transport: 'http',
  serverUrl: 'https://example.com/mcp',
})
```

### clientNeedsMcpRemote() → registry.clientNeedsMcpRemote()

```typescript
// BEFORE (v2.x)
import { clientNeedsMcpRemote } from '@gleanwork/mcp-config-schema'

if (clientNeedsMcpRemote('claude-desktop')) {
  // Use mcp-remote bridge
}
```

```typescript
// AFTER (v3.0)
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry()
if (registry.clientNeedsMcpRemote('claude-desktop')) {
  // Use mcp-remote bridge
}
```

### clientSupportsHttpNatively() → registry.clientSupportsHttpNatively()

```typescript
// BEFORE (v2.x)
import { clientSupportsHttpNatively } from '@gleanwork/mcp-config-schema'

if (clientSupportsHttpNatively('cursor')) {
  // Direct HTTP connection
}
```

```typescript
// AFTER (v3.0)
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry()
if (registry.clientSupportsHttpNatively('cursor')) {
  // Direct HTTP connection
}
```

### clientSupportsStdio() → registry.clientSupportsStdio()

```typescript
// BEFORE (v2.x)
import { clientSupportsStdio } from '@gleanwork/mcp-config-schema'

if (clientSupportsStdio('vscode')) {
  // stdio transport available
}
```

```typescript
// AFTER (v3.0)
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry()
if (registry.clientSupportsStdio('vscode')) {
  // stdio transport available
}
```

---

## Property Changes

### Removed: `apiToken`

The `apiToken` property has been removed. Use the `headers` object to pass authentication headers.

#### Pattern: HTTP Transport with Bearer Token

```typescript
// BEFORE (v2.x)
const config: MCPServerConfig = {
  transport: 'http',
  serverUrl: 'https://example.com/mcp/default',
  serverName: 'my-server',
  apiToken: 'my-secret-token',
}
```

```typescript
// AFTER (v3.0)
const config: MCPConnectionOptions = {
  transport: 'http',
  serverUrl: 'https://example.com/mcp/default',
  serverName: 'my-server',
  headers: {
    Authorization: 'Bearer my-secret-token',
  },
}
```

#### Pattern: Conditional Bearer Token

```typescript
// BEFORE (v2.x)
const config: MCPServerConfig = {
  transport: 'http',
  serverUrl,
  apiToken: useToken ? token : undefined,
}
```

```typescript
// AFTER (v3.0)
const config: MCPConnectionOptions = {
  transport: 'http',
  serverUrl,
  headers: useToken ? { Authorization: `Bearer ${token}` } : undefined,
}
```

#### Pattern: Auth Method Toggle (OAuth vs Bearer)

```typescript
// BEFORE (v2.x)
const config: MCPServerConfig = {
  transport: 'http',
  serverUrl,
  apiToken: authMethod === 'apiToken' ? bearerToken : undefined,
}
```

```typescript
// AFTER (v3.0)
const config: MCPConnectionOptions = {
  transport: 'http',
  serverUrl,
  headers: authMethod === 'apiToken' && bearerToken
    ? { Authorization: `Bearer ${bearerToken}` }
    : undefined,
}
```

### Removed: `instance`

The `instance` property has been removed. Use the `env` object to pass environment variables for stdio transport.

#### Pattern: stdio Transport with Instance

```typescript
// BEFORE (v2.x)
const config: MCPServerConfig = {
  transport: 'stdio',
  instance: 'my-company',
  apiToken: 'my-token',
}
```

```typescript
// AFTER (v3.0)
const config: MCPConnectionOptions = {
  transport: 'stdio',
  env: {
    GLEAN_INSTANCE: 'my-company',
    GLEAN_API_TOKEN: 'my-token',
  },
}
```

#### Pattern: Conditional Instance/URL

```typescript
// BEFORE (v2.x)
const config: MCPServerConfig = {
  transport: isRemote ? 'http' : 'stdio',
  serverUrl: isRemote ? url : undefined,
  instance: !isRemote ? instanceName : undefined,
  apiToken: token,
}
```

```typescript
// AFTER (v3.0)
const config: MCPConnectionOptions = {
  transport: isRemote ? 'http' : 'stdio',
  serverUrl: isRemote ? url : undefined,
  env: !isRemote ? {
    GLEAN_INSTANCE: instanceName,
    ...(token && { GLEAN_API_TOKEN: token }),
  } : undefined,
  headers: isRemote && token ? {
    Authorization: `Bearer ${token}`,
  } : undefined,
}
```

---

## New Properties

### `env`: Environment Variables for stdio Transport

The `env` property is a generic `Record<string, string>` for passing environment variables to stdio servers.

```typescript
const config: MCPConnectionOptions = {
  transport: 'stdio',
  env: {
    GLEAN_INSTANCE: 'my-company',
    GLEAN_API_TOKEN: 'my-token',
    // Any custom environment variables
    MY_CUSTOM_VAR: 'value',
  },
}
```

### `headers`: HTTP Headers

The `headers` property is a generic `Record<string, string>` for passing HTTP headers.

```typescript
const config: MCPConnectionOptions = {
  transport: 'http',
  serverUrl: 'https://example.com/mcp/default',
  headers: {
    Authorization: 'Bearer my-token',
    'X-Custom-Header': 'custom-value',
  },
}
```

### `urlVariables`: URL Template Variables

The `urlVariables` property enables URL template substitution using `{variableName}` syntax (aligned with MCP registry specification).

```typescript
const config: MCPConnectionOptions = {
  transport: 'http',
  serverUrl: 'https://api.example.com/{region}/mcp/{endpoint}',
  urlVariables: {
    region: 'us-east-1',
    endpoint: 'default',
  },
}
// Resolved URL: https://api.example.com/us-east-1/mcp/default
```

---

## Registry Options Changes

### Simplified RegistryOptions

The `RegistryOptions` type has been simplified. The `envVars` mapping has been removed since consumers now pass environment variables directly via the `env` property.

```typescript
// BEFORE (v2.x) - if envVars was used
const registry = new MCPConfigRegistry({
  serverPackage: '@my-org/mcp-server',
  cliPackage: '@my-org/configure-mcp',
  envVars: {
    instance: 'MY_INSTANCE',
    token: 'MY_TOKEN',
    url: 'MY_URL',
  },
})
```

```typescript
// AFTER (v3.0)
const registry = new MCPConfigRegistry({
  serverPackage: '@my-org/mcp-server',
  cliPackage: '@my-org/configure-mcp',
})

// Environment variable names are now passed directly in buildConfiguration:
builder.buildConfiguration({
  transport: 'stdio',
  env: {
    MY_INSTANCE: 'company-name',
    MY_TOKEN: 'secret-token',
  },
})
```

---

## Complete Migration Examples

### Example 1: HTTP Configuration with Authentication

```typescript
// BEFORE (v2.x)
import { MCPConfigRegistry, type MCPServerConfig } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry()
const builder = registry.createBuilder('cursor')

const serverData: MCPServerConfig = {
  transport: 'http',
  serverUrl: 'https://company-be.glean.com/mcp/default',
  serverName: 'glean_default',
  apiToken: 'my-api-token',
}

const config = builder.buildConfiguration(serverData)
```

```typescript
// AFTER (v3.0)
import { MCPConfigRegistry, type MCPConnectionOptions } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry()
const builder = registry.createBuilder('cursor')

const serverData: MCPConnectionOptions = {
  transport: 'http',
  serverUrl: 'https://company-be.glean.com/mcp/default',
  serverName: 'glean_default',
  headers: {
    Authorization: 'Bearer my-api-token',
  },
}

const config = builder.buildConfiguration(serverData)
```

### Example 2: stdio Configuration with Environment Variables

```typescript
// BEFORE (v2.x)
import { MCPConfigRegistry, type MCPServerConfig } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry({
  serverPackage: '@gleanwork/local-mcp-server',
})
const builder = registry.createBuilder('claude-code')

const serverData: MCPServerConfig = {
  transport: 'stdio',
  instance: 'my-company',
  apiToken: 'my-token',
  serverName: 'glean_local',
}

const config = builder.buildConfiguration(serverData)
```

```typescript
// AFTER (v3.0)
import { MCPConfigRegistry, type MCPConnectionOptions } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry({
  serverPackage: '@gleanwork/local-mcp-server',
})
const builder = registry.createBuilder('claude-code')

const serverData: MCPConnectionOptions = {
  transport: 'stdio',
  env: {
    GLEAN_INSTANCE: 'my-company',
    GLEAN_API_TOKEN: 'my-token',
  },
  serverName: 'glean_local',
}

const config = builder.buildConfiguration(serverData)
```

### Example 3: buildCommand via Builder

```typescript
// BEFORE (v2.x)
import { buildCommand, type MCPServerConfig } from '@gleanwork/mcp-config-schema'

const serverData: MCPServerConfig = {
  transport: 'http',
  serverUrl: 'https://example.com/mcp/default',
  serverName: 'test-server',
  apiToken: 'my-token',
}

const command = buildCommand('cursor', serverData)
```

```typescript
// AFTER (v3.0)
import { MCPConfigRegistry, type MCPConnectionOptions } from '@gleanwork/mcp-config-schema'

const registry = new MCPConfigRegistry()
const builder = registry.createBuilder('cursor')

const serverData: MCPConnectionOptions = {
  transport: 'http',
  serverUrl: 'https://example.com/mcp/default',
  serverName: 'test-server',
  headers: {
    Authorization: 'Bearer my-token',
  },
}

const command = builder.buildCommand(serverData)
```

### Example 4: One-Click URL Generation

```typescript
// BEFORE (v2.x)
const url = builder.buildOneClickUrl({
  transport: 'http',
  serverUrl: 'https://example.com/mcp/default',
  serverName: 'my-server',
  apiToken: authToken,
})
```

```typescript
// AFTER (v3.0)
const url = builder.buildOneClickUrl({
  transport: 'http',
  serverUrl: 'https://example.com/mcp/default',
  serverName: 'my-server',
  headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
})
```

### Example 5: React Hook with Auth Method Toggle

```typescript
// BEFORE (v2.x)
import type { MCPServerConfig } from '@gleanwork/mcp-config-schema'
import { buildCommand, MCPConfigRegistry } from '@gleanwork/mcp-config-schema'

const useMcpConfig = (config: MCPConfiguration) => {
  const registry = useMemo(() => new MCPConfigRegistry(), [])

  const generateCliCommand = useMemo(() => {
    const serverData: MCPServerConfig = {
      apiToken: config.authMethod === 'apiToken' ? config.bearerToken : undefined,
      serverName: fullServerName,
      serverUrl,
      transport: 'http' as const,
    }
    return buildCommand(config.clientId, serverData)
  }, [config, serverUrl, fullServerName])

  const generateConfiguration = useMemo(() => {
    const builder = registry.createBuilder(config.clientId)
    return builder.buildConfiguration({
      apiToken: config.authMethod === 'apiToken' ? config.bearerToken : undefined,
      includeRootObject: true,
      productName,
      serverName: fullServerName,
      serverUrl,
      transport: 'http',
    })
  }, [config, serverUrl, fullServerName, productName, registry])

  return { cliCommand: generateCliCommand, configuration: generateConfiguration }
}
```

```typescript
// AFTER (v3.0)
import type { MCPConnectionOptions } from '@gleanwork/mcp-config-schema'
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema'

const useMcpConfig = (config: MCPConfiguration) => {
  const registry = useMemo(() => new MCPConfigRegistry(), [])

  const generateCliCommand = useMemo(() => {
    const builder = registry.createBuilder(config.clientId)
    const serverData: MCPConnectionOptions = {
      headers: config.authMethod === 'apiToken' && config.bearerToken
        ? { Authorization: `Bearer ${config.bearerToken}` }
        : undefined,
      serverName: fullServerName,
      serverUrl,
      transport: 'http' as const,
    }
    return builder.buildCommand(serverData)
  }, [config, serverUrl, fullServerName, registry])

  const generateConfiguration = useMemo(() => {
    const builder = registry.createBuilder(config.clientId)
    return builder.buildConfiguration({
      headers: config.authMethod === 'apiToken' && config.bearerToken
        ? { Authorization: `Bearer ${config.bearerToken}` }
        : undefined,
      includeRootObject: true,
      productName,
      serverName: fullServerName,
      serverUrl,
      transport: 'http',
    })
  }, [config, serverUrl, fullServerName, productName, registry])

  return { cliCommand: generateCliCommand, configuration: generateConfiguration }
}
```

---

## Search and Replace Patterns

Use these regex patterns to help automate the migration:

### Type Imports

```regex
# Find MCPServerConfig type imports
import\s+(?:type\s+)?{\s*([^}]*\b)MCPServerConfig(\b[^}]*)\s*}\s+from\s+['"]@gleanwork/mcp-config-schema['"]

# Replace with MCPConnectionOptions
```

### Property Replacements

```regex
# Find apiToken property assignments
apiToken:\s*([^,}\n]+)

# Find instance property assignments
instance:\s*([^,}\n]+)
```

---

## Deprecation Aliases

For backward compatibility during migration, the following aliases are available but deprecated:

```typescript
// These still work but are deprecated:
import {
  MCPServerConfig,           // Deprecated alias for MCPConnectionOptions
  validateServerConfig,      // Deprecated alias for validateConnectionOptions
  safeValidateServerConfig,  // Deprecated alias for safeValidateConnectionOptions
} from '@gleanwork/mcp-config-schema'
```

**Note:** These aliases will be removed in a future major version. Update your code to use the new names.

---

## Testing Your Migration

After migrating, run these checks:

1. **TypeScript compilation**: `npm run typecheck` or `tsc --noEmit`
2. **Unit tests**: `npm test`
3. **Build**: `npm run build`

Common errors to watch for:

- `Property 'apiToken' does not exist on type 'MCPConnectionOptions'`
- `Property 'instance' does not exist on type 'MCPConnectionOptions'`
- `Cannot find name 'MCPServerConfig'`
- `Module '"@gleanwork/mcp-config-schema"' has no exported member 'buildConfiguration'`
- `Module '"@gleanwork/mcp-config-schema"' has no exported member 'buildCommand'`
- `Module '"@gleanwork/mcp-config-schema"' has no exported member 'clientNeedsMcpRemote'`

---

## Questions?

If you encounter issues during migration, check:

1. The [CHANGELOG.md](../../CHANGELOG.md) for detailed release notes
2. The [README.md](../../README.md) for updated API documentation
3. The [test files](../../test/) for working examples of the new API
