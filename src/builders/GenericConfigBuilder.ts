import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
import { buildMcpServerName } from '../server-name.js';
import { CLIENT } from '../constants.js';

// Clients that can use the CLI package
const CLI_SUPPORTED_CLIENTS: readonly string[] = [
  CLIENT.CLAUDE_DESKTOP,
  CLIENT.WINDSURF,
  CLIENT.GOOSE,
  CLIENT.CLAUDE_CODE,
  CLIENT.CLAUDE_TEAMS_ENTERPRISE,
  CLIENT.CHATGPT,
  CLIENT.JUNIE,
];

export class GenericConfigBuilder extends BaseConfigBuilder {
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

  buildOneClickUrl?(_options: MCPConnectionOptions): string {
    if (!this.config.protocolHandler) {
      throw new Error(`${this.config.displayName} does not support one-click installation`);
    }

    throw new Error(`One-click URL generation not implemented for ${this.config.displayName}`);
  }

  protected buildHttpCommand(options: MCPConnectionOptions): string | null {
    if (!CLI_SUPPORTED_CLIENTS.includes(this.config.id)) {
      return null;
    }

    const serverUrl = this.getServerUrl(options);
    const packageName = this.getCliPackage(options);

    let command = `npx -y ${packageName} remote`;
    command += ` --url ${serverUrl}`;
    command += ` --client ${this.config.id}`;

    if (options.apiToken) {
      command += ` --token ${options.apiToken}`;
    }

    return command;
  }

  protected buildStdioCommand(options: MCPConnectionOptions): string | null {
    if (!CLI_SUPPORTED_CLIENTS.includes(this.config.id)) {
      return null;
    }

    const packageName = this.getCliPackage(options);

    let command = `npx -y ${packageName} local`;

    if (options.instance) {
      if (this.isUrl(options.instance)) {
        command += ` --url ${options.instance}`;
      } else {
        command += ` --instance ${options.instance}`;
      }
    } else {
      command += ` --instance ${this.getInstanceOrPlaceholder(options)}`;
    }

    command += ` --client ${this.config.id}`;

    if (options.apiToken) {
      command += ` --token ${options.apiToken}`;
    }

    return command;
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
