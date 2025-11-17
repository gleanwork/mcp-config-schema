import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { GleanServerConfig } from '../types.js';
import { buildMcpServerName } from '../server-name.js';
import { CLIENT } from '../constants.js';

// Clients that can use configure-mcp-server
const CONFIGURE_MCP_SUPPORTED_CLIENTS: readonly string[] = [
  CLIENT.CLAUDE_DESKTOP,
  CLIENT.WINDSURF,
  CLIENT.GOOSE,
  CLIENT.CLAUDE_CODE,
  CLIENT.CLAUDE_TEAMS_ENTERPRISE,
  CLIENT.CHATGPT,
  CLIENT.JUNIE,
  CLIENT.JETBRAINS,
];

export class GenericConfigBuilder extends BaseConfigBuilder {
  protected buildLocalConfig(
    serverData: GleanServerConfig,
    includeWrapper: boolean = true
  ): Record<string, unknown> {
    const { serverKey, stdioConfig } = this.config.configStructure;

    if (!stdioConfig) {
      throw new Error(`Client ${this.config.id} doesn't support local server configuration`);
    }

    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: serverData.serverName,
      productName: serverData.productName,
    });
    const serverConfig: Record<string, unknown> = {};

    serverConfig[stdioConfig.commandField] = 'npx';
    serverConfig[stdioConfig.argsField] = ['-y', '@gleanwork/local-mcp-server'];

    if (stdioConfig.typeField) {
      serverConfig[stdioConfig.typeField] = 'stdio';
    }

    if (stdioConfig.envField) {
      const env: Record<string, string> = {};

      if (serverData.instance) {
        if (
          serverData.instance.startsWith('http://') ||
          serverData.instance.startsWith('https://')
        ) {
          env.GLEAN_URL = serverData.instance;
        } else {
          env.GLEAN_INSTANCE = serverData.instance;
        }
      }

      if (serverData.apiToken) {
        env.GLEAN_API_TOKEN = serverData.apiToken;
      }

      if (Object.keys(env).length > 0) {
        serverConfig[stdioConfig.envField] = env;
      }
    }

    if (!includeWrapper) {
      return {
        [serverName]: serverConfig,
      };
    }

    return {
      [serverKey]: {
        [serverName]: serverConfig,
      },
    };
  }

  protected buildRemoteConfig(
    serverData: GleanServerConfig,
    includeWrapper: boolean = true
  ): Record<string, unknown> {
    if (!serverData.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    const { serverKey, httpConfig, stdioConfig } = this.config.configStructure;

    const serverName = buildMcpServerName({
      transport: 'http',
      serverUrl: serverData.serverUrl,
      serverName: serverData.serverName,
      productName: serverData.productName,
    });

    if (httpConfig && this.config.transports.includes('http')) {
      const serverConfig: Record<string, unknown> = {};

      if (httpConfig.typeField) {
        serverConfig[httpConfig.typeField] = 'http';
      }

      serverConfig[httpConfig.urlField] = serverData.serverUrl;

      // Add headers for authentication if API token is provided
      if (httpConfig.headersField && serverData.apiToken) {
        serverConfig[httpConfig.headersField] = {
          Authorization: `Bearer ${serverData.apiToken}`,
        };
      }

      if (!includeWrapper) {
        return {
          [serverName]: serverConfig,
        };
      }

      return {
        [serverKey]: {
          [serverName]: serverConfig,
        },
      };
    } else if (stdioConfig) {
      const serverConfig: Record<string, unknown> = {};

      if (stdioConfig.typeField) {
        serverConfig[stdioConfig.typeField] = 'stdio';
      }

      serverConfig[stdioConfig.commandField] = 'npx';
      const mcpRemotePackage = serverData.mcpRemoteVersion
        ? `mcp-remote@${serverData.mcpRemoteVersion}`
        : 'mcp-remote';
      const args = ['-y', mcpRemotePackage, serverData.serverUrl];

      if (serverData.apiToken) {
        args.push('--header', `Authorization: Bearer ${serverData.apiToken}`);
      }

      serverConfig[stdioConfig.argsField] = args;

      if (!includeWrapper) {
        return {
          [serverName]: serverConfig,
        };
      }

      return {
        [serverKey]: {
          [serverName]: serverConfig,
        },
      };
    } else {
      throw new Error(`Client ${this.config.id} doesn't support remote server configuration`);
    }
  }

  buildOneClickUrl?(_serverData: GleanServerConfig): string {
    if (!this.config.oneClick) {
      throw new Error(`${this.config.displayName} does not support one-click installation`);
    }

    throw new Error(`One-click URL generation not implemented for ${this.config.displayName}`);
  }

  protected buildRemoteCommand(serverData: GleanServerConfig): string | null {
    if (!CONFIGURE_MCP_SUPPORTED_CLIENTS.includes(this.config.id)) {
      return null;
    }

    const serverUrl = this.getServerUrl(serverData);
    const packageName = this.getConfigureMcpServerPackage(serverData);

    let command = `npx -y ${packageName} remote`;
    command += ` --url ${serverUrl}`;
    command += ` --client ${this.config.id}`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string | null {
    if (!CONFIGURE_MCP_SUPPORTED_CLIENTS.includes(this.config.id)) {
      return null;
    }

    const packageName = this.getConfigureMcpServerPackage(serverData);

    let command = `npx -y ${packageName} local`;

    if (serverData.instance) {
      if (this.isUrl(serverData.instance)) {
        command += ` --url ${serverData.instance}`;
      } else {
        command += ` --instance ${serverData.instance}`;
      }
    } else {
      command += ` --instance ${this.getInstanceOrPlaceholder(serverData)}`;
    }

    command += ` --client ${this.config.id}`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  getNormalizedServersConfig(config: Record<string, unknown>): Record<string, unknown> {
    const { serverKey } = this.config.configStructure;

    if (config[serverKey]) {
      return config[serverKey] as Record<string, unknown>;
    }

    const firstKey = Object.keys(config)[0];
    if (firstKey && typeof config[firstKey] === 'object') {
      return config;
    }

    return {};
  }
}
