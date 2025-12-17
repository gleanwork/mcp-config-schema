import { z } from 'zod';
import {
  PlatformSchema,
  ClientIdSchema,
  SupportedTransportsSchema,
  ServerTypeSchema,
  TransportSchema,
  HttpConfigStructureSchema,
  StdioConfigStructureSchema,
  ConfigStructureSchema,
  PlatformPathsSchema,
  MCPClientConfigSchema,
  MCPConnectionOptionsSchema,
  BuildOptionsSchema,
  HttpServerConfigSchema,
  HttpServerConfigAltSchema,
  StdioServerConfigSchema,
  StdioServerConfigAltSchema,
  ServerConfigSchema,
  McpServersConfigSchema,
  VsCodeConfigSchema,
  GooseServerConfigSchema,
  GooseConfigSchema,
  GeminiHttpServerConfigSchema,
  GeminiStdioServerConfigSchema,
  GeminiServerConfigSchema,
  GeminiConfigSchema,
} from './schemas.js';

/**
 * Environment variable name mappings for an MCP server.
 * Maps semantic names to actual environment variable names.
 */
export interface MCPEnvVarNames {
  /** Environment variable name for the server URL (used when instance is a URL) */
  url?: string;
  /** Environment variable name for instance identifier */
  instance?: string;
  /** Environment variable name for API token */
  token?: string;
}

/**
 * Configuration for the MCP config schema library.
 * Defines how the library generates configurations for a specific MCP server.
 *
 * @example
 * ```typescript
 * const config: MCPConfig = {
 *   serverPackage: '@my-org/mcp-server',
 *   cliPackage: '@my-org/configure-mcp',
 *   envVars: {
 *     url: 'MY_SERVER_URL',
 *     instance: 'MY_INSTANCE',
 *     token: 'MY_API_TOKEN',
 *   },
 *   urlPattern: 'https://[instance].my-company.com/mcp/[endpoint]',
 * };
 * ```
 */
export interface MCPConfig {
  /** NPM package for stdio MCP server (e.g., '@my-org/mcp-server') */
  serverPackage?: string;
  /** CLI package for configuring host apps (e.g., '@my-org/configure-mcp') */
  cliPackage?: string;
  /** Environment variable name mappings */
  envVars?: MCPEnvVarNames;
  /** URL pattern with [instance] and [endpoint] placeholders */
  urlPattern?: string;
}

// Forward declaration for MCPConfigRegistry (avoid circular import)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MCPConfigRegistryType = any;

// Forward declaration for BaseConfigBuilder (avoid circular import)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseConfigBuilderType = any;

/**
 * Factory for building MCP configurations.
 * Returned by createMCPConfigFactory().
 */
export interface MCPConfigFactory {
  /** Create a configuration builder for a specific client */
  createBuilder(clientId: string): BaseConfigBuilderType;

  /** Build configuration for a client */
  buildConfiguration(clientId: string, options: MCPConnectionOptions): Record<string, unknown>;

  /** Build configuration as a string (JSON, YAML, or TOML) */
  buildConfigurationString(clientId: string, options: MCPConnectionOptions): string;

  /** Build a CLI command for installing the MCP server */
  buildCommand(clientId: string, options: MCPConnectionOptions): string | null;

  /** Build a one-click installation URL */
  buildOneClickUrl(clientId: string, options: MCPConnectionOptions): string;

  /** Check if a client needs mcp-remote for HTTP connections */
  clientNeedsMcpRemote(clientId: string): boolean;

  /** Check if a client supports HTTP natively */
  clientSupportsHttpNatively(clientId: string): boolean;

  /** Check if a client supports stdio */
  clientSupportsStdio(clientId: string): boolean;

  /** Get configuration for a specific client */
  getConfig(clientId: string): MCPClientConfig | undefined;

  /** Get all client configurations */
  getAllConfigs(): MCPClientConfig[];

  /** Get clients that support HTTP natively */
  getNativeHttpClients(): MCPClientConfig[];

  /** Get clients that require mcp-remote bridge */
  getBridgeRequiredClients(): MCPClientConfig[];

  /** Get clients by platform */
  getClientsByPlatform(platform: Platform): MCPClientConfig[];

  /** Check if a client exists in the registry */
  hasClient(clientId: string): boolean;

  /** Get the underlying registry (for advanced use cases) */
  getRegistry(): MCPConfigRegistryType;
}

export type Platform = z.infer<typeof PlatformSchema>;
export type ClientId = z.infer<typeof ClientIdSchema>;

/**
 * Extended client ID that can include plugin-provided clients.
 * Uses string intersection for runtime extensibility while maintaining
 * type safety for built-in clients.
 *
 * @example
 * ```typescript
 * const builtIn: ExtendedClientId = 'cursor'; // OK - built-in
 * const custom: ExtendedClientId = 'my-custom-ide'; // OK - plugin-provided
 * ```
 */
export type ExtendedClientId = ClientId | (string & {});
export type SupportedTransports = z.infer<typeof SupportedTransportsSchema>;
export type ServerType = z.infer<typeof ServerTypeSchema>;
export type Transport = z.infer<typeof TransportSchema>;
export type HttpConfigStructure = z.infer<typeof HttpConfigStructureSchema>;
export type StdioConfigStructure = z.infer<typeof StdioConfigStructureSchema>;
export type ConfigStructure = z.infer<typeof ConfigStructureSchema>;
export type PlatformPaths = z.infer<typeof PlatformPathsSchema>;
export type MCPClientConfig = z.infer<typeof MCPClientConfigSchema>;
export type MCPConnectionOptions = z.infer<typeof MCPConnectionOptionsSchema>;
export type BuildOptions = z.infer<typeof BuildOptionsSchema>;
export type HttpServerConfig = z.infer<typeof HttpServerConfigSchema>;
export type HttpServerConfigAlt = z.infer<typeof HttpServerConfigAltSchema>;
export type StdioServerConfig = z.infer<typeof StdioServerConfigSchema>;
export type StdioServerConfigAlt = z.infer<typeof StdioServerConfigAltSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type McpServersConfig = z.infer<typeof McpServersConfigSchema>;
export type VsCodeConfig = z.infer<typeof VsCodeConfigSchema>;
export type GooseServerConfig = z.infer<typeof GooseServerConfigSchema>;
export type GooseConfig = z.infer<typeof GooseConfigSchema>;
export type GeminiHttpServerConfig = z.infer<typeof GeminiHttpServerConfigSchema>;
export type GeminiStdioServerConfig = z.infer<typeof GeminiStdioServerConfigSchema>;
export type GeminiServerConfig = z.infer<typeof GeminiServerConfigSchema>;
export type GeminiConfig = z.infer<typeof GeminiConfigSchema>;
export interface ValidationResult {
  success: boolean;
  data?: unknown;
  error?: z.ZodError;
}

export {
  ClientIdSchema,
  PlatformSchema,
  SupportedTransportsSchema,
  ServerTypeSchema,
  TransportSchema,
  MCPClientConfigSchema,
  PlatformPathsSchema,
  ConfigStructureSchema,
  HttpConfigStructureSchema,
  StdioConfigStructureSchema,
  MCPConnectionOptionsSchema,
  BuildOptionsSchema,
  HttpServerConfigSchema,
  HttpServerConfigAltSchema,
  StdioServerConfigSchema,
  StdioServerConfigAltSchema,
  ServerConfigSchema,
  McpServersConfigSchema,
  VsCodeConfigSchema,
  GooseServerConfigSchema,
  GooseConfigSchema,
  GeminiHttpServerConfigSchema,
  GeminiStdioServerConfigSchema,
  GeminiServerConfigSchema,
  GeminiConfigSchema,
} from './schemas.js';

export {
  validateClientConfig,
  validateConnectionOptions,
  safeValidateClientConfig,
  safeValidateConnectionOptions,
  validateGeneratedConfig,
  validateMcpServersConfig,
  validateVsCodeConfig,
  validateGooseConfig,
  validateGeminiConfig,
  safeValidateMcpServersConfig,
  safeValidateVsCodeConfig,
  safeValidateGooseConfig,
  safeValidateGeminiConfig,
} from './schemas.js';
