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
}
