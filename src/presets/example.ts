import type { MCPConfig } from '../types.js';

/**
 * Example preset configuration for documentation and testing.
 * Use this as a reference for creating your own MCPConfig.
 *
 * @example
 * ```typescript
 * import { createMCPConfigFactory } from '@gleanwork/mcp-config-schema';
 * import type { MCPConfig } from '@gleanwork/mcp-config-schema';
 *
 * const myConfig: MCPConfig = {
 *   serverPackage: '@my-org/mcp-server',
 *   cliPackage: '@my-org/configure-mcp',
 *   envVars: {
 *     url: 'MY_SERVER_URL',
 *     instance: 'MY_INSTANCE',
 *     token: 'MY_API_TOKEN',
 *   },
 *   urlPattern: 'https://[instance].example.com/mcp/[endpoint]',
 * };
 *
 * const mcp = createMCPConfigFactory(myConfig);
 * ```
 */
export const examplePreset: MCPConfig = {
  serverPackage: '@example/mcp-server',
  cliPackage: '@example/configure-mcp',
  envVars: {
    url: 'EXAMPLE_URL',
    instance: 'EXAMPLE_INSTANCE',
    token: 'EXAMPLE_API_TOKEN',
  },
  urlPattern: 'https://[instance].example.com/mcp/[endpoint]',
};
