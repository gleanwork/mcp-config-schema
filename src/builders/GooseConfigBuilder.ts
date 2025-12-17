import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class GooseConfigBuilder extends BaseConfigBuilder {
  protected buildStdioConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    const { stdioPropertyMapping } = this.config.configStructure;

    if (!stdioPropertyMapping) {
      throw new Error(`Client ${this.config.id} doesn't support local server configuration`);
    }

    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: options.serverName,
      productName: options.productName,
    });

    const serverConfig: Record<string, unknown> = {};

    serverConfig[stdioPropertyMapping.commandProperty] = 'npx';
    serverConfig[stdioPropertyMapping.argsProperty] = ['-y', this.getServerPackage()];

    if (stdioPropertyMapping.typeProperty) {
      serverConfig[stdioPropertyMapping.typeProperty] = 'stdio';
    }

    // Goose uses 'envs' property directly, not through stdioPropertyMapping.envProperty
    const envs = this.buildEnvVars(options);

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

  protected buildHttpConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    if (!options.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    const { serversPropertyName, httpPropertyMapping, stdioPropertyMapping } =
      this.config.configStructure;

    const serverName = buildMcpServerName({
      transport: 'http',
      serverUrl: options.serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    if (httpPropertyMapping && this.config.transports.includes('http')) {
      const serverConfig: Record<string, unknown> = {};

      if (httpPropertyMapping.typeProperty) {
        // Goose uses 'streamable_http' instead of 'http'
        serverConfig[httpPropertyMapping.typeProperty] = 'streamable_http';
      }

      serverConfig[httpPropertyMapping.urlProperty] = options.serverUrl;

      // Goose doesn't use httpPropertyMapping.headersProperty, it has its own headers property
      const headers: Record<string, string> = {};
      if (options.apiToken) {
        headers['Authorization'] = `Bearer ${options.apiToken}`;
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
      const mcpRemotePackage = options.mcpRemoteVersion
        ? `mcp-remote@${options.mcpRemoteVersion}`
        : 'mcp-remote';
      const args = ['-y', mcpRemotePackage, options.serverUrl];

      // Add bearer token as header for mcp-remote
      if (options.apiToken) {
        args.push('--header', `Authorization: Bearer ${options.apiToken}`);
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

  protected buildHttpCommand(options: MCPConnectionOptions): string {
    const serverUrl = this.getServerUrl(options);
    const packageName = this.getCliPackage(options);

    // Goose is supported by the CLI package
    let command = `npx -y ${packageName} remote`;
    command += ` --url ${serverUrl}`;
    command += ` --client goose`;

    if (options.apiToken) {
      command += ` --token ${options.apiToken}`;
    }

    return command;
  }

  protected buildStdioCommand(options: MCPConnectionOptions): string {
    const packageName = this.getCliPackage(options);

    let command = `npx -y ${packageName} local`;

    if (options.instance) {
      // Handle instance URL vs instance name
      if (this.isUrl(options.instance)) {
        command += ` --url ${options.instance}`;
      } else {
        command += ` --instance ${options.instance}`;
      }
    } else {
      command += ` --instance ${this.getInstanceOrPlaceholder(options)}`;
    }

    command += ` --client goose`;

    if (options.apiToken) {
      command += ` --token ${options.apiToken}`;
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
