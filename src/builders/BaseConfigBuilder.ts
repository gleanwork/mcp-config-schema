import {
  MCPClientConfig,
  MCPConnectionOptions,
  MCPConfig,
  MCPServersRecord,
  Platform,
  RegistryOptions,
  CommandBuilder,
  ServerNameBuilderCallback,
  validateConnectionOptions,
  CliInstallationStatus,
  CLI_INSTALL_REASON,
} from '../types.js';
import { buildMcpServerName } from '../server-name.js';
import * as yaml from 'js-yaml';
import * as TOML from 'smol-toml';

function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions !== 'undefined' &&
    typeof process.versions.node !== 'undefined'
  );
}

/**
 * Abstract base class for building MCP client configurations.
 *
 * @typeParam TConfig - The config output type (e.g., StandardMCPConfig, VSCodeMCPConfig).
 *                      Defaults to MCPConfig union for backwards compatibility.
 */
export abstract class BaseConfigBuilder<TConfig extends MCPConfig = MCPConfig> {
  protected platform: Platform;
  protected registryOptions: RegistryOptions = {};

  constructor(protected config: MCPClientConfig) {
    this.platform = this.detectPlatform();
  }

  /**
   * Set the registry options for this builder.
   * Called by MCPConfigRegistry when creating a builder.
   */
  setRegistryOptions(options: RegistryOptions): void {
    this.registryOptions = options;
  }

  /**
   * Get the server package, or throw if not configured.
   * Required for stdio transport configurations.
   */
  protected get serverPackage(): string {
    if (!this.registryOptions.serverPackage) {
      throw new Error(
        'No server package configured. Provide serverPackage in registry options for stdio transport.'
      );
    }
    return this.registryOptions.serverPackage;
  }

  /**
   * Get the command builder callbacks, if configured.
   * Used for CLI command generation for clients without native CLI support.
   */
  protected get commandBuilder(): CommandBuilder | undefined {
    return this.registryOptions.commandBuilder;
  }

  /**
   * Get the server name builder callback, if configured.
   * Used to customize server name generation (e.g., adding vendor prefixes).
   */
  protected get serverNameBuilder(): ServerNameBuilderCallback | undefined {
    return this.registryOptions.serverNameBuilder;
  }

  /**
   * Whether this builder has native CLI support.
   * Override in subclasses that implement native CLI commands (e.g., VSCode, ClaudeCode, Codex).
   */
  protected get hasNativeCliSupport(): boolean {
    return false;
  }

  /**
   * Check whether this client supports CLI-based installation.
   *
   * Use this method to determine if the CLI tab should be shown in the UI,
   * and to understand why CLI installation may not be available.
   *
   * @returns Status object indicating whether CLI installation is supported and why.
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
  supportsCliInstallation(): CliInstallationStatus {
    // No config path = client is configured via IDE UI (e.g., JetBrains)
    if (!this.config.configPath[this.platform]) {
      return {
        supported: false,
        reason: CLI_INSTALL_REASON.NO_CONFIG_PATH,
        message: `${this.config.displayName} is configured through IDE settings, not via CLI.`,
      };
    }

    // Has native CLI = supported
    if (this.hasNativeCliSupport) {
      return {
        supported: true,
        reason: CLI_INSTALL_REASON.NATIVE_CLI,
      };
    }

    // Has commandBuilder callback = supported via custom command
    if (this.commandBuilder?.http || this.commandBuilder?.stdio) {
      return {
        supported: true,
        reason: CLI_INSTALL_REASON.COMMAND_BUILDER,
      };
    }

    // No native CLI and no commandBuilder = not supported
    return {
      supported: false,
      reason: CLI_INSTALL_REASON.NO_CLI_AVAILABLE,
      message: `No CLI command available for ${this.config.displayName}.`,
    };
  }

  /**
   * Build a server name using the configured serverNameBuilder or default logic.
   */
  protected buildServerName(options: {
    transport?: 'stdio' | 'http';
    serverUrl?: string;
    serverName?: string;
  }): string {
    if (this.serverNameBuilder) {
      return this.serverNameBuilder(options);
    }
    return buildMcpServerName(options);
  }

  /**
   * Substitute variables in a URL template.
   * URL templates use {variableName} syntax (aligned with MCP registry spec).
   * Example: "https://api.example.com/{region}/mcp" with { region: "us-east-1" }
   *          becomes "https://api.example.com/us-east-1/mcp"
   */
  protected substituteUrlVariables(
    urlTemplate: string,
    variables?: Record<string, string>
  ): string {
    if (!variables || Object.keys(variables).length === 0) {
      return urlTemplate;
    }

    let result = urlTemplate;
    for (const [name, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), value);
    }
    return result;
  }

  /**
   * Build HTTP headers from options.
   */
  protected buildHeaders(options: MCPConnectionOptions): Record<string, string> | undefined {
    if (options.headers && Object.keys(options.headers).length > 0) {
      return { ...options.headers };
    }
    return undefined;
  }

  /**
   * Get environment variables for stdio transport.
   * Uses the new generic `env` option directly.
   */
  protected getEnvVars(options: MCPConnectionOptions): Record<string, string> | undefined {
    return options.env && Object.keys(options.env).length > 0 ? options.env : undefined;
  }

  protected detectPlatform(): Platform {
    if (isNodeEnvironment()) {
      try {
        return process.platform as Platform;
      } catch {
        // Ignore error and fall through to browser detection
      }
    }
    if (typeof globalThis !== 'undefined' && 'navigator' in globalThis) {
      const nav = (globalThis as Record<string, unknown>).navigator as { userAgent?: string };
      if (nav && nav.userAgent) {
        const ua = nav.userAgent.toLowerCase();

        if (ua.includes('mac')) {
          return 'darwin';
        }
        if (ua.includes('win')) {
          return 'win32';
        }

        return 'linux';
      }
    }
    return 'darwin';
  }

  /**
   * Build a configuration object for this client.
   *
   * @param options - Connection options specifying transport type, URLs, credentials, etc.
   * @returns When includeRootObject is false, returns MCPServersRecord (flat servers).
   *          Otherwise returns TConfig (full wrapped config).
   */
  buildConfiguration(
    options: MCPConnectionOptions & { includeRootObject: false }
  ): MCPServersRecord;
  buildConfiguration(options: MCPConnectionOptions & { includeRootObject?: true }): TConfig;
  buildConfiguration(options: MCPConnectionOptions): TConfig | MCPServersRecord;
  buildConfiguration(options: MCPConnectionOptions): TConfig | MCPServersRecord {
    if (!this.config.userConfigurable) {
      throw new Error(
        `${this.config.displayName} does not support local configuration. ` +
          `${this.config.localConfigNotes || 'Configuration must be done through other means.'}`
      );
    }

    const validatedOptions = validateConnectionOptions(options);
    const includeRootObject = validatedOptions.includeRootObject !== false;

    let result: Record<string, unknown> = {};

    if (validatedOptions.transport === 'stdio') {
      result = this.buildStdioConfig(validatedOptions, includeRootObject);
    } else if (validatedOptions.transport === 'http') {
      result = this.buildHttpConfig(validatedOptions, includeRootObject);
    } else {
      throw new Error(`Invalid transport: ${validatedOptions.transport}`);
    }

    // Type assertion is safe: subclasses ensure correct shape based on includeRootObject
    return result as TConfig | MCPServersRecord;
  }

  /**
   * Convert a configuration object to a string (JSON, YAML, or TOML).
   * @param config - The configuration object to serialize (full or partial).
   * @returns The serialized configuration string.
   */
  toString(config: TConfig | MCPServersRecord): string {
    if (this.config.configFormat === 'json') {
      return JSON.stringify(config, null, 2);
    } else if (this.config.configFormat === 'yaml') {
      return yaml.dump(config);
    } else if (this.config.configFormat === 'toml') {
      // Cast through unknown for TOML serialization since interfaces lack index signatures
      return TOML.stringify(config as unknown as Record<string, unknown>);
    }

    throw new Error(`Unsupported config format: ${this.config.configFormat}`);
  }

  protected abstract buildStdioConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean
  ): Record<string, unknown>;

  protected abstract buildHttpConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean
  ): Record<string, unknown>;

  buildOneClickUrl?(options: MCPConnectionOptions): string;

  buildCommand(options: MCPConnectionOptions): string | null {
    try {
      // Check if CLI installation is supported for this client.
      // Returns null if:
      // - Client has no configPath for this platform (e.g., JetBrains - configured via IDE UI)
      // - Client has no native CLI and no commandBuilder callback was provided
      const status = this.supportsCliInstallation();
      if (!status.supported) {
        return null;
      }

      const validatedOptions = validateConnectionOptions(options);

      if (validatedOptions.transport === 'http') {
        return this.buildHttpCommand(validatedOptions);
      } else {
        return this.buildStdioCommand(validatedOptions);
      }
    } catch (error) {
      return null;
    }
  }

  protected abstract buildHttpCommand(options: MCPConnectionOptions): string | null;
  protected abstract buildStdioCommand(options: MCPConnectionOptions): string | null;

  /**
   * Helper to determine if a string is a URL
   */
  protected isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
  }

  /**
   * Encodes a string to base64 in a way that works in both Node.js and browsers.
   * Handles Unicode characters properly.
   */
  protected toBase64(str: string): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str).toString('base64');
    } else if (typeof btoa !== 'undefined') {
      const bytes = new TextEncoder().encode(str);
      const binary = String.fromCharCode(...bytes);

      return btoa(binary);
    } else {
      throw new Error('No base64 encoding method available');
    }
  }

  /**
   * Extract and normalize the servers configuration from a config object.
   * Subclasses implement this to handle their specific config shapes.
   *
   * @param config - Either a full config (TConfig) or a flat servers record (MCPServersRecord).
   *                 Full configs come from buildConfiguration() with includeRootObject: true (default).
   *                 Flat configs come from buildConfiguration() with includeRootObject: false.
   * @returns A normalized record of server configurations.
   * @deprecated This method is deprecated and will be removed in the next major version.
   *             Consumers should use buildConfiguration() directly and handle the output format
   *             based on the includeRootObject option.
   */
  abstract getNormalizedServersConfig(config: TConfig | MCPServersRecord): MCPServersRecord;

  getConfigPath(): string {
    if (typeof process === 'undefined' || !process.platform) {
      throw new Error('getConfigPath() is only available in Node.js environment');
    }

    if (!this.config.userConfigurable) {
      throw new Error(
        `${this.config.displayName} does not support local configuration. ` +
          `${this.config.localConfigNotes || 'Configuration must be done through other means.'}`
      );
    }

    const platformPath = this.config.configPath[this.platform];
    if (!platformPath) {
      throw new Error(`Platform ${this.platform} not supported for ${this.config.displayName}`);
    }

    return this.expandPath(platformPath);
  }

  private expandPath(filepath: string): string {
    const homedir = process.env.HOME || process.env.USERPROFILE || '';

    return filepath
      .replace('$HOME', homedir)
      .replace('%USERPROFILE%', homedir)
      .replace('%APPDATA%', process.env.APPDATA || '')
      .replace(/\\/g, '/');
  }
}
