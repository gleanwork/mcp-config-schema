import type { MCPConfig } from '../types.js';

/**
 * Preset configuration for Glean MCP servers.
 */
export const gleanPreset: MCPConfig = {
  serverPackage: '@gleanwork/local-mcp-server',
  cliPackage: '@gleanwork/configure-mcp-server',
  envVars: {
    url: 'GLEAN_URL',
    instance: 'GLEAN_INSTANCE',
    token: 'GLEAN_API_TOKEN',
  },
  urlPattern: 'https://[instance]-be.glean.com/mcp/[endpoint]',
};
