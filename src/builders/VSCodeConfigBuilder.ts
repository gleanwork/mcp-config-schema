import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions, VSCodeMCPConfig, MCPServersRecord } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

function isVSCodeMCPConfig(config: VSCodeMCPConfig | MCPServersRecord): config is VSCodeMCPConfig {
  return typeof config === 'object' && config !== null && 'servers' in config;
}

/**
 * Config builder for VS Code which uses { servers: {...} } format.
 */
export class VSCodeConfigBuilder extends BaseConfigBuilder<VSCodeMCPConfig> {
  protected buildLocalConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    const { serversPropertyName, stdioPropertyMapping } = this.config.configStructure;

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

    // Use generic env vars from options
    if (stdioPropertyMapping.envProperty) {
      const env = this.getEnvVars(options);
      if (env) {
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
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    if (!options.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    const { serversPropertyName, httpPropertyMapping, stdioPropertyMapping } =
      this.config.configStructure;

    // Substitute URL template variables
    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    const serverName = buildMcpServerName({
      transport: 'http',
      serverUrl: options.serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    if (httpPropertyMapping && this.config.transports.includes('http')) {
      const serverConfig: Record<string, unknown> = {};

      if (httpPropertyMapping.typeProperty) {
        serverConfig[httpPropertyMapping.typeProperty] = 'http';
      }

      serverConfig[httpPropertyMapping.urlProperty] = resolvedUrl;

      // Use generic headers
      const headers = this.buildHeaders(options);
      if (httpPropertyMapping.headersProperty && headers) {
        serverConfig[httpPropertyMapping.headersProperty] = headers;
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

  buildOneClickUrl(options: MCPConnectionOptions): string {
    if (!this.config.protocolHandler) {
      throw new Error(`${this.config.displayName} does not support one-click installation`);
    }

    const serverName = buildMcpServerName({
      transport: options.transport,
      serverUrl: options.serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    // Build the appropriate config based on the client's capabilities
    // Special handling for VSCode - it includes the name in the config object
    const config: Record<string, unknown> = {
      name: serverName,
    };

    if (options.transport === 'http') {
      // Substitute URL template variables
      const resolvedUrl = this.substituteUrlVariables(
        options.serverUrl || '',
        options.urlVariables
      );
      config['type'] = 'http';
      config['url'] = resolvedUrl;

      // Use generic headers
      const headers = this.buildHeaders(options);
      if (headers) {
        config['headers'] = headers;
      }
    } else {
      config['type'] = 'stdio';
      config['command'] = 'npx';
      config['args'] = ['-y', this.serverPackage];
      const env = this.getEnvVars(options);
      if (env) {
        config['env'] = env;
      }
    }

    // VSCode uses url-encoded-json format and puts the entire config as a query parameter
    const encodedConfig = encodeURIComponent(JSON.stringify(config));

    // VSCode uses urlTemplate with {{config}} placeholder
    return this.config.protocolHandler.urlTemplate.replace('{{config}}', encodedConfig);
  }

  protected buildRemoteCommand(options: MCPConnectionOptions): string {
    if (!options.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    // Substitute URL template variables
    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    const serverName = buildMcpServerName({
      transport: options.transport,
      serverUrl: options.serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    const config: Record<string, unknown> = {
      name: serverName,
      type: 'http',
      url: resolvedUrl,
    };

    // Use generic headers
    const headers = this.buildHeaders(options);
    if (headers) {
      config.headers = headers;
    }

    // VS Code expects a JSON object as a single argument
    const jsonConfig = JSON.stringify(config);
    // Escape single quotes for shell
    const escapedConfig = jsonConfig.replace(/'/g, "'\\''");
    return `code --add-mcp '${escapedConfig}'`;
  }

  protected buildLocalCommand(options: MCPConnectionOptions): string {
    // VS Code also supports stdio servers via --add-mcp
    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: options.serverName,
      productName: options.productName,
    });

    const config: Record<string, unknown> = {
      name: serverName,
      type: 'stdio',
      command: 'npx',
      args: ['-y', this.serverPackage],
    };

    // Use generic env vars from options
    const env = this.getEnvVars(options);
    if (env) {
      config.env = env;
    }

    const jsonConfig = JSON.stringify(config);
    const escapedConfig = jsonConfig.replace(/'/g, "'\\''");
    return `code --add-mcp '${escapedConfig}'`;
  }

  getNormalizedServersConfig(config: VSCodeMCPConfig | MCPServersRecord): MCPServersRecord {
    // Use type guard to narrow the union
    if (isVSCodeMCPConfig(config)) {
      return config.servers;
    }
    // Flat config from includeRootObject: false - already the servers record
    return config;
  }
}
