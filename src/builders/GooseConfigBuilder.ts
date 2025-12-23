import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class GooseConfigBuilder extends BaseConfigBuilder {
  protected buildLocalConfig(
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
    serverConfig[stdioPropertyMapping.argsProperty] = ['-y', this.serverPackage];

    if (stdioPropertyMapping.typeProperty) {
      serverConfig[stdioPropertyMapping.typeProperty] = 'stdio';
    }

    // Goose uses 'envs' property directly, not through stdioPropertyMapping.envProperty
    // Use generic env vars from options
    const envs = this.getEnvVars(options) || {};

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

    // Substitute URL template variables
    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    if (httpPropertyMapping && this.config.transports.includes('http')) {
      const serverConfig: Record<string, unknown> = {};

      if (httpPropertyMapping.typeProperty) {
        // Goose uses 'streamable_http' instead of 'http'
        serverConfig[httpPropertyMapping.typeProperty] = 'streamable_http';
      }

      serverConfig[httpPropertyMapping.urlProperty] = resolvedUrl;

      // Use generic headers
      const headers = this.buildHeaders(options) || {};

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
      // Use mcp-remote bridge for clients that don't support HTTP natively
      const serverConfig: Record<string, unknown> = {};

      if (stdioPropertyMapping.typeProperty) {
        serverConfig[stdioPropertyMapping.typeProperty] = 'stdio';
      }

      serverConfig[stdioPropertyMapping.commandProperty] = 'npx';
      const mcpRemotePackage = options.mcpRemoteVersion
        ? `mcp-remote@${options.mcpRemoteVersion}`
        : 'mcp-remote';
      const args = ['-y', mcpRemotePackage, resolvedUrl];

      // Add headers as mcp-remote arguments
      const headers = this.buildHeaders(options);
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          args.push('--header', `${key}: ${value}`);
        }
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

  protected buildRemoteCommand(options: MCPConnectionOptions): string | null {
    if (!options.serverUrl) {
      return null;
    }

    // Substitute URL template variables
    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    // Goose is supported by configure-mcp-server
    let command = `npx -y ${this.cliPackage} remote`;
    command += ` --url ${resolvedUrl}`;
    command += ` --client goose`;

    return command;
  }

  protected buildLocalCommand(_options: MCPConnectionOptions): string | null {
    // Local command generation requires the cliPackage to handle environment variables
    // For vendor-neutral usage, consumers should use buildConfiguration() and write the config file directly
    return null;
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
