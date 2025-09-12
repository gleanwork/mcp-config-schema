import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { GleanServerConfig } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class GooseConfigBuilder extends BaseConfigBuilder {
  protected buildLocalConfig(
    serverData: GleanServerConfig,
    includeWrapper: boolean = true
  ): Record<string, unknown> {
    const { stdioConfig } = this.config.configStructure;

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

    // Goose uses 'envs' field directly, not through stdioConfig.envField
    const envs: Record<string, string> = {};

    if (serverData.instance) {
      if (serverData.instance.startsWith('http://') || serverData.instance.startsWith('https://')) {
        envs.GLEAN_URL = serverData.instance;
      } else {
        envs.GLEAN_INSTANCE = serverData.instance;
      }
    }

    if (serverData.apiToken) {
      envs.GLEAN_API_TOKEN = serverData.apiToken;
    }

    const gooseServerConfig = {
      name: serverName,
      ...serverConfig,
      type: 'stdio',
      timeout: 300,
      enabled: true,
      bundled: null,
      description: null,
      env_keys: [],
      envs: envs,
    };

    if (!includeWrapper) {
      return {
        [serverName]: gooseServerConfig,
      };
    }

    return {
      extensions: {
        [serverName]: gooseServerConfig,
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
        // Goose uses 'streamable_http' instead of 'http'
        serverConfig[httpConfig.typeField] = 'streamable_http';
      }

      serverConfig[httpConfig.urlField] = serverData.serverUrl;

      // Goose doesn't use httpConfig.headersField, it has its own headers field
      const headers: Record<string, string> = {};
      if (serverData.apiToken) {
        headers['Authorization'] = `Bearer ${serverData.apiToken}`;
      }

      const gooseServerConfig = {
        enabled: true,
        name: serverName,
        ...serverConfig,
        envs: {},
        env_keys: [],
        headers: headers,
        description: '',
        timeout: 300,
        bundled: null,
        available_tools: [],
      };

      if (!includeWrapper) {
        return {
          [serverName]: gooseServerConfig,
        };
      }

      return {
        [serverKey]: {
          [serverName]: gooseServerConfig,
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

  protected buildRemoteCommand(serverData: GleanServerConfig): string {
    const serverUrl = this.getServerUrl(serverData);
    const packageName = this.getConfigureMcpServerPackage(serverData);

    // Goose is supported by configure-mcp-server
    let command = `npx -y ${packageName} remote`;
    command += ` --url ${serverUrl}`;
    command += ` --client goose`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string {
    const packageName = this.getConfigureMcpServerPackage(serverData);

    let command = `npx -y ${packageName} local`;

    if (serverData.instance) {
      // Handle instance URL vs instance name
      if (this.isUrl(serverData.instance)) {
        command += ` --url ${serverData.instance}`;
      } else {
        command += ` --instance ${serverData.instance}`;
      }
    } else {
      command += ` --instance ${this.getInstanceOrPlaceholder(serverData)}`;
    }

    command += ` --client goose`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  getNormalizedServersConfig(config: Record<string, unknown>): Record<string, unknown> {
    // Goose uses extensions wrapper
    if (config['extensions']) {
      const extensions = config['extensions'] as Record<string, Record<string, unknown>>;
      const normalized: Record<string, unknown> = {};

      for (const [name, gooseConfig] of Object.entries(extensions)) {
        normalized[name] = {
          type: gooseConfig.type === 'streamable_http' ? 'http' : gooseConfig.type,
          command: gooseConfig.cmd,
          args: gooseConfig.args,
          env: gooseConfig.envs,
          url: gooseConfig.uri,
          headers: gooseConfig.headers,
        };
      }

      return normalized;
    }

    // Check if it's already flat (no wrapper)
    const normalized: Record<string, unknown> = {};
    for (const [name, gooseConfig] of Object.entries(config)) {
      if (typeof gooseConfig === 'object' && gooseConfig !== null) {
        const gc = gooseConfig as Record<string, unknown>;
        normalized[name] = {
          type: gc.type === 'streamable_http' ? 'http' : gc.type,
          command: gc.cmd,
          args: gc.args,
          env: gc.envs,
          url: gc.uri,
          headers: gc.headers,
        };
      }
    }

    return normalized;
  }
}
