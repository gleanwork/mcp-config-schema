# Migration Guide: v1.x to v2.0.0

## Overview

Version 2.0.0 introduces breaking changes focused on improving naming clarity and semantic meaning across the codebase. This guide provides detailed instructions for migrating from v1.x to v2.0.0.

**Key Changes:**
- Simplified configuration support detection (enum → boolean)
- Improved field naming for better semantic clarity
- Removed unused schema fields
- Renamed types for consistency

---

## Breaking Changes Summary

### Type and Schema Changes

| v1.x | v2.0.0 | Change Type |
|------|---------|-------------|
| `LocalConfigSupport` enum | Removed | Type removed |
| `RemoteConfigSupport` enum | Removed | Type removed |
| `localConfigSupport: 'full' \| 'none'` | `userConfigurable: boolean` | Field renamed, type changed |
| `remoteConfigSupport` | Removed | Field removed (unused) |
| `GleanServerConfig` | `MCPServerConfig` | Type renamed |

### Field Naming Changes

| v1.x | v2.0.0 | Scope |
|------|---------|-------|
| `serverKey` | `serversPropertyName` | `configStructure` |
| `httpConfig` | `httpPropertyMapping` | `configStructure` |
| `stdioConfig` | `stdioPropertyMapping` | `configStructure` |
| `oneClick` | `protocolHandler` | Client config root |
| `includeWrapper` | `includeRootObject` | `MCPServerConfig` parameter |

### Property Field Changes

All `*Field` suffixes changed to `*Property`:

| v1.x | v2.0.0 |
|------|---------|
| `typeField` | `typeProperty` |
| `urlField` | `urlProperty` |
| `commandField` | `commandProperty` |
| `argsField` | `argsProperty` |
| `envField` | `envProperty` |
| `headersField` | `headersProperty` |

---

## Detailed Migration Instructions

### 1. Configuration Support Detection

**Before (v1.x):**
```typescript
import { MCPClientConfig, LocalConfigSupport } from '@gleanwork/mcp-config-schema';

function canConfigureLocally(config: MCPClientConfig): boolean {
  return config.localConfigSupport === 'full';
}

// Checking for partial support
if (config.localConfigSupport === 'partial') {
  // Handle partial support case
}
```

**After (v2.0.0):**
```typescript
import { MCPClientConfig } from '@gleanwork/mcp-config-schema';
// LocalConfigSupport type no longer exists

function canConfigureLocally(config: MCPClientConfig): boolean {
  return config.userConfigurable === true;
  // or simply: return config.userConfigurable;
}

// Boolean check - no partial support anymore
if (config.userConfigurable) {
  // Client supports user configuration
} else {
  // Client does not support user configuration
}
```

**Migration Pattern:**
- Replace `config.localConfigSupport === 'full'` → `config.userConfigurable`
- Replace `config.localConfigSupport === 'none'` → `!config.userConfigurable`
- Remove any references to `'partial'` (no longer supported)
- Remove imports of `LocalConfigSupport` and `RemoteConfigSupport`

---

### 2. Type Renaming

**Before (v1.x):**
```typescript
import { GleanServerConfig } from '@gleanwork/mcp-config-schema';

function buildConfig(serverData: GleanServerConfig) {
  // ...
}
```

**After (v2.0.0):**
```typescript
import { MCPServerConfig } from '@gleanwork/mcp-config-schema';

function buildConfig(serverData: MCPServerConfig) {
  // ...
}
```

**Migration Pattern:**
- Find and replace all `GleanServerConfig` → `MCPServerConfig`

---

### 3. Configuration Structure Fields

**Before (v1.x):**
```typescript
const { serverKey, httpConfig, stdioConfig } = clientConfig.configStructure;

// Accessing HTTP configuration
if (httpConfig) {
  const urlField = httpConfig.urlField;
  const typeField = httpConfig.typeField;
  const headersField = httpConfig.headersField;
}

// Accessing stdio configuration
if (stdioConfig) {
  const commandField = stdioConfig.commandField;
  const argsField = stdioConfig.argsField;
  const envField = stdioConfig.envField;
}

// Using serverKey
const servers = config[serverKey];
```

**After (v2.0.0):**
```typescript
const { serversPropertyName, httpPropertyMapping, stdioPropertyMapping } = clientConfig.configStructure;

// Accessing HTTP configuration
if (httpPropertyMapping) {
  const urlProperty = httpPropertyMapping.urlProperty;
  const typeProperty = httpPropertyMapping.typeProperty;
  const headersProperty = httpPropertyMapping.headersProperty;
}

// Accessing stdio configuration
if (stdioPropertyMapping) {
  const commandProperty = stdioPropertyMapping.commandProperty;
  const argsProperty = stdioPropertyMapping.argsProperty;
  const envProperty = stdioPropertyMapping.envProperty;
}

// Using serversPropertyName
const servers = config[serversPropertyName];
```

**Migration Pattern:**
- `serverKey` → `serversPropertyName`
- `httpConfig` → `httpPropertyMapping`
- `stdioConfig` → `stdioPropertyMapping`
- `*.typeField` → `*.typeProperty`
- `*.urlField` → `*.urlProperty`
- `*.commandField` → `*.commandProperty`
- `*.argsField` → `*.argsProperty`
- `*.envField` → `*.envProperty`
- `*.headersField` → `*.headersProperty`

---

### 4. Protocol Handler (formerly One-Click)

**Before (v1.x):**
```typescript
if (clientConfig.oneClick) {
  const protocol = clientConfig.oneClick.protocol;
  const urlTemplate = clientConfig.oneClick.urlTemplate;
}
```

**After (v2.0.0):**
```typescript
if (clientConfig.protocolHandler) {
  const protocol = clientConfig.protocolHandler.protocol;
  const urlTemplate = clientConfig.protocolHandler.urlTemplate;
}
```

**Migration Pattern:**
- `oneClick` → `protocolHandler` (in client config root level)

---

### 5. Configuration Building Parameters

**Before (v1.x):**
```typescript
const config = builder.buildConfiguration({
  transport: 'http',
  serverUrl: 'https://example.com/mcp/default',
  includeWrapper: false, // Optional parameter
});
```

**After (v2.0.0):**
```typescript
const config = builder.buildConfiguration({
  transport: 'http',
  serverUrl: 'https://example.com/mcp/default',
  includeRootObject: false, // Renamed parameter
});
```

**Migration Pattern:**
- `includeWrapper` → `includeRootObject` (in `MCPServerConfig` and related interfaces)

---

## Programmatic Migration

### Search and Replace Patterns

For automated migration, use these patterns:

#### TypeScript/JavaScript Files

```bash
# Type renames
sed -i 's/GleanServerConfig/MCPServerConfig/g' **/*.ts

# Field renames in destructuring
sed -i 's/serverKey,/serversPropertyName,/g' **/*.ts
sed -i 's/httpConfig,/httpPropertyMapping,/g' **/*.ts
sed -i 's/stdioConfig,/stdioPropertyMapping,/g' **/*.ts

# Property access patterns
sed -i 's/\.serverKey/\.serversPropertyName/g' **/*.ts
sed -i 's/\.httpConfig/\.httpPropertyMapping/g' **/*.ts
sed -i 's/\.stdioConfig/\.stdioPropertyMapping/g' **/*.ts
sed -i 's/\.oneClick/\.protocolHandler/g' **/*.ts

# Property field renames
sed -i 's/\.typeField/\.typeProperty/g' **/*.ts
sed -i 's/\.urlField/\.urlProperty/g' **/*.ts
sed -i 's/\.commandField/\.commandProperty/g' **/*.ts
sed -i 's/\.argsField/\.argsProperty/g' **/*.ts
sed -i 's/\.envField/\.envProperty/g' **/*.ts
sed -i 's/\.headersField/\.headersProperty/g' **/*.ts

# Parameter renames
sed -i 's/includeWrapper:/includeRootObject:/g' **/*.ts
sed -i 's/includeWrapper,/includeRootObject,/g' **/*.ts

# Config support checks
sed -i "s/localConfigSupport === 'full'/userConfigurable/g" **/*.ts
sed -i "s/localConfigSupport === 'none'/!userConfigurable/g" **/*.ts
```

#### JSON Configuration Files

```bash
# If you have custom client configs, update field names
sed -i 's/"serverKey":/"serversPropertyName":/g' **/*.json
sed -i 's/"httpConfig":/"httpPropertyMapping":/g' **/*.json
sed -i 's/"stdioConfig":/"stdioPropertyMapping":/g' **/*.json
sed -i 's/"oneClick":/"protocolHandler":/g' **/*.json
sed -i 's/"typeField":/"typeProperty":/g' **/*.json
sed -i 's/"urlField":/"urlProperty":/g' **/*.json
sed -i 's/"commandField":/"commandProperty":/g' **/*.json
sed -i 's/"argsField":/"argsProperty":/g' **/*.json
sed -i 's/"envField":/"envProperty":/g' **/*.json
sed -i 's/"headersField":/"headersProperty":/g' **/*.json
sed -i 's/"localConfigSupport":/"userConfigurable":/g' **/*.json

# Remove remoteConfigSupport field (if present)
sed -i '/"remoteConfigSupport":/d' **/*.json
```

---

## Common Migration Scenarios

### Scenario 1: Checking if a Client Supports Configuration

**Before (v1.x):**
```typescript
import { MCPConfigRegistry, LocalConfigSupport } from '@gleanwork/mcp-config-schema';

const registry = new MCPConfigRegistry();
const config = registry.getConfig('claude-code');

if (config?.localConfigSupport === 'full') {
  // Client supports full configuration
  const builder = registry.createBuilder('claude-code');
}
```

**After (v2.0.0):**
```typescript
import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema';

const registry = new MCPConfigRegistry();
const config = registry.getConfig('claude-code');

if (config?.userConfigurable) {
  // Client supports configuration
  const builder = registry.createBuilder('claude-code');
}
```

---

### Scenario 2: Building Configuration Objects

**Before (v1.x):**
```typescript
const { serverKey, httpConfig, stdioConfig } = clientConfig.configStructure;

const serverConfig: Record<string, unknown> = {};

if (httpConfig?.typeField) {
  serverConfig[httpConfig.typeField] = 'http';
}

if (httpConfig?.urlField) {
  serverConfig[httpConfig.urlField] = serverUrl;
}

return {
  [serverKey]: {
    [serverName]: serverConfig,
  },
};
```

**After (v2.0.0):**
```typescript
const { serversPropertyName, httpPropertyMapping, stdioPropertyMapping } = clientConfig.configStructure;

const serverConfig: Record<string, unknown> = {};

if (httpPropertyMapping?.typeProperty) {
  serverConfig[httpPropertyMapping.typeProperty] = 'http';
}

if (httpPropertyMapping?.urlProperty) {
  serverConfig[httpPropertyMapping.urlProperty] = serverUrl;
}

return {
  [serversPropertyName]: {
    [serverName]: serverConfig,
  },
};
```

---

### Scenario 3: Filtering Clients by Support Level

**Before (v1.x):**
```typescript
const registry = new MCPConfigRegistry();

// Get all clients with full local config support
const supportedClients = registry.getAllConfigs()
  .filter(config => config.localConfigSupport === 'full');

// Get clients without support
const unsupportedClients = registry.getAllConfigs()
  .filter(config => config.localConfigSupport === 'none');
```

**After (v2.0.0):**
```typescript
const registry = new MCPConfigRegistry();

// Get all clients with user configuration support
const supportedClients = registry.getAllConfigs()
  .filter(config => config.userConfigurable);

// Or use the convenience method
const supportedClients = registry.getSupportedClients();

// Get clients without support
const unsupportedClients = registry.getAllConfigs()
  .filter(config => !config.userConfigurable);

// Or use the convenience method
const unsupportedClients = registry.getUnsupportedClients();
```

---

## Validation After Migration

After completing your migration, validate the changes:

### 1. Type Checking
```bash
npx tsc --noEmit
```

### 2. Search for Old Patterns
```bash
# Check for any remaining old field names
grep -r "serverKey" src/
grep -r "httpConfig" src/
grep -r "stdioConfig" src/
grep -r "oneClick" src/
grep -r "GleanServerConfig" src/
grep -r "localConfigSupport" src/
grep -r "remoteConfigSupport" src/
grep -r "includeWrapper" src/

# Check for old property suffixes
grep -r "typeField" src/
grep -r "urlField" src/
grep -r "commandField" src/
grep -r "argsField" src/
grep -r "envField" src/
grep -r "headersField" src/
```

### 3. Run Tests
```bash
npm test
```

---

## LLM Migration Instructions

For automated migration using an LLM agent, follow this sequence:

### Step 1: Update Imports
```
Action: Find and replace in all TypeScript files
Pattern: import.*GleanServerConfig.*from
Replacement: import.*MCPServerConfig.*from
Also remove: LocalConfigSupport, RemoteConfigSupport imports
```

### Step 2: Update Type References
```
Action: Find and replace globally
Pattern: \bGleanServerConfig\b
Replacement: MCPServerConfig
```

### Step 3: Update Configuration Structure Access
```
Action: Update destructuring patterns
Patterns to find and replace:
  - const { serverKey → const { serversPropertyName
  - const { httpConfig → const { httpPropertyMapping
  - const { stdioConfig → const { stdioPropertyMapping
```

### Step 4: Update Property Access
```
Action: Find and replace globally
Patterns:
  - \.serverKey → \.serversPropertyName
  - \.httpConfig → \.httpPropertyMapping
  - \.stdioConfig → \.stdioPropertyMapping
  - \.oneClick → \.protocolHandler
  - \.typeField → \.typeProperty
  - \.urlField → \.urlProperty
  - \.commandField → \.commandProperty
  - \.argsField → \.argsProperty
  - \.envField → \.envProperty
  - \.headersField → \.headersProperty
```

### Step 5: Update Configuration Support Checks
```
Action: Find and replace logic
Patterns:
  - localConfigSupport === 'full' → userConfigurable
  - localConfigSupport === 'none' → !userConfigurable
  - localConfigSupport !== 'none' → userConfigurable
Remove: Any checks for 'partial'
```

### Step 6: Update Parameters
```
Action: Find and replace in function calls
Pattern: includeWrapper
Replacement: includeRootObject
```

### Step 7: Validation
```
Action: Run validation checks
1. TypeScript compilation: tsc --noEmit
2. Run tests: npm test
3. Search for any remaining old patterns using grep
```

---

## Troubleshooting

### Issue: TypeScript errors about missing properties

**Problem:** `Property 'serverKey' does not exist on type 'ConfigStructure'`

**Solution:** You missed renaming `serverKey` to `serversPropertyName` in some locations. Search for all occurrences and update them.

---

### Issue: Runtime errors accessing undefined properties

**Problem:** `Cannot read property 'urlField' of undefined`

**Solution:** The property was renamed from `urlField` to `urlProperty`. Update all property field accesses.

---

### Issue: Logic errors with configuration support checks

**Problem:** Clients that should be configurable are being filtered out

**Solution:** Update boolean logic from enum checks:
- `localConfigSupport === 'full'` → `userConfigurable`
- `localConfigSupport === 'none'` → `!userConfigurable`

---

## Need Help?

If you encounter issues during migration:

1. Check the [GitHub Issues](https://github.com/gleanwork/mcp-config-schema/issues) for similar problems
2. Review this migration guide for examples matching your use case
3. Ensure all search-and-replace patterns were applied correctly
4. Validate TypeScript compilation passes with no errors

---

**Last Updated:** 2025-11-17
**Target Version:** 2.0.0
