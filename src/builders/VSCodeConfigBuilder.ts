import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class VSCodeConfigBuilder extends BaseConfigBuilder {
  protected buildStdioConfig(
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
    serverConfig[stdioPropertyMapping.argsProperty] = ['-y', this.getServerPackage()];

    if (stdioPropertyMapping.typeProperty) {
      serverConfig[stdioPropertyMapping.typeProperty] = 'stdio';
    }

    if (stdioPropertyMapping.envProperty) {
      const env = this.buildEnvVars(options);

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
        serverConfig[httpPropertyMapping.typeProperty] = 'http';
      }

      serverConfig[httpPropertyMapping.urlProperty] = options.serverUrl;

      // Add headers for authentication if API token is provided
      if (httpPropertyMapping.headersProperty && options.apiToken) {
        serverConfig[httpPropertyMapping.headersProperty] = {
          Authorization: `Bearer ${options.apiToken}`,
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
      config['type'] = 'http';
      config['url'] = options.serverUrl;

      // Add headers for authentication if API token is provided
      if (options.apiToken) {
        config['headers'] = {
          Authorization: `Bearer ${options.apiToken}`,
        };
      }
    } else {
      config['type'] = 'stdio';
      config['command'] = 'npx';
      config['args'] = ['-y', this.getServerPackage()];
      const env = this.buildEnvVars(options);
      if (Object.keys(env).length > 0) {
        config['env'] = env;
      }
    }

    // VSCode uses url-encoded-json format and puts the entire config as a query parameter
    const encodedConfig = encodeURIComponent(JSON.stringify(config));

    // VSCode uses urlTemplate with {{config}} placeholder
    return this.config.protocolHandler.urlTemplate.replace('{{config}}', encodedConfig);
  }

  protected buildHttpCommand(options: MCPConnectionOptions): string {
    // VS Code has native support for HTTP servers via --add-mcp
    const serverUrl = this.getServerUrl(options);

    const serverName = buildMcpServerName({
      transport: options.transport,
      serverUrl: serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    const config: Record<string, unknown> = {
      name: serverName,
      type: 'http',
      url: serverUrl,
    };

    if (options.apiToken) {
      config.headers = {
        Authorization: `Bearer ${options.apiToken}`,
      };
    }

    // VS Code expects a JSON object as a single argument
    const jsonConfig = JSON.stringify(config);
    // Escape single quotes for shell
    const escapedConfig = jsonConfig.replace(/'/g, "'\\''");
    return `code --add-mcp '${escapedConfig}'`;
  }

  protected buildStdioCommand(options: MCPConnectionOptions): string {
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
      args: ['-y', this.getServerPackage()],
    };

    const env = this.buildEnvVars(options);

    // Only add env to config if it has properties
    if (Object.keys(env).length > 0) {
      config.env = env;
    }

    const jsonConfig = JSON.stringify(config);
    const escapedConfig = jsonConfig.replace(/'/g, "'\\''");
    return `code --add-mcp '${escapedConfig}'`;
  }

  getNormalizedServersConfig(config: Record<string, unknown>): Record<string, unknown> {
    const { serversPropertyName } = this.config.configStructure;

    // Check for different wrapper structures
    if (config[serversPropertyName]) {
      return config[serversPropertyName] as Record<string, unknown>;
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
