import { MCPConfigRegistry } from './registry.js';
import { ConfigBuilder } from './builder.js';
import { ClientId } from './types.js';

export interface MCPToolkit {
  registry: MCPConfigRegistry;
  createBuilder: (clientId: ClientId) => ConfigBuilder;
}

export function createMCPToolkit(configDir?: string): MCPToolkit {
  const registry = new MCPConfigRegistry(configDir);

  return {
    registry,
    createBuilder: (clientId: ClientId) => {
      const config = registry.getConfig(clientId);
      if (!config) {
        throw new Error(`Unknown client: ${clientId}`);
      }
      return new ConfigBuilder(config);
    },
  };
}
