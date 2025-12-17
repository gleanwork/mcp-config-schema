import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class CodexConfigBuilder extends BaseConfigBuilder {
  protected buildStdioConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    const { stdioPropertyMapping } = this.config.configStructure;

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

    // Add environment variables if present
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

    // Codex uses TOML table structure: [mcp_servers.<name>]
    return {
      mcp_servers: {
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

    const { httpPropertyMapping } = this.config.configStructure;

    const serverName = buildMcpServerName({
      transport: 'http',
      serverUrl: options.serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    if (httpPropertyMapping && this.config.transports.includes('http')) {
      const serverConfig: Record<string, unknown> = {};

      serverConfig[httpPropertyMapping.urlProperty] = options.serverUrl;

      // Add bearer token via http_headers if apiToken is provided
      if (options.apiToken && httpPropertyMapping.headersProperty) {
        serverConfig[httpPropertyMapping.headersProperty] = {
          Authorization: `Bearer ${options.apiToken}`,
        };
      }

      if (!includeRootObject) {
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

  protected buildHttpCommand(options: MCPConnectionOptions): string {
    const serverUrl = this.getServerUrl(options);
    const serverName = buildMcpServerName({
      transport: 'http',
      serverUrl: serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    let command = `codex mcp add --url ${serverUrl}`;

    if (options.apiToken) {
      // For Codex, we pass the bearer token via an environment variable.
      // The user would need to set this env var before running the command.
      // The env var name is configured via the config's envVars.token.
      const tokenEnvVar = this.mcpConfig?.envVars?.token;
      if (tokenEnvVar) {
        command += ` --bearer-token-env-var ${tokenEnvVar}`;
      }
    }

    command += ` ${serverName}`;

    return command;
  }

  protected buildStdioCommand(options: MCPConnectionOptions): string {
    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: options.serverName,
      productName: options.productName,
    });

    // Format: codex mcp add <server-name> --env VAR1=VALUE1 --env VAR2=VALUE2 -- <stdio server-command>
    let command = `codex mcp add ${serverName}`;

    // Add environment variables from config
    const env = this.buildEnvVars(options);
    for (const [key, value] of Object.entries(env)) {
      command += ` --env ${key}=${value}`;
    }

    command += ` -- npx -y ${this.getServerPackage()}`;

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
