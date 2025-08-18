import { MCPClientConfig, ClientId, Platform, safeValidateClientConfig } from './types.js';
import { ConfigBuilder } from './builder.js';
import chatgptConfig from '../configs/chatgpt.json';
import claudeCodeConfig from '../configs/claude-code.json';
import claudeDesktopConfig from '../configs/claude-desktop.json';
import claudeDesktopOrgConfig from '../configs/claude-desktop-org.json';
import cursorConfig from '../configs/cursor.json';
import gooseConfig from '../configs/goose.json';
import vscodeConfig from '../configs/vscode.json';
import windsurfConfig from '../configs/windsurf.json';
const allConfigs = [
  chatgptConfig,
  claudeCodeConfig,
  claudeDesktopConfig,
  claudeDesktopOrgConfig,
  cursorConfig,
  gooseConfig,
  vscodeConfig,
  windsurfConfig,
];

export class MCPConfigRegistry {
  private configs: Map<ClientId, MCPClientConfig> = new Map();

  constructor() {
    this.loadConfigs();
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
    if (config.clientSupports === 'stdio-only' && !config.requiresMcpRemoteForHttp) {
      throw new Error(`stdio-only clients must require mcp-remote for HTTP servers`);
    }
    if (config.clientSupports === 'http' && config.requiresMcpRemoteForHttp) {
      throw new Error(`HTTP-supporting clients shouldn't require mcp-remote`);
    }
    if (!config.configStructure.httpConfig && !config.configStructure.stdioConfig) {
      throw new Error(`Client must support at least one configuration type (http or stdio)`);
    }

    // Business rule: HTTP support requires httpConfig
    if (
      (config.clientSupports === 'http' || config.clientSupports === 'both') &&
      !config.configStructure.httpConfig
    ) {
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
    return this.getAllConfigs().filter(
      (config) => config.clientSupports === 'http' || config.clientSupports === 'both'
    );
  }

  getBridgeRequiredClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.requiresMcpRemoteForHttp === true);
  }

  getStdioOnlyClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.clientSupports === 'stdio-only');
  }

  getClientsWithOneClick(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.oneClickProtocol !== undefined);
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

  createBuilder(clientId: ClientId): ConfigBuilder {
    const config = this.getConfig(clientId);
    if (!config) {
      throw new Error(`Unknown client: ${clientId}`);
    }
    if (config.localConfigSupport === 'none') {
      throw new Error(
        `Cannot create builder for ${config.displayName}: ${config.localConfigNotes || 'No local configuration support.'}`
      );
    }
    return new ConfigBuilder(config);
  }
}
