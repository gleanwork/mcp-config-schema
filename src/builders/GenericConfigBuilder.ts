import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPServerConfig } from '../types.js';
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
];

export class GenericConfigBuilder extends BaseConfigBuilder {
  protected buildLocalConfig(
    serverData: MCPServerConfig,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    const { serversPropertyName, stdioPropertyMapping } = this.config.configStructure;

    if (!stdioPropertyMapping) {
      throw new Error(`Client ${this.config.id} doesn't support local server configuration`);
    }

    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: serverData.serverName,
      productName: serverData.productName,
    });
    const serverConfig: Record<string, unknown> = {};

    serverConfig[stdioPropertyMapping.commandProperty] = 'npx';
    serverConfig[stdioPropertyMapping.argsProperty] = ['-y', '@gleanwork/local-mcp-server'];

    if (stdioPropertyMapping.typeProperty) {
      serverConfig[stdioPropertyMapping.typeProperty] = 'stdio';
    }

    if (stdioPropertyMapping.envProperty) {
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
        serverConfig[stdioPropertyMapping.envProperty] = env;
      }
    }

    if (!includeRootObject) {
      return {
        [serverName]: serverConfig,
      };
    }

    return {
      [serversPropertyName]: {
        [serverName]: serverConfig,
      },
    };
  }

  protected buildRemoteConfig(
    serverData: MCPServerConfig,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    if (!serverData.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    const { serversPropertyName, httpPropertyMapping, stdioPropertyMapping } =
      this.config.configStructure;

    const serverName = buildMcpServerName({
      transport: 'http',
      serverUrl: serverData.serverUrl,
      serverName: serverData.serverName,
      productName: serverData.productName,
    });

    if (httpPropertyMapping && this.config.transports.includes('http')) {
      const serverConfig: Record<string, unknown> = {};

      if (httpPropertyMapping.typeProperty) {
        serverConfig[httpPropertyMapping.typeProperty] = 'http';
      }

      serverConfig[httpPropertyMapping.urlProperty] = serverData.serverUrl;

      // Add headers for authentication if API token is provided
      if (httpPropertyMapping.headersProperty && serverData.apiToken) {
        serverConfig[httpPropertyMapping.headersProperty] = {
          Authorization: `Bearer ${serverData.apiToken}`,
        };
      }

      if (!includeRootObject) {
        return {
          [serverName]: serverConfig,
        };
      }

      return {
        [serversPropertyName]: {
          [serverName]: serverConfig,
        },
      };
    } else if (stdioPropertyMapping) {
      const serverConfig: Record<string, unknown> = {};

      if (stdioPropertyMapping.typeProperty) {
        serverConfig[stdioPropertyMapping.typeProperty] = 'stdio';
      }

      serverConfig[stdioPropertyMapping.commandProperty] = 'npx';
      const mcpRemotePackage = serverData.mcpRemoteVersion
        ? `mcp-remote@${serverData.mcpRemoteVersion}`
        : 'mcp-remote';
      const args = ['-y', mcpRemotePackage, serverData.serverUrl];

      if (serverData.apiToken) {
        args.push('--header', `Authorization: Bearer ${serverData.apiToken}`);
      }

      serverConfig[stdioPropertyMapping.argsProperty] = args;

      if (!includeRootObject) {
        return {
          [serverName]: serverConfig,
        };
      }

      return {
        [serversPropertyName]: {
          [serverName]: serverConfig,
        },
      };
    } else {
      throw new Error(`Client ${this.config.id} doesn't support remote server configuration`);
    }
  }

  buildOneClickUrl?(_serverData: MCPServerConfig): string {
    if (!this.config.protocolHandler) {
      throw new Error(`${this.config.displayName} does not support one-click installation`);
    }

    throw new Error(`One-click URL generation not implemented for ${this.config.displayName}`);
  }

  protected buildRemoteCommand(serverData: MCPServerConfig): string | null {
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

  protected buildLocalCommand(serverData: MCPServerConfig): string | null {
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
    const { serversPropertyName } = this.config.configStructure;

    if (config[serversPropertyName]) {
      return config[serversPropertyName] as Record<string, unknown>;
    }

    const firstKey = Object.keys(config)[0];
    if (firstKey && typeof config[firstKey] === 'object') {
      return config;
    }

    return {};
  }
}
