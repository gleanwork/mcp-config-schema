import {
  MCPClientConfig,
  MCPConnectionOptions,
  Platform,
  RegistryOptions,
  validateConnectionOptions,
} from '../types.js';
import * as yaml from 'js-yaml';
import * as TOML from 'smol-toml';

function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions !== 'undefined' &&
    typeof process.versions.node !== 'undefined'
  );
}

export abstract class BaseConfigBuilder {
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
   * Get the CLI package, or throw if not configured.
   * Required for CLI command generation.
   */
  protected get cliPackage(): string {
    if (!this.registryOptions.cliPackage) {
      throw new Error(
        'No CLI package configured. Provide cliPackage in registry options for CLI commands.'
      );
    }
    return this.registryOptions.cliPackage;
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

  buildConfiguration(options: MCPConnectionOptions): Record<string, unknown> {
    if (!this.config.userConfigurable) {
      throw new Error(
        `${this.config.displayName} does not support local configuration. ` +
          `${this.config.localConfigNotes || 'Configuration must be done through other means.'}`
      );
    }

    const validatedOptions = validateConnectionOptions(options);
    const includeRootObject = validatedOptions.includeRootObject !== false;

    let configObj: Record<string, unknown> = {};

    if (validatedOptions.transport === 'stdio') {
      configObj = this.buildLocalConfig(validatedOptions, includeRootObject);
    } else if (validatedOptions.transport === 'http') {
      configObj = this.buildRemoteConfig(validatedOptions, includeRootObject);
    } else {
      throw new Error(`Invalid transport: ${validatedOptions.transport}`);
    }

    return configObj;
  }

  toString(config: Record<string, unknown>): string {
    if (this.config.configFormat === 'json') {
      return JSON.stringify(config, null, 2);
    } else if (this.config.configFormat === 'yaml') {
      return yaml.dump(config);
    } else if (this.config.configFormat === 'toml') {
      return TOML.stringify(config);
    }

    throw new Error(`Unsupported config format: ${this.config.configFormat}`);
  }

  protected abstract buildLocalConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean
  ): Record<string, unknown>;

  protected abstract buildRemoteConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean
  ): Record<string, unknown>;

  buildOneClickUrl?(options: MCPConnectionOptions): string;

  buildCommand(options: MCPConnectionOptions): string | null {
    try {
      const validatedOptions = validateConnectionOptions(options);

      if (validatedOptions.transport === 'http') {
        return this.buildRemoteCommand(validatedOptions);
      } else {
        return this.buildLocalCommand(validatedOptions);
      }
    } catch (error) {
      return null;
    }
  }

  protected abstract buildRemoteCommand(options: MCPConnectionOptions): string | null;
  protected abstract buildLocalCommand(options: MCPConnectionOptions): string | null;

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

  abstract getNormalizedServersConfig(config: Record<string, unknown>): Record<string, unknown>;

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
