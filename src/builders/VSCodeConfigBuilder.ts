import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { GleanServerConfig } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class VSCodeConfigBuilder extends BaseConfigBuilder {
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

  buildOneClickUrl(serverData: GleanServerConfig): string {
    if (!this.config.oneClick) {
      throw new Error(`${this.config.displayName} does not support one-click installation`);
    }

    const serverName = buildMcpServerName({
      transport: serverData.transport,
      serverUrl: serverData.serverUrl,
      serverName: serverData.serverName,
      productName: serverData.productName,
    });

    // Build the appropriate config based on the client's capabilities
    // Special handling for VSCode - it includes the name in the config object
    const config: Record<string, unknown> = {
      name: serverName,
    };

    if (serverData.transport === 'http') {
      config['type'] = 'http';
      config['url'] = serverData.serverUrl;

      // Add headers for authentication if API token is provided
      if (serverData.apiToken) {
        config['headers'] = {
          Authorization: `Bearer ${serverData.apiToken}`,
        };
      }
    } else {
      config['type'] = 'stdio';
      config['command'] = 'npx';
      config['args'] = ['-y', '@gleanwork/local-mcp-server'];
      if (serverData.instance || serverData.apiToken) {
        config['env'] = {};
        if (serverData.instance) {
          (config['env'] as Record<string, string>)['GLEAN_INSTANCE'] = serverData.instance;
        }
        if (serverData.apiToken) {
          (config['env'] as Record<string, string>)['GLEAN_API_TOKEN'] = serverData.apiToken;
        }
      }
    }

    // VSCode uses url-encoded-json format and puts the entire config as a query parameter
    const encodedConfig = encodeURIComponent(JSON.stringify(config));

    // VSCode uses urlTemplate with {{config}} placeholder
    return this.config.oneClick.urlTemplate.replace('{{config}}', encodedConfig);
  }

  protected buildRemoteCommand(serverData: GleanServerConfig): string {
    // VS Code has native support for HTTP servers via --add-mcp
    const serverUrl = this.getServerUrl(serverData);

    const serverName = buildMcpServerName({
      transport: serverData.transport,
      serverUrl: serverUrl,
      serverName: serverData.serverName,
      productName: serverData.productName,
    });

    const config: Record<string, unknown> = {
      name: serverName,
      type: 'http',
      url: serverUrl,
    };

    if (serverData.apiToken) {
      config.headers = {
        Authorization: `Bearer ${serverData.apiToken}`,
      };
    }

    // VS Code expects a JSON object as a single argument
    const jsonConfig = JSON.stringify(config);
    // Escape single quotes for shell
    const escapedConfig = jsonConfig.replace(/'/g, "'\\''");
    return `code --add-mcp '${escapedConfig}'`;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string {
    // VS Code also supports stdio servers via --add-mcp
    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: serverData.serverName,
      productName: serverData.productName,
    });

    const config: Record<string, unknown> = {
      name: serverName,
      type: 'stdio',
      command: 'npx',
      args: ['-y', this.getLocalMcpServerPackage()],
    };

    const env: Record<string, string> = {};

    if (serverData.instance) {
      if (this.isUrl(serverData.instance)) {
        env.GLEAN_URL = serverData.instance;
      } else {
        env.GLEAN_INSTANCE = serverData.instance;
      }
    } else {
      // Use placeholder if no instance
      env.GLEAN_INSTANCE = this.getInstanceOrPlaceholder(serverData);
    }

    if (serverData.apiToken) {
      env.GLEAN_API_TOKEN = serverData.apiToken;
    }

    // Only add env to config if it has properties
    if (Object.keys(env).length > 0) {
      config.env = env;
    }

    const jsonConfig = JSON.stringify(config);
    const escapedConfig = jsonConfig.replace(/'/g, "'\\''");
    return `code --add-mcp '${escapedConfig}'`;
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
