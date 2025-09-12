import { GenericConfigBuilder } from './GenericConfigBuilder.js';
import { GleanServerConfig } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class CursorConfigBuilder extends GenericConfigBuilder {
  buildOneClickUrl(serverData: GleanServerConfig): string {
    if (!this.config.oneClick) {
      throw new Error(`${this.config.displayName} does not support one-click installation`);
    }

    const serverName = buildMcpServerName({
      transport: serverData.transport,
      serverUrl: serverData.serverUrl,
      serverName: serverData.serverName,
      productName: serverData.productName,
    });

    let config: Record<string, unknown>;

    if (serverData.transport === 'http') {
      config = {
        type: 'http',
        url: serverData.serverUrl,
      };

      if (serverData.apiToken) {
        config['headers'] = {
          Authorization: `Bearer ${serverData.apiToken}`,
        };
      }
    } else {
      config = {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@gleanwork/local-mcp-server'],
      };

      if (serverData.instance || serverData.apiToken) {
        config['env'] = {};
        if (serverData.instance) {
          (config['env'] as Record<string, string>)['GLEAN_INSTANCE'] = serverData.instance;
        }
        if (serverData.apiToken) {
          (config['env'] as Record<string, string>)['GLEAN_API_TOKEN'] = serverData.apiToken;
        }
      }
    }

    const encodedConfig = this.toBase64(JSON.stringify(config));

    return this.config.oneClick.urlTemplate
      .replace('{{name}}', encodeURIComponent(serverName))
      .replace('{{config}}', encodedConfig);
  }

  protected buildRemoteCommand(serverData: GleanServerConfig): string {
    const serverUrl = this.getServerUrl(serverData);
    const packageName = this.getConfigureMcpServerPackage(serverData);

    let command = `npx -y ${packageName} remote`;
    command += ` --url ${serverUrl}`;
    command += ` --client cursor`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string {
    const packageName = this.getConfigureMcpServerPackage(serverData);

    let command = `npx -y ${packageName} local`;

    if (serverData.instance) {
      if (this.isUrl(serverData.instance)) {
        command += ` --url ${serverData.instance}`;
      } else {
        command += ` --instance ${serverData.instance}`;
      }
    } else {
      command += ` --instance ${this.getInstanceOrPlaceholder(serverData)}`;
    }

    command += ` --client cursor`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  getNormalizedServersConfig(config: Record<string, unknown>): Record<string, unknown> {
    const { serverKey } = this.config.configStructure;

    if (config[serverKey]) {
      return config[serverKey] as Record<string, unknown>;
    }

    const firstKey = Object.keys(config)[0];
    if (firstKey && typeof config[firstKey] === 'object') {
      return config;
    }

    return {};
  }
}
