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
      config = {
        type: 'http',
        url: options.serverUrl,
      };

      if (options.apiToken) {
        config['headers'] = {
          Authorization: `Bearer ${options.apiToken}`,
        };
      }
    } else {
      config = {
        type: 'stdio',
        command: 'npx',
        args: ['-y', this.getServerPackage()],
      };

      const env = this.buildEnvVars(options);
      if (Object.keys(env).length > 0) {
        config['env'] = env;
      }
    }

    const encodedConfig = this.toBase64(JSON.stringify(config));

    return this.config.protocolHandler.urlTemplate
      .replace('{{name}}', encodeURIComponent(serverName))
      .replace('{{config}}', encodedConfig);
  }

  protected buildHttpCommand(options: MCPConnectionOptions): string {
    const serverUrl = this.getServerUrl(options);
    const packageName = this.getCliPackage(options);

    let command = `npx -y ${packageName} remote`;
    command += ` --url ${serverUrl}`;
    command += ` --client cursor`;

    if (options.apiToken) {
      command += ` --token ${options.apiToken}`;
    }

    return command;
  }

  protected buildStdioCommand(options: MCPConnectionOptions): string {
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

    command += ` --client cursor`;

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
