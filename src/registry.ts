import {
  MCPClientConfig,
  ClientId,
  Platform,
  RegistryOptions,
  ConfigForClient,
  safeValidateClientConfig,
} from './types.js';

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

export class MCPConfigRegistry {
  private configs: Map<ClientId, MCPClientConfig> = new Map();
  private builderFactories: Map<ClientId, new (config: MCPClientConfig) => BaseConfigBuilder> =
    new Map();
  private options: RegistryOptions;

  /**
   * Create a new MCP configuration registry.
   * @param options - Optional configuration for server packages, env vars, etc.
   */
  constructor(options: RegistryOptions = {}) {
    this.options = options;
    this.loadConfigs();
    this.registerBuilders();
  }

  private registerBuilders(): void {
    // Register specific builders for clients that need special handling
    this.builderFactories.set(
      'goose' as ClientId,
      GooseConfigBuilder as new (config: MCPClientConfig) => BaseConfigBuilder
    );
    this.builderFactories.set(
      'vscode' as ClientId,
      VSCodeConfigBuilder as new (config: MCPClientConfig) => BaseConfigBuilder
    );
    this.builderFactories.set(
      'cursor' as ClientId,
      CursorConfigBuilder as new (config: MCPClientConfig) => BaseConfigBuilder
    );
    this.builderFactories.set(
      'claude-code' as ClientId,
      ClaudeCodeConfigBuilder as new (config: MCPClientConfig) => BaseConfigBuilder
    );
    this.builderFactories.set(
      'codex' as ClientId,
      CodexConfigBuilder as new (config: MCPClientConfig) => BaseConfigBuilder
    );
    // Other clients will use GenericConfigBuilder by default
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

  getConfig(clientId: ClientId): MCPClientConfig | undefined {
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
  clientNeedsMcpRemote(clientId: ClientId): boolean {
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
  clientSupportsHttpNatively(clientId: ClientId): boolean {
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
  clientSupportsStdio(clientId: ClientId): boolean {
    const config = this.getConfig(clientId);
    if (!config) {
      throw new Error(`Unknown client: ${clientId}`);
    }
    return config.transports.includes('stdio');
  }

  /**
   * Create a configuration builder for a specific client.
   *
   * The returned builder is typed based on the client ID:
   * - 'vscode' returns a builder producing VSCodeMCPConfig
   * - 'goose' returns a builder producing GooseMCPConfig
   * - 'codex' returns a builder producing CodexMCPConfig
   * - All others return a builder producing StandardMCPConfig
   *
   * @typeParam C - The client ID type (inferred from clientId parameter)
   * @param clientId - The client ID to create a builder for
   * @returns A typed builder instance
   *
   * @example
   * ```typescript
   * const vsCodeBuilder = registry.createBuilder('vscode');
   * const config = vsCodeBuilder.buildConfiguration(options);
   * config.servers; // ✓ Typed as MCPServersRecord
   * ```
   */
  createBuilder<C extends ClientId>(clientId: C): BaseConfigBuilder<ConfigForClient<C>> {
    const config = this.getConfig(clientId);
    if (!config) {
      throw new Error(`Unknown client: ${clientId}`);
    }
    if (!config.userConfigurable) {
      throw new Error(
        `Cannot create builder for ${config.displayName}: ${config.localConfigNotes || 'No local configuration support.'}`
      );
    }

    // Check if we have a specific builder for this client
    const BuilderClass = this.builderFactories.get(clientId);
    const builder = BuilderClass ? new BuilderClass(config) : new GenericConfigBuilder(config);

    // Inject registry options into the builder
    builder.setRegistryOptions(this.options);

    // Internal cast: runtime builder selection is correct, we're just informing TypeScript
    return builder as BaseConfigBuilder<ConfigForClient<C>>;
  }
}
