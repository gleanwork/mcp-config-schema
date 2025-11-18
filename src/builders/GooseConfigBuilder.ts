import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPServerConfig } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class GooseConfigBuilder extends BaseConfigBuilder {
  protected buildLocalConfig(
    serverData: MCPServerConfig,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    const { stdioPropertyMapping } = this.config.configStructure;

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

    // Goose uses 'envs' property directly, not through stdioPropertyMapping.envProperty
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

    if (!includeRootObject) {
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
        // Goose uses 'streamable_http' instead of 'http'
        serverConfig[httpPropertyMapping.typeProperty] = 'streamable_http';
      }

      serverConfig[httpPropertyMapping.urlProperty] = serverData.serverUrl;

      // Goose doesn't use httpPropertyMapping.headersProperty, it has its own headers property
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

      if (!includeRootObject) {
        return {
          [serverName]: gooseServerConfig,
        };
      }

      return {
        [serversPropertyName]: {
          [serverName]: gooseServerConfig,
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

      // Add bearer token as header for mcp-remote
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

  protected buildRemoteCommand(serverData: MCPServerConfig): string {
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

  protected buildLocalCommand(serverData: MCPServerConfig): string {
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
