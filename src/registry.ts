import { MCPClientConfig, Platform, safeValidateClientConfig } from './types.js';
import type { MCPConfig } from './types.js';

import { BaseConfigBuilder } from './builders/BaseConfigBuilder.js';
import { GenericConfigBuilder } from './builders/GenericConfigBuilder.js';
import { GooseConfigBuilder } from './builders/GooseConfigBuilder.js';
import { VSCodeConfigBuilder } from './builders/VSCodeConfigBuilder.js';
import { CursorConfigBuilder } from './builders/CursorConfigBuilder.js';
import { ClaudeCodeConfigBuilder } from './builders/ClaudeCodeConfigBuilder.js';
import { CodexConfigBuilder } from './builders/CodexConfigBuilder.js';
import chatgptConfig from '../configs/chatgpt.json';
import claudeCodeConfig from '../configs/claude-code.json';
import claudeDesktopConfig from '../configs/claude-desktop.json';
import claudeTeamsEnterpriseConfig from '../configs/claude-teams-enterprise.json';
import codexConfig from '../configs/codex.json';
import cursorConfig from '../configs/cursor.json';
import gooseConfig from '../configs/goose.json';
import vscodeConfig from '../configs/vscode.json';
import windsurfConfig from '../configs/windsurf.json';
import junieConfig from '../configs/junie.json';
import jetbrainsConfig from '../configs/jetbrains.json';
import geminiConfig from '../configs/gemini.json';

const allConfigs = [
  chatgptConfig,
  claudeCodeConfig,
  claudeDesktopConfig,
  claudeTeamsEnterpriseConfig,
  codexConfig,
  cursorConfig,
  gooseConfig,
  vscodeConfig,
  windsurfConfig,
  junieConfig,
  jetbrainsConfig,
  geminiConfig,
];

/**
 * Builder class constructor type.
 * Used for registering custom builders.
 */
export type BuilderConstructor = new (config: MCPClientConfig) => BaseConfigBuilder;

/**
 * Options for creating an MCPConfigRegistry.
 */
export interface RegistryOptions {
  /** Whether to load built-in client configs (default: true) */
  loadBuiltInConfigs?: boolean;
  /** MCP configuration for server settings */
  mcpConfig?: MCPConfig;
}

export class MCPConfigRegistry {
  private configs: Map<string, MCPClientConfig> = new Map();
  private builderFactories: Map<string, BuilderConstructor> = new Map();
  private mcpConfig?: MCPConfig;

  constructor(options: RegistryOptions = {}) {
    if (options.loadBuiltInConfigs !== false) {
      this.loadConfigs();
    }
    this.registerBuilders();
    this.mcpConfig = options.mcpConfig;
  }

  private registerBuilders(): void {
    // Register specific builders for clients that need special handling
    this.builderFactories.set('goose', GooseConfigBuilder);
    this.builderFactories.set('vscode', VSCodeConfigBuilder);
    this.builderFactories.set('cursor', CursorConfigBuilder);
    this.builderFactories.set('claude-code', ClaudeCodeConfigBuilder);
    this.builderFactories.set('codex', CodexConfigBuilder);
    // Other clients will use GenericConfigBuilder by default
  }

  // ============ CLIENT REGISTRATION ============

  /**
   * Register a new client configuration at runtime.
   * @param config - The client configuration to register
   */
  registerClient(config: MCPClientConfig): void {
    this.validateBusinessRules(config);
    this.configs.set(config.id, config);
  }

  /**
   * Check if a client exists in the registry.
   */
  hasClient(clientId: string): boolean {
    return this.configs.has(clientId);
  }

  /**
   * Register a custom builder for a specific client.
   * @param clientId - The client ID
   * @param builderClass - The builder class constructor
   */
  registerBuilder(clientId: string, builderClass: BuilderConstructor): void {
    this.builderFactories.set(clientId, builderClass);
  }

  /**
   * Get the current MCP configuration.
   */
  getMcpConfig(): MCPConfig | undefined {
    return this.mcpConfig;
  }

  private loadConfigs(): void {
    for (const data of allConfigs) {
      try {
        const result = safeValidateClientConfig(data);

        if (!result.success) {
          const errorMessage = result.error.issues
            .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
            .join('\n');
          throw new Error(`Validation failed:\n${errorMessage}`);
        }

        const config = result.data;
        this.validateBusinessRules(config);

        this.configs.set(config.id, config);
      } catch (error) {
        const configId = (data as Record<string, unknown>).id || 'unknown';
        if (error instanceof Error) {
          console.error(`Failed to load config ${configId}:\n${error.message}`);
        } else {
          console.error(`Failed to load config ${configId}:`, error);
        }
      }
    }
  }

  private validateBusinessRules(config: MCPClientConfig): void {
    if (!config.userConfigurable) {
      return;
    }
    if (
      !config.configStructure.httpPropertyMapping &&
      !config.configStructure.stdioPropertyMapping
    ) {
      throw new Error(`Client must support at least one configuration type (http or stdio)`);
    }

    // Business rule: HTTP support requires httpPropertyMapping
    if (config.transports.includes('http') && !config.configStructure.httpPropertyMapping) {
      throw new Error(`Client with HTTP support must have httpPropertyMapping defined`);
    }
  }

  getConfig(clientId: string): MCPClientConfig | undefined {
    return this.configs.get(clientId);
  }

  getAllConfigs(): MCPClientConfig[] {
    return Array.from(this.configs.values());
  }

  getNativeHttpClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.transports.includes('http'));
  }

  getBridgeRequiredClients(): MCPClientConfig[] {
    // Clients that don't support HTTP natively need mcp-remote bridge
    return this.getAllConfigs().filter((config) => !config.transports.includes('http'));
  }

  getStdioOnlyClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter(
      (config) => config.transports.length === 1 && config.transports[0] === 'stdio'
    );
  }

  getClientsWithOneClick(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.protocolHandler !== undefined);
  }

  getSupportedClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.userConfigurable);
  }

  getClientsByPlatform(platform: Platform): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.supportedPlatforms.includes(platform));
  }

  getUnsupportedClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => !config.userConfigurable);
  }

  /**
   * Determines if a client needs mcp-remote to connect to HTTP servers.
   * @param clientId - The client to check
   * @returns true if the client needs mcp-remote for HTTP connections
   */
  clientNeedsMcpRemote(clientId: string): boolean {
    const config = this.getConfig(clientId);
    if (!config) {
      throw new Error(`Unknown client: ${clientId}`);
    }
    return !config.transports.includes('http');
  }

  /**
   * Determines if a client can connect to HTTP servers natively.
   * @param clientId - The client to check
   * @returns true if the client supports HTTP natively
   */
  clientSupportsHttpNatively(clientId: string): boolean {
    const config = this.getConfig(clientId);
    if (!config) {
      throw new Error(`Unknown client: ${clientId}`);
    }
    return config.transports.includes('http');
  }

  /**
   * Determines if a client can connect to stdio servers.
   * @param clientId - The client to check
   * @returns true if the client supports stdio
   */
  clientSupportsStdio(clientId: string): boolean {
    const config = this.getConfig(clientId);
    if (!config) {
      throw new Error(`Unknown client: ${clientId}`);
    }
    return config.transports.includes('stdio');
  }

  /**
   * Create a configuration builder for a specific client.
   */
  createBuilder(clientId: string): BaseConfigBuilder {
    const config = this.getConfig(clientId);
    if (!config) {
      throw new Error(`Unknown client: ${clientId}`);
    }
    if (!config.userConfigurable) {
      throw new Error(
        `Cannot create builder for ${config.displayName}: ${config.localConfigNotes || 'No local configuration support.'}`
      );
    }

    // Create the builder
    const BuilderClass = this.builderFactories.get(clientId);
    const builder = BuilderClass ? new BuilderClass(config) : new GenericConfigBuilder(config);

    // Inject MCP config if available
    if (this.mcpConfig) {
      builder.setMcpConfig(this.mcpConfig);
    }

    return builder;
  }
}
