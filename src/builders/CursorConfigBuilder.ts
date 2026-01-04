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
      const resolvedUrl = this.substituteUrlVariables(
        options.serverUrl || '',
        options.urlVariables
      );

      config = {
        type: 'http',
        url: resolvedUrl,
      };

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

  protected buildHttpCommand(options: MCPConnectionOptions): string | null {
    if (!options.serverUrl) {
      return null;
    }

    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    let command = `npx -y ${this.cliPackage} remote`;
    command += ` --url ${resolvedUrl}`;
    command += ` --client cursor`;

    return command;
  }

  protected buildStdioCommand(_options: MCPConnectionOptions): string | null {
    // Stdio command generation requires the cliPackage to handle environment variables.
    // For vendor-neutral usage, consumers should use buildConfiguration() and write the config file directly.
    return null;
  }
}
