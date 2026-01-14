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
 * Callback type for building CLI commands for clients without native CLI support.
 * @param clientId - The client identifier (e.g., 'cursor', 'goose')
 * @param options - The connection options passed to buildCommand()
 * @returns The CLI command string, or null if not supported
 */
export type CommandBuilderCallback = (
  clientId: string,
  options: MCPConnectionOptions
) => string | null;

/**
 * Custom command builders for clients without native CLI support.
 * Native CLI clients (VS Code, Claude Code, Codex) use their built-in commands.
 * For other clients, provide custom callbacks to generate installation commands.
 */
export interface CommandBuilder {
  /** Build HTTP transport command. Return null if not supported. */
  http?: CommandBuilderCallback;
  /** Build stdio transport command. Return null if not supported. */
  stdio?: CommandBuilderCallback;
}

/**
 * Callback type for building server names.
 * Allows customizing how server names are generated (e.g., adding vendor prefixes).
 *
 * @param options - The connection options
 * @returns The server name to use in configuration
 */
export type ServerNameBuilderCallback = (options: {
  transport?: 'stdio' | 'http';
  serverUrl?: string;
  serverName?: string;
}) => string;

/**
 * Options for creating an MCPConfigRegistry.
 * These options configure how configurations and commands are generated.
 */
export interface RegistryOptions {
  /** NPM package for stdio server (e.g., '@my-org/mcp-server') */
  serverPackage?: string;
  /**
   * Custom command builders for clients without native CLI support.
   * Native CLI clients (VS Code, Claude Code, Codex) use their built-in commands.
   * For other clients, provide custom callbacks to generate installation commands.
   *
   * @example
   * ```typescript
   * const registry = new MCPConfigRegistry({
   *   serverPackage: '@my-org/mcp-server',
   *   commandBuilder: {
   *     http: (clientId, options) => {
   *       return `npx my-cli install --client ${clientId} --url ${options.serverUrl}`;
   *     },
   *     stdio: (clientId, options) => {
   *       const envFlags = Object.entries(options.env || {})
   *         .map(([k, v]) => `--env ${k}=${v}`).join(' ');
   *       return `npx my-cli install --client ${clientId} ${envFlags}`;
   *     },
   *   },
   * });
   * ```
   */
  commandBuilder?: CommandBuilder;
  /**
   * Custom server name builder for generating configuration keys.
   * Use this to add vendor-specific prefixes or naming conventions.
   *
   * @example
   * ```typescript
   * const registry = new MCPConfigRegistry({
   *   serverNameBuilder: (options) => {
   *     const base = options.serverName || (options.transport === 'stdio' ? 'local' : 'default');
   *     return `myvendor_${base}`;
   *   },
   * });
   * ```
   */
  serverNameBuilder?: ServerNameBuilderCallback;
  /**
   * Default environment variable name for bearer token authentication.
   * Used by native CLI clients (e.g., Codex) when headers contain Authorization
   * but no matching env var is found in options.env.
   *
   * @example
   * ```typescript
   * const registry = new MCPConfigRegistry({
   *   tokenEnvVarName: 'MY_API_TOKEN',
   * });
   * // Codex CLI will use: codex mcp add --bearer-token-env-var MY_API_TOKEN ...
   * ```
   */
  tokenEnvVarName?: string;
}

/**
 * Record type for the servers collection within a config.
 * The value is `unknown` since different clients have different server config schemas.
 */
export type MCPServersRecord = Record<string, unknown>;

/**
 * Standard MCP config format used by most clients.
 * Clients: Claude Desktop, Cursor, Windsurf, Claude Code, JetBrains, Junie, Gemini, ChatGPT, Claude Teams Enterprise
 */
export interface StandardMCPConfig {
  mcpServers: MCPServersRecord;
}

/**
 * VS Code MCP config format.
 * Uses 'servers' instead of 'mcpServers'.
 */
export interface VSCodeMCPConfig {
  servers: MCPServersRecord;
}

/**
 * Goose MCP config format.
 * Uses 'extensions' instead of 'mcpServers'.
 */
export interface GooseMCPConfig {
  extensions: MCPServersRecord;
}

/**
 * Codex MCP config format.
 * Uses 'mcp_servers' (snake_case) instead of 'mcpServers'.
 */
export interface CodexMCPConfig {
  mcp_servers: MCPServersRecord;
}

/**
 * Union of all config output formats.
 */
export type MCPConfig = StandardMCPConfig | VSCodeMCPConfig | GooseMCPConfig | CodexMCPConfig;

/**
 * Maps a ClientId to its corresponding config output type.
 * Use this with generics to get properly typed config objects.
 *
 * @example
 * ```typescript
 * function getConfig<C extends ClientId>(clientId: C): ConfigForClient<C> { ... }
 * const vsCodeConfig = getConfig('vscode'); // Type: VSCodeMCPConfig
 * vsCodeConfig.servers; // ✓ Typed correctly
 * ```
 */
export type ConfigForClient<C extends ClientId> = C extends 'vscode'
  ? VSCodeMCPConfig
  : C extends 'goose'
    ? GooseMCPConfig
    : C extends 'codex'
      ? CodexMCPConfig
      : StandardMCPConfig;

/**
 * Maps a ClientId to its servers property name.
 * Useful for dynamic property access.
 */
export type ServersKeyForClient<C extends ClientId> = C extends 'vscode'
  ? 'servers'
  : C extends 'goose'
    ? 'extensions'
    : C extends 'codex'
      ? 'mcp_servers'
      : 'mcpServers';

export type Platform = z.infer<typeof PlatformSchema>;
export type ClientId = z.infer<typeof ClientIdSchema>;
export type SupportedTransports = z.infer<typeof SupportedTransportsSchema>;
export type ServerType = z.infer<typeof ServerTypeSchema>;
export type Transport = z.infer<typeof TransportSchema>;
export type HttpConfigStructure = z.infer<typeof HttpConfigStructureSchema>;
export type StdioConfigStructure = z.infer<typeof StdioConfigStructureSchema>;
export type ConfigStructure = z.infer<typeof ConfigStructureSchema>;
export type PlatformPaths = z.infer<typeof PlatformPathsSchema>;
export type MCPClientConfig = z.infer<typeof MCPClientConfigSchema>;
export type MCPConnectionOptions = z.infer<typeof MCPConnectionOptionsSchema>;
/** @deprecated Use MCPConnectionOptions instead */
export type MCPServerConfig = MCPConnectionOptions;
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

/**
 * Constants for CLI installation status reasons.
 * Use these to avoid string literals when checking status.reason.
 *
 * @example
 * ```typescript
 * const status = builder.supportsCliInstallation();
 * if (status.reason === CLI_INSTALL_REASON.NATIVE_CLI) {
 *   // Client has native CLI support
 * }
 * ```
 */
export const CLI_INSTALL_REASON = {
  /** Client has a native CLI command (e.g., `claude mcp add`, `code --add-mcp`) */
  NATIVE_CLI: 'native_cli',
  /** CLI command provided via commandBuilder callback */
  COMMAND_BUILDER: 'command_builder',
  /** Client has no configPath - configured via IDE UI (e.g., JetBrains) */
  NO_CONFIG_PATH: 'no_config_path',
  /** Client has no native CLI and no commandBuilder was provided */
  NO_CLI_AVAILABLE: 'no_cli_available',
} as const;

/**
 * Union type of all CLI installation reason values.
 */
export type CliInstallReason = (typeof CLI_INSTALL_REASON)[keyof typeof CLI_INSTALL_REASON];

/**
 * Status indicating CLI installation is supported.
 */
export interface CliInstallSupported {
  supported: true;
  reason: typeof CLI_INSTALL_REASON.NATIVE_CLI | typeof CLI_INSTALL_REASON.COMMAND_BUILDER;
}

/**
 * Status indicating CLI installation is not supported.
 */
export interface CliInstallUnsupported {
  supported: false;
  reason: typeof CLI_INSTALL_REASON.NO_CONFIG_PATH | typeof CLI_INSTALL_REASON.NO_CLI_AVAILABLE;
  /** Human-readable message explaining why CLI installation is not supported */
  message: string;
}

/**
 * Result of checking whether a client supports CLI-based installation.
 *
 * @example
 * ```typescript
 * const status = builder.supportsCliInstallation();
 * if (status.supported) {
 *   const command = builder.buildCommand(options);
 *   showCliTab(command);
 * } else {
 *   if (status.reason === CLI_INSTALL_REASON.NO_CONFIG_PATH) {
 *     showIdeConfigInstructions(status.message);
 *   }
 * }
 * ```
 */
export type CliInstallationStatus = CliInstallSupported | CliInstallUnsupported;

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
  MCPServerConfigSchema,
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
  validateServerConfig,
  safeValidateClientConfig,
  safeValidateConnectionOptions,
  safeValidateServerConfig,
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
