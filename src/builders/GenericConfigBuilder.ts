import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
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

  buildOneClickUrl?(_options: MCPConnectionOptions): string {
    if (!this.config.protocolHandler) {
      throw new Error(`${this.config.displayName} does not support one-click installation`);
    }

    throw new Error(`One-click URL generation not implemented for ${this.config.displayName}`);
  }

  protected buildRemoteCommand(options: MCPConnectionOptions): string | null {
    if (!CONFIGURE_MCP_SUPPORTED_CLIENTS.includes(this.config.id)) {
      return null;
    }

    if (!options.serverUrl) {
      return null;
    }

    // Substitute URL template variables
    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    let command = `npx -y ${this.cliPackage} remote`;
    command += ` --url ${resolvedUrl}`;
    command += ` --client ${this.config.id}`;

    return command;
  }

  protected buildLocalCommand(_options: MCPConnectionOptions): string | null {
    if (!CONFIGURE_MCP_SUPPORTED_CLIENTS.includes(this.config.id)) {
      return null;
    }

    // Local command generation requires the cliPackage to handle environment variables
    // For vendor-neutral usage, consumers should use buildConfiguration() and write the config file directly
    return null;
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
