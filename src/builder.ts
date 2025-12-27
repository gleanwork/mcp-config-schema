import { ClientId, MCPConnectionOptions, MCPServersRecord, ConfigForClient } from './types.js';
import { MCPConfigRegistry } from './registry.js';

// Create a singleton instance of the registry
const registry = new MCPConfigRegistry();

/**
 * Convenience function to build configuration for a specific client
 * without needing to instantiate the registry directly.
 *
 * The return type is based on the client ID and includeRootObject option:
 * - When includeRootObject is false, returns MCPServersRecord (flat servers)
 * - When includeRootObject is true/undefined:
 *   - 'vscode' returns VSCodeMCPConfig
 *   - 'goose' returns GooseMCPConfig
 *   - 'codex' returns CodexMCPConfig
 *   - All others return StandardMCPConfig
 *
 * @example
 * ```typescript
 * const vsCodeConfig = buildConfiguration('vscode', options);
 * vsCodeConfig.servers; // ✓ Typed as MCPServersRecord
 *
 * const partial = buildConfiguration('cursor', { transport: 'stdio', includeRootObject: false });
 * // partial is MCPServersRecord (flat)
 * ```
 */
export function buildConfiguration<C extends ClientId>(
  clientId: C,
  serverData: MCPConnectionOptions & { includeRootObject: false }
): MCPServersRecord;
export function buildConfiguration<C extends ClientId>(
  clientId: C,
  serverData: MCPConnectionOptions & { includeRootObject?: true }
): ConfigForClient<C>;
export function buildConfiguration<C extends ClientId>(
  clientId: C,
  serverData: MCPConnectionOptions
): ConfigForClient<C> | MCPServersRecord;
export function buildConfiguration<C extends ClientId>(
  clientId: C,
  serverData: MCPConnectionOptions
): ConfigForClient<C> | MCPServersRecord {
  const builder = registry.createBuilder(clientId);
  return builder.buildConfiguration(serverData);
}

/**
 * Convenience function to build configuration as a string for a specific client
 * without needing to instantiate the registry directly.
 *
 * @param clientId - The client to build configuration for
 * @param serverData - The server configuration data
 * @returns The built configuration as a formatted string (JSON or YAML)
 */
export function buildConfigurationString(
  clientId: ClientId,
  serverData: MCPConnectionOptions
): string {
  const builder = registry.createBuilder(clientId);
  const config = builder.buildConfiguration(serverData);
  return builder.toString(config);
}

/**
 * Convenience function to build a one-click installation URL for a specific client
 * without needing to instantiate the registry directly.
 *
 * @param clientId - The client to build the URL for
 * @param serverData - The server configuration data
 * @returns The one-click installation URL
 */
export function buildOneClickUrl(clientId: ClientId, serverData: MCPConnectionOptions): string {
  const builder = registry.createBuilder(clientId);
  if (!builder.buildOneClickUrl) {
    throw new Error(`One-click URL is not supported for client: ${clientId}`);
  }
  return builder.buildOneClickUrl(serverData);
}

/**
 * Determines if a client needs mcp-remote to connect to HTTP servers.
 * This is a convenience function that doesn't require instantiating the registry.
 *
 * @param clientId - The client to check
 * @returns true if the client needs mcp-remote for HTTP connections
 */
export function clientNeedsMcpRemote(clientId: ClientId): boolean {
  return registry.clientNeedsMcpRemote(clientId);
}

/**
 * Determines if a client can connect to HTTP servers natively.
 * This is a convenience function that doesn't require instantiating the registry.
 *
 * @param clientId - The client to check
 * @returns true if the client supports HTTP natively
 */
export function clientSupportsHttpNatively(clientId: ClientId): boolean {
  return registry.clientSupportsHttpNatively(clientId);
}

/**
 * Determines if a client can connect to stdio servers.
 * This is a convenience function that doesn't require instantiating the registry.
 *
 * @param clientId - The client to check
 * @returns true if the client supports stdio
 */
export function clientSupportsStdio(clientId: ClientId): boolean {
  return registry.clientSupportsStdio(clientId);
}

/**
 * Convenience function to build a CLI command for installing an MCP server
 * without needing to instantiate the registry directly.
 *
 * @param clientId - The client to build the command for
 * @param serverData - The server configuration data
 * @returns The CLI command string, or null if the client doesn't support CLI installation
 */
export function buildCommand(clientId: ClientId, serverData: MCPConnectionOptions): string | null {
  try {
    const builder = registry.createBuilder(clientId);
    return builder.buildCommand(serverData);
  } catch (error) {
    // Return null for any errors (unsupported clients, validation errors, etc.)
    return null;
  }
}
