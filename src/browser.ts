/**
 * Browser-safe exports for @gleanwork/mcp-config-schema
 *
 * Import from '@gleanwork/mcp-config-schema/browser' to use in browser environments.
 * This module only exports functionality that works in browsers.
 */

export * from './types.js';

export {
  validateClientConfig,
  validateServerConfig,
  safeValidateClientConfig,
  safeValidateServerConfig,
  validateGeneratedConfig,
  validateMcpServersConfig,
  validateVsCodeConfig,
  validateGooseConfig,
} from './schemas.js';

export { MCPConfigRegistry } from './registry.js';
export { ConfigBuilder } from './builder.js';
