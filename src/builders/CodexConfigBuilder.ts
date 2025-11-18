import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { GleanServerConfig } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class CodexConfigBuilder extends BaseConfigBuilder {
  protected buildLocalConfig(
    serverData: GleanServerConfig,
    includeWrapper: boolean = true
  ): Record<string, unknown> {
    const { stdioConfig } = this.config.configStructure;

    if (!stdioConfig) {
      throw new Error(`Client ${this.config.id} doesn't support local server configuration`);
    }

    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: serverData.serverName,
      productName: serverData.productName,
    });

    const serverConfig: Record<string, unknown> = {};

    serverConfig[stdioConfig.commandField] = 'npx';
    serverConfig[stdioConfig.argsField] = ['-y', '@gleanwork/local-mcp-server'];

    // Add environment variables if present
    if (stdioConfig.envField) {
      const env: Record<string, string> = {};

      if (serverData.instance) {
        if (
          serverData.instance.startsWith('http://') ||
          serverData.instance.startsWith('https://')
        ) {
          env.GLEAN_URL = serverData.instance;
        } else {
          env.GLEAN_INSTANCE = serverData.instance;
        }
      }

      if (serverData.apiToken) {
        env.GLEAN_API_TOKEN = serverData.apiToken;
      }

      if (Object.keys(env).length > 0) {
        serverConfig[stdioConfig.envField] = env;
      }
    }

    if (!includeWrapper) {
      return {
        [serverName]: serverConfig,
      };
    }

    // Codex uses TOML table structure: [mcp_servers.<name>]
    return {
      mcp_servers: {
        [serverName]: serverConfig,
      },
    };
  }

  protected buildRemoteConfig(
    serverData: GleanServerConfig,
    includeWrapper: boolean = true
  ): Record<string, unknown> {
    if (!serverData.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    const { httpConfig } = this.config.configStructure;

    const serverName = buildMcpServerName({
      transport: 'http',
      serverUrl: serverData.serverUrl,
      serverName: serverData.serverName,
      productName: serverData.productName,
    });

    if (httpConfig && this.config.transports.includes('http')) {
      const serverConfig: Record<string, unknown> = {};

      serverConfig[httpConfig.urlField] = serverData.serverUrl;

      // Add bearer token via http_headers if apiToken is provided
      if (serverData.apiToken && httpConfig.headersField) {
        serverConfig[httpConfig.headersField] = {
          Authorization: `Bearer ${serverData.apiToken}`,
        };
      }

      if (!includeWrapper) {
        return {
          [serverName]: serverConfig,
        };
      }

      // Codex uses TOML table structure: [mcp_servers.<name>]
      return {
        mcp_servers: {
          [serverName]: serverConfig,
        },
      };
    } else {
      throw new Error(`Client ${this.config.id} doesn't support remote server configuration`);
    }
  }

  protected buildRemoteCommand(serverData: GleanServerConfig): string {
    const serverUrl = this.getServerUrl(serverData);
    const packageName = this.getConfigureMcpServerPackage(serverData);

    let command = `npx -y ${packageName} remote`;
    command += ` --url ${serverUrl}`;
    command += ` --client codex`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string {
    const packageName = this.getConfigureMcpServerPackage(serverData);

    let command = `npx -y ${packageName} local`;

    if (serverData.instance) {
      // Handle instance URL vs instance name
      if (this.isUrl(serverData.instance)) {
        command += ` --url ${serverData.instance}`;
      } else {
        command += ` --instance ${serverData.instance}`;
      }
    } else {
      command += ` --instance ${this.getInstanceOrPlaceholder(serverData)}`;
    }

    command += ` --client codex`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }

  getNormalizedServersConfig(config: Record<string, unknown>): Record<string, unknown> {
    // Codex uses mcp_servers wrapper
    if (config['mcp_servers']) {
      const mcpServers = config['mcp_servers'] as Record<string, Record<string, unknown>>;
      const normalized: Record<string, unknown> = {};

      for (const [name, codexConfig] of Object.entries(mcpServers)) {
        normalized[name] = {
          command: codexConfig.command,
          args: codexConfig.args,
          env: codexConfig.env,
          url: codexConfig.url,
          headers: codexConfig.http_headers,
        };
      }

      return normalized;
    }

    // Check if it's already flat (no wrapper)
    const normalized: Record<string, unknown> = {};
    for (const [name, codexConfig] of Object.entries(config)) {
      if (typeof codexConfig === 'object' && codexConfig !== null) {
        const cc = codexConfig as Record<string, unknown>;
        normalized[name] = {
          command: cc.command,
          args: cc.args,
          env: cc.env,
          url: cc.url,
          headers: cc.http_headers,
        };
      }
    }

    return normalized;
  }
}
