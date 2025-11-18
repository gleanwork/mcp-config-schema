import { MCPClientConfig, MCPServerConfig, Platform, validateServerConfig } from '../types.js';
import * as yaml from 'js-yaml';
import * as TOML from 'smol-toml';

const DEFAULT_PLACEHOLDER_URL = 'https://[instance]-be.glean.com/mcp/[endpoint]';
const DEFAULT_PLACEHOLDER_INSTANCE = '[instance]';
const CONFIGURE_MCP_SERVER_PACKAGE = '@gleanwork/configure-mcp-server';
const LOCAL_MCP_SERVER_PACKAGE = '@gleanwork/local-mcp-server';

function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions !== 'undefined' &&
    typeof process.versions.node !== 'undefined'
  );
}

export abstract class BaseConfigBuilder {
  protected platform: Platform;

  constructor(protected config: MCPClientConfig) {
    this.platform = this.detectPlatform();
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

  buildConfiguration(serverData: MCPServerConfig): Record<string, unknown> {
    if (!this.config.userConfigurable) {
      throw new Error(
        `${this.config.displayName} does not support local configuration. ` +
          `${this.config.localConfigNotes || 'Configuration must be done through other means.'}`
      );
    }

    const validatedConfig = validateServerConfig(serverData);
    const includeRootObject = validatedConfig.includeRootObject !== false;

    let configObj: Record<string, unknown> = {};

    if (validatedConfig.transport === 'stdio') {
      configObj = this.buildLocalConfig(validatedConfig, includeRootObject);
    } else if (validatedConfig.transport === 'http') {
      configObj = this.buildRemoteConfig(validatedConfig, includeRootObject);
    } else {
      throw new Error(`Invalid transport: ${validatedConfig.transport}`);
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
    serverData: MCPServerConfig,
    includeRootObject: boolean
  ): Record<string, unknown>;

  protected abstract buildRemoteConfig(
    serverData: MCPServerConfig,
    includeRootObject: boolean
  ): Record<string, unknown>;

  buildOneClickUrl?(serverData: MCPServerConfig): string;

  buildCommand(serverData: MCPServerConfig): string | null {
    try {
      const validatedConfig = validateServerConfig(serverData);

      if (validatedConfig.transport === 'http') {
        return this.buildRemoteCommand(validatedConfig);
      } else {
        return this.buildLocalCommand(validatedConfig);
      }
    } catch (error) {
      return null;
    }
  }

  protected abstract buildRemoteCommand(serverData: MCPServerConfig): string | null;
  protected abstract buildLocalCommand(serverData: MCPServerConfig): string | null;

  /**
   * Helper to get the configure-mcp-server package name with optional version
   */
  protected getConfigureMcpServerPackage(serverData: MCPServerConfig): string {
    return serverData.configureMcpServerVersion
      ? `${CONFIGURE_MCP_SERVER_PACKAGE}@${serverData.configureMcpServerVersion}`
      : CONFIGURE_MCP_SERVER_PACKAGE;
  }

  /**
   * Helper to get the server URL with fallback to placeholder
   */
  protected getServerUrl(serverData: MCPServerConfig): string {
    return serverData.serverUrl || DEFAULT_PLACEHOLDER_URL;
  }

  /**
   * Helper to get the instance with fallback to placeholder
   */
  protected getInstanceOrPlaceholder(serverData: MCPServerConfig): string {
    return serverData.instance || DEFAULT_PLACEHOLDER_INSTANCE;
  }

  /**
   * Helper to determine if a string is a URL
   */
  protected isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
  }

  /**
   * Get the local MCP server package name
   */
  protected getLocalMcpServerPackage(): string {
    return LOCAL_MCP_SERVER_PACKAGE;
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
