/**
 * Example showing how @gleanwork/configure-mcp-server could use this package
 */

import { createMCPToolkit, ClientId } from '../src/index';

// This is how configure-mcp-server could use our package

const toolkit = createMCPToolkit();

/**
 * Get configuration metadata for a client
 */
export function getClientMetadata(clientId: ClientId) {
  const config = toolkit.registry.getConfig(clientId);
  if (!config) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  return {
    displayName: config.displayName,
    requiresBridge: config.requiresMcpRemoteForHttp,
    platform: config.supportedPlatforms,
    configPath: config.configPath,
    securityNotes: config.securityNotes,
  };
}

/**
 * Generate configuration for a client
 */
export function generateClientConfig(
  clientId: ClientId,
  serverUrl: string,
  serverName?: string
) {
  const builder = toolkit.createBuilder(clientId);
  return builder.buildConfiguration({
    serverUrl,
    serverName: serverName || 'glean',
  });
}

/**
 * Check if a client is supported on the current platform
 */
export function isClientSupported(clientId: ClientId): boolean {
  const platform = process.platform as 'darwin' | 'linux' | 'win32';
  const config = toolkit.registry.getConfig(clientId);
  return config ? config.supportedPlatforms.includes(platform) : false;
}

/**
 * Get all clients that can be configured on the current platform
 */
export function getAvailableClients() {
  const platform = process.platform as 'darwin' | 'linux' | 'win32';
  return toolkit.registry
    .getClientsByPlatform(platform)
    .filter((c) => c.compatibility === 'full');
}

/**
 * Write configuration for a client
 */
export async function configureClient(
  clientId: ClientId,
  serverUrl: string,
  serverName?: string
) {
  const config = toolkit.registry.getConfig(clientId);
  if (!config) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  const builder = toolkit.createBuilder(clientId);
  
  // Generate config path
  const configPath = builder.getConfigPath();
  console.log(`Will write to: ${configPath}`);

  // Check if needs bridge
  if (config.requiresMcpRemoteForHttp) {
    console.log(`Note: ${config.displayName} requires mcp-remote bridge`);
  }

  // Write the configuration
  await builder.writeConfiguration({
    serverUrl,
    serverName: serverName || 'glean',
  });

  return {
    configPath,
    requiresBridge: config.requiresMcpRemoteForHttp,
    securityNotes: config.securityNotes,
  };
}

// Example usage
async function main() {
  // List available clients
  const clients = getAvailableClients();
  console.log('Available clients:', clients.map((c) => c.displayName));

  // Configure a specific client
  const result = await configureClient(
    'cursor',
    'https://glean-dev-be.glean.com/mcp/default'
  );
  
  console.log('Configuration written to:', result.configPath);
  if (result.securityNotes) {
    console.log('Security warning:', result.securityNotes);
  }
}

// Uncomment to run example
// main().catch(console.error);
