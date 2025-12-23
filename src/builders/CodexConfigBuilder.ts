import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class CodexConfigBuilder extends BaseConfigBuilder {
  protected buildLocalConfig(
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
    serverConfig[stdioPropertyMapping.argsProperty] = ['-y', this.serverPackage];

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

    // Codex uses TOML table structure: [mcp_servers.<name>]
    return {
      mcp_servers: {
        [serverName]: serverConfig,
      },
    };
  }

  protected buildRemoteConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    if (!options.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    const { httpPropertyMapping } = this.config.configStructure;

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

  protected buildRemoteCommand(options: MCPConnectionOptions): string {
    if (!options.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    // Substitute URL template variables
    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    const serverName = buildMcpServerName({
      transport: 'http',
      serverUrl: options.serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    let command = `codex mcp add --url ${resolvedUrl}`;

    // For Codex CLI, if headers are provided, we need to find the token env var
    // This is a simplified approach - for full control, use configuration files
    const headers = this.buildHeaders(options);
    if (headers && headers['Authorization']) {
      // Find the first env var that might contain the token
      const env = this.getEnvVars(options);
      const tokenEnvVar = env && Object.keys(env).find((k) => k.toLowerCase().includes('token'));
      if (tokenEnvVar) {
        command += ` --bearer-token-env-var ${tokenEnvVar}`;
      }
    }

    command += ` ${serverName}`;

    return command;
  }

  protected buildLocalCommand(options: MCPConnectionOptions): string {
    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: options.serverName,
      productName: options.productName,
    });

    // Format: codex mcp add <server-name> --env VAR1=VALUE1 --env VAR2=VALUE2 -- <stdio server-command>
    let command = `codex mcp add ${serverName}`;

    // Use generic env vars from options
    const env = this.getEnvVars(options);
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        command += ` --env ${key}=${value}`;
      }
    }

    command += ` -- npx -y ${this.serverPackage}`;

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
