import type {
  MCPConfig,
  MCPConfigFactory,
  MCPConnectionOptions,
  MCPClientConfig,
  Platform,
} from './types.js';
import type { BaseConfigBuilder } from './builders/BaseConfigBuilder.js';
import { MCPConfigRegistry } from './registry.js';

/**
 * Create an MCP configuration factory.
 *
 * @param config - Configuration for your MCP server
 * @returns A factory with methods for building configurations
 *
 * @example
 * ```typescript
 * import { createMCPConfigFactory } from '@gleanwork/mcp-config-schema';
 *
 * const factory = createMCPConfigFactory({
 *   serverPackage: '@my-org/mcp-server',
 *   cliPackage: '@my-org/configure-mcp',
 *   envVars: { url: 'MY_URL', instance: 'MY_INSTANCE', token: 'MY_TOKEN' },
 *   urlPattern: 'https://[instance].company.com/mcp/[endpoint]',
 * });
 *
 * const builder = factory.createBuilder('cursor');
 * const config = factory.buildConfiguration('cursor', { transport: 'http', serverUrl: '...' });
 * ```
 */
export function createMCPConfigFactory(config: MCPConfig): MCPConfigFactory {
  if (config === null || config === undefined) {
    throw new Error('MCPConfig is required');
  }

  if (typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('MCPConfig must be an object');
  }

  const registry = new MCPConfigRegistry({ mcpConfig: config });

  return {
    createBuilder(clientId: string): BaseConfigBuilder {
      return registry.createBuilder(clientId);
    },

    buildConfiguration(clientId: string, options: MCPConnectionOptions): Record<string, unknown> {
      const builder = registry.createBuilder(clientId);
      return builder.buildConfiguration(options);
    },

    buildConfigurationString(clientId: string, options: MCPConnectionOptions): string {
      const builder = registry.createBuilder(clientId);
      const configObj = builder.buildConfiguration(options);
      return builder.toString(configObj);
    },

    buildCommand(clientId: string, options: MCPConnectionOptions): string | null {
      try {
        const builder = registry.createBuilder(clientId);
        return builder.buildCommand(options);
      } catch {
        return null;
      }
    },

    buildOneClickUrl(clientId: string, options: MCPConnectionOptions): string {
      const builder = registry.createBuilder(clientId);
      if (!builder.buildOneClickUrl) {
        throw new Error(`One-click URL is not supported for client: ${clientId}`);
      }
      return builder.buildOneClickUrl(options);
    },

    clientNeedsMcpRemote(clientId: string): boolean {
      return registry.clientNeedsMcpRemote(clientId);
    },

    clientSupportsHttpNatively(clientId: string): boolean {
      return registry.clientSupportsHttpNatively(clientId);
    },

    clientSupportsStdio(clientId: string): boolean {
      return registry.clientSupportsStdio(clientId);
    },

    getConfig(clientId: string): MCPClientConfig | undefined {
      return registry.getConfig(clientId);
    },

    getAllConfigs(): MCPClientConfig[] {
      return registry.getAllConfigs();
    },

    getNativeHttpClients(): MCPClientConfig[] {
      return registry.getNativeHttpClients();
    },

    getBridgeRequiredClients(): MCPClientConfig[] {
      return registry.getBridgeRequiredClients();
    },

    getClientsByPlatform(platform: Platform): MCPClientConfig[] {
      return registry.getClientsByPlatform(platform);
    },

    hasClient(clientId: string): boolean {
      return registry.hasClient(clientId);
    },

    getRegistry(): MCPConfigRegistry {
      return registry;
    },
  };
}
