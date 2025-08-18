import { MCPClientConfig, ClientId, Platform } from './types.js';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class MCPConfigRegistry {
  private configs: Map<ClientId, MCPClientConfig> = new Map();
  private configDir: string;

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(__dirname, '../configs');
    this.loadConfigs();
  }

  private loadConfigs(): void {
    const pattern = path.join(this.configDir, '*.json');
    const files = glob.sync(pattern);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const config: MCPClientConfig = JSON.parse(content);
        this.validateConfig(config);
        this.configs.set(config.id, config);
      } catch (error) {
        console.error(`Failed to load config ${file}:`, error);
      }
    }
  }

  private validateConfig(config: MCPClientConfig): void {
    const requiredFields: (keyof MCPClientConfig)[] = [
      'id',
      'name',
      'displayName',
      'compatibility',
      'clientSupports',
      'requiresMcpRemoteForHttp',
      'supportedPlatforms',
      'configFormat',
      'configPath',
      'configStructure',
    ];

    for (const field of requiredFields) {
      if (!(field in config)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (config.clientSupports === 'stdio-only' && !config.requiresMcpRemoteForHttp) {
      throw new Error(`stdio-only clients must require mcp-remote for HTTP servers`);
    }

    if (config.clientSupports === 'http' && config.requiresMcpRemoteForHttp) {
      throw new Error(`HTTP-supporting clients shouldn't require mcp-remote`);
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
    return this.getAllConfigs().filter((config) => config.compatibility === 'full');
  }

  getClientsByPlatform(platform: Platform): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.supportedPlatforms.includes(platform));
  }

  getInvestigatingClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.compatibility === 'investigating');
  }

  getUnsupportedClients(): MCPClientConfig[] {
    return this.getAllConfigs().filter((config) => config.compatibility === 'none');
  }
}
