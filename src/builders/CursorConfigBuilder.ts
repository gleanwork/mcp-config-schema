import { GenericConfigBuilder } from './GenericConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class CursorConfigBuilder extends GenericConfigBuilder {
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

    let config: Record<string, unknown>;

    if (options.transport === 'http') {
      // Substitute URL template variables
      const resolvedUrl = this.substituteUrlVariables(
        options.serverUrl || '',
        options.urlVariables
      );

      config = {
        type: 'http',
        url: resolvedUrl,
      };

      // Use generic headers
      const headers = this.buildHeaders(options);
      if (headers) {
        config['headers'] = headers;
      }
    } else {
      config = {
        type: 'stdio',
        command: 'npx',
        args: ['-y', this.serverPackage],
      };

      // Use generic env vars from options
      const env = this.getEnvVars(options);
      if (env) {
        config['env'] = env;
      }
    }

    const encodedConfig = this.toBase64(JSON.stringify(config));

    return this.config.protocolHandler.urlTemplate
      .replace('{{name}}', encodeURIComponent(serverName))
      .replace('{{config}}', encodedConfig);
  }

  protected buildRemoteCommand(options: MCPConnectionOptions): string | null {
    if (!options.serverUrl) {
      return null;
    }

    // Substitute URL template variables
    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    let command = `npx -y ${this.cliPackage} remote`;
    command += ` --url ${resolvedUrl}`;
    command += ` --client cursor`;

    return command;
  }

  protected buildLocalCommand(_options: MCPConnectionOptions): string | null {
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
