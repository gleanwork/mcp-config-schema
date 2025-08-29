import { MCPClientConfig, ClientId, Platform, safeValidateClientConfig } from './types.js';

import { BaseConfigBuilder } from './builders/BaseConfigBuilder.js';
import { GenericConfigBuilder } from './builders/GenericConfigBuilder.js';
import { GooseConfigBuilder } from './builders/GooseConfigBuilder.js';
import { VSCodeConfigBuilder } from './builders/VSCodeConfigBuilder.js';
import { CursorConfigBuilder } from './builders/CursorConfigBuilder.js';
import chatgptConfig from '../configs/chatgpt.json';
import claudeCodeConfig from '../configs/claude-code.json';
import claudeDesktopConfig from '../configs/claude-desktop.json';
import claudeTeamsEnterpriseConfig from '../configs/claude-teams-enterprise.json';
import cursorConfig from '../configs/cursor.json';
import gooseConfig from '../configs/goose.json';
import vscodeConfig from '../configs/vscode.json';
import windsurfConfig from '../configs/windsurf.json';
const allConfigs = [
  chatgptConfig,
  claudeCodeConfig,
  claudeDesktopConfig,
  claudeTeamsEnterpriseConfig,
  cursorConfig,
  gooseConfig,
  vscodeConfig,
  windsurfConfig,
];

export class MCPConfigRegistry {
  private configs: Map<ClientId, MCPClientConfig> = new Map();
  private builderFactories: Map<ClientId, new (config: MCPClientConfig) => BaseConfigBuilder> =
    new Map();

  constructor() {
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
    if (config.localConfigSupport === 'none') {
      return;
    }
    if (!config.configStructure.httpConfig && !config.configStructure.stdioConfig) {
      throw new Error(`Client must support at least one configuration type (http or stdio)`);
    }

    // Business rule: HTTP support requires httpConfig
    if (config.transports.includes('http') && !config.configStructure.httpConfig) {
      throw new Error(`Client with HTTP support must have httpConfig defined`);
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
    return this.getAllConfigs().filter((config) => config.oneClick !== undefined);
  }

  getSupportedClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.localConfigSupport === 'full');
  }

  getClientsByPlatform(platform: Platform): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.supportedPlatforms.includes(platform));
  }

  getUnsupportedClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.localConfigSupport === 'none');
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

  createBuilder(clientId: ClientId): BaseConfigBuilder {
    const config = this.getConfig(clientId);
    if (!config) {
      throw new Error(`Unknown client: ${clientId}`);
    }
    if (config.localConfigSupport === 'none') {
      throw new Error(
        `Cannot create builder for ${config.displayName}: ${config.localConfigNotes || 'No local configuration support.'}`
      );
    }

    // Check if we have a specific builder for this client
    const BuilderClass = this.builderFactories.get(clientId);
    if (BuilderClass) {
      return new BuilderClass(config);
    }

    // Fall back to GenericConfigBuilder for clients without custom builders
    return new GenericConfigBuilder(config);
  }
}
