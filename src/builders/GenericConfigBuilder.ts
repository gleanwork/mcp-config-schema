import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { GleanServerConfig } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

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

      // Add bearer token as header for mcp-remote
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

    // This shouldn't be reached for clients without oneClick support
    throw new Error(`One-click URL generation not implemented for ${this.config.displayName}`);
  }

  protected buildRemoteCommand(serverData: GleanServerConfig): string | null {
    // Check if this client is supported by configure-mcp-server
    const supportedClients = ['claude-desktop', 'windsurf', 'goose', 'claude-code'];
    if (!supportedClients.includes(this.config.id)) {
      // No CLI support for this client
      return null;
    }

    if (!serverData.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    const packageName = serverData.configureMcpServerVersion
      ? `@gleanwork/configure-mcp-server@${serverData.configureMcpServerVersion}`
      : '@gleanwork/configure-mcp-server';

    let command = `npx -y ${packageName} remote`;
    command += ` --url ${serverData.serverUrl}`;
    command += ` --client ${this.config.id}`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string | null {
    const supportedClients = ['claude-desktop', 'windsurf', 'goose', 'claude-code'];
    if (!supportedClients.includes(this.config.id)) {
      return null;
    }

    const packageName = serverData.configureMcpServerVersion
      ? `@gleanwork/configure-mcp-server@${serverData.configureMcpServerVersion}`
      : '@gleanwork/configure-mcp-server';

    let command = `npx -y ${packageName} local`;

    // Handle instance URL vs instance name
    if (serverData.instance) {
      if (serverData.instance.startsWith('http://') || serverData.instance.startsWith('https://')) {
        // Full URL provided
        command += ` --url ${serverData.instance}`;
      } else {
        // Instance name provided
        command += ` --instance ${serverData.instance}`;
      }
    } else {
      throw new Error('Local configuration requires instance');
    }

    command += ` --client ${this.config.id}`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  getNormalizedServersConfig(config: Record<string, unknown>): Record<string, unknown> {
    const { serverKey } = this.config.configStructure;

    // Check for different wrapper structures
    if (config[serverKey]) {
      return config[serverKey] as Record<string, unknown>;
    }

    // Check if it's already flat (no wrapper)
    const firstKey = Object.keys(config)[0];
    if (firstKey && typeof config[firstKey] === 'object') {
      // Assume it's a flat server config
      return config;
    }

    return {};
  }
}
