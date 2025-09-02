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
    });

    // Build the appropriate config based on the client's capabilities
    let config: Record<string, unknown>;

    if (serverData.transport === 'http') {
      config = {
        type: 'http',
        url: serverData.serverUrl,
      };

      // Add headers for authentication if API token is provided
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

    // Cursor uses base64-json format
    const encodedConfig = Buffer.from(JSON.stringify(config)).toString('base64');

    // Replace placeholders in the template
    return this.config.oneClick.urlTemplate
      .replace('{{name}}', encodeURIComponent(serverName))
      .replace('{{config}}', encodedConfig);
  }

  protected buildRemoteCommand(serverData: GleanServerConfig): string {
    if (!serverData.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    // Cursor doesn't have native CLI, use configure-mcp-server
    let command = `npx -y @gleanwork/configure-mcp-server remote`;
    command += ` --url ${serverData.serverUrl}`;
    command += ` --client cursor`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string {
    if (!serverData.instance) {
      throw new Error('Local configuration requires instance');
    }

    let command = `npx -y @gleanwork/configure-mcp-server local`;

    // Handle instance URL vs instance name
    if (serverData.instance.startsWith('http://') || serverData.instance.startsWith('https://')) {
      command += ` --url ${serverData.instance}`;
    } else {
      command += ` --instance ${serverData.instance}`;
    }

    command += ` --client cursor`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  getNormalizedServersConfig(config: Record<string, unknown>): Record<string, unknown> {
    const { serverKey } = this.config.configStructure;

    // Cursor uses mcpServers wrapper
    if (config[serverKey]) {
      return config[serverKey] as Record<string, unknown>;
    }

    // Check if it's already flat (no wrapper)
    const firstKey = Object.keys(config)[0];
    if (firstKey && typeof config[firstKey] === 'object') {
      return config;
    }

    return {};
  }
}
