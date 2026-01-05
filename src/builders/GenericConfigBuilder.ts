import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions, StandardMCPConfig, MCPServersRecord } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

function isStandardMCPConfig(
  config: StandardMCPConfig | MCPServersRecord
): config is StandardMCPConfig {
  return typeof config === 'object' && config !== null && 'mcpServers' in config;
}

/**
 * Generic config builder for clients using the standard { mcpServers: {...} } format.
 * Used by: Claude Desktop, Windsurf, JetBrains, Junie, Gemini, ChatGPT, Claude Teams Enterprise
 */
export class GenericConfigBuilder extends BaseConfigBuilder<StandardMCPConfig> {
  protected buildStdioConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    const { serversPropertyName, stdioPropertyMapping } = this.config.configStructure;

    if (!stdioPropertyMapping) {
      throw new Error(`Client ${this.config.id} doesn't support stdio server configuration`);
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

  protected buildHttpConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    if (!options.serverUrl) {
      throw new Error('HTTP transport requires a server URL');
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
      throw new Error(`Client ${this.config.id} doesn't support HTTP server configuration`);
    }
  }

  buildOneClickUrl?(_options: MCPConnectionOptions): string {
    if (!this.config.protocolHandler) {
      throw new Error(`${this.config.displayName} does not support one-click installation`);
    }

    throw new Error(`One-click URL generation not implemented for ${this.config.displayName}`);
  }

  protected buildHttpCommand(options: MCPConnectionOptions): string | null {
    // Use custom command builder callback if provided
    if (this.commandBuilder?.http) {
      return this.commandBuilder.http(this.config.id, options);
    }

    // No native CLI support for generic clients - return null
    return null;
  }

  protected buildStdioCommand(options: MCPConnectionOptions): string | null {
    // Use custom command builder callback if provided
    if (this.commandBuilder?.stdio) {
      return this.commandBuilder.stdio(this.config.id, options);
    }

    // No native CLI support for generic clients - return null
    return null;
  }

  getNormalizedServersConfig(config: StandardMCPConfig | MCPServersRecord): MCPServersRecord {
    // Use type guard to narrow the union
    if (isStandardMCPConfig(config)) {
      return config.mcpServers;
    }
    // Flat config from includeRootObject: false - already the servers record
    return config;
  }
}
