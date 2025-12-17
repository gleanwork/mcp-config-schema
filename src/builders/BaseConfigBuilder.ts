import {
  MCPClientConfig,
  MCPConnectionOptions,
  Platform,
  validateConnectionOptions,
} from '../types.js';
import type { MCPConfig } from '../types.js';
import * as yaml from 'js-yaml';
import * as TOML from 'smol-toml';

const DEFAULT_PLACEHOLDER_INSTANCE = '[instance]';

function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions !== 'undefined' &&
    typeof process.versions.node !== 'undefined'
  );
}

export abstract class BaseConfigBuilder {
  protected platform: Platform;
  protected mcpConfig?: MCPConfig;

  constructor(protected config: MCPClientConfig) {
    this.platform = this.detectPlatform();
  }

  /**
   * Set the MCP configuration.
   * This is called by the registry when creating a builder.
   */
  setMcpConfig(config: MCPConfig): void {
    this.mcpConfig = config;
  }

  /**
   * Get the current MCP configuration.
   */
  getMcpConfig(): MCPConfig | undefined {
    return this.mcpConfig;
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
      configObj = this.buildStdioConfig(validatedOptions, includeRootObject);
    } else if (validatedOptions.transport === 'http') {
      configObj = this.buildHttpConfig(validatedOptions, includeRootObject);
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
   * Helper to get the CLI package name with optional version.
   * Uses the cliPackage from MCP config if available.
   */
  protected getCliPackage(options: MCPConnectionOptions): string {
    const basePackage = this.mcpConfig?.cliPackage;
    if (!basePackage) {
      throw new Error(
        'No CLI package configured. ' + 'Provide cliPackage in your MCP configuration.'
      );
    }
    return options.cliPackageVersion ? `${basePackage}@${options.cliPackageVersion}` : basePackage;
  }

  /**
   * Helper to get the server URL with fallback to URL pattern or placeholder.
   */
  protected getServerUrl(options: MCPConnectionOptions): string {
    if (options.serverUrl) {
      return options.serverUrl;
    }
    if (this.mcpConfig?.urlPattern) {
      return this.mcpConfig.urlPattern;
    }
    throw new Error(
      'No server URL provided and no URL pattern configured. ' +
        'Either provide serverUrl or set urlPattern in your MCP configuration.'
    );
  }

  /**
   * Helper to get the instance with fallback to placeholder
   */
  protected getInstanceOrPlaceholder(options: MCPConnectionOptions): string {
    return options.instance || DEFAULT_PLACEHOLDER_INSTANCE;
  }

  /**
   * Helper to determine if a string is a URL
   */
  protected isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
  }

  /**
   * Get the server package name from MCP config.
   */
  protected getServerPackage(): string {
    const pkg = this.mcpConfig?.serverPackage;
    if (!pkg) {
      throw new Error(
        'No server package configured. ' + 'Provide serverPackage in your MCP configuration.'
      );
    }
    return pkg;
  }

  /**
   * Build environment variables using the MCP config's env var configuration.
   * Maps instance, URL, and token to the appropriate env var names.
   */
  protected buildEnvVars(options: MCPConnectionOptions): Record<string, string> {
    const env: Record<string, string> = {};
    const vars = this.mcpConfig?.envVars;

    if (!vars) {
      // No env var config - return empty
      return env;
    }

    if (options.instance) {
      if (this.isUrl(options.instance) && vars.url) {
        env[vars.url] = options.instance;
      } else if (vars.instance) {
        env[vars.instance] = options.instance;
      }
    } else if (vars.instance) {
      // Use placeholder when no instance is provided for backward compatibility
      env[vars.instance] = DEFAULT_PLACEHOLDER_INSTANCE;
    }

    if (options.apiToken && vars.token) {
      env[vars.token] = options.apiToken;
    }

    return env;
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
