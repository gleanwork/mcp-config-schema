import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { MCPConnectionOptions, CodexMCPConfig, MCPServersRecord } from '../types.js';

function isCodexMCPConfig(config: CodexMCPConfig | MCPServersRecord): config is CodexMCPConfig {
  return typeof config === 'object' && config !== null && 'mcp_servers' in config;
}

/**
 * Config builder for Codex which uses { mcp_servers: {...} } format (snake_case).
 */
export class CodexConfigBuilder extends BaseConfigBuilder<CodexMCPConfig> {
  protected get hasNativeCliSupport(): boolean {
    return true;
  }

  protected buildStdioConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    const { stdioPropertyMapping } = this.config.configStructure;

    if (!stdioPropertyMapping) {
      throw new Error(`Client ${this.config.id} doesn't support stdio server configuration`);
    }

    const serverName = this.buildServerName({
      transport: 'stdio',
      serverName: options.serverName,
    });

    const serverConfig: Record<string, unknown> = {};

    serverConfig[stdioPropertyMapping.commandProperty] = 'npx';
    serverConfig[stdioPropertyMapping.argsProperty] = ['-y', this.serverPackage];

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

  protected buildHttpConfig(
    options: MCPConnectionOptions,
    includeRootObject: boolean = true
  ): Record<string, unknown> {
    if (!options.serverUrl) {
      throw new Error('HTTP transport requires a server URL');
    }

    const { httpPropertyMapping } = this.config.configStructure;

    // Substitute URL template variables
    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    const serverName = this.buildServerName({
      transport: 'http',
      serverUrl: options.serverUrl,
      serverName: options.serverName,
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
      throw new Error(`Client ${this.config.id} doesn't support HTTP server configuration`);
    }
  }

  protected buildHttpCommand(options: MCPConnectionOptions): string {
    if (!options.serverUrl) {
      throw new Error('HTTP transport requires a server URL');
    }

    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    const serverName = this.buildServerName({
      transport: 'http',
      serverUrl: options.serverUrl,
      serverName: options.serverName,
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

  protected buildStdioCommand(options: MCPConnectionOptions): string {
    const serverName = this.buildServerName({
      transport: 'stdio',
      serverName: options.serverName,
    });

    // Format: codex mcp add <server-name> --env VAR1=VALUE1 --env VAR2=VALUE2 -- <stdio server-command>
    let command = `codex mcp add ${serverName}`;

    const env = this.getEnvVars(options);
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        command += ` --env ${key}=${value}`;
      }
    }

    command += ` -- npx -y ${this.serverPackage}`;

    return command;
  }

  /**
   * @deprecated This method is deprecated and will be removed in the next major version.
   *             Consumers should use buildConfiguration() directly and handle the output format
   *             based on the includeRootObject option.
   */
  getNormalizedServersConfig(config: CodexMCPConfig | MCPServersRecord): MCPServersRecord {
    // Use type guard to determine if this is a full wrapped config
    const servers: MCPServersRecord = isCodexMCPConfig(config) ? config.mcp_servers : config;

    // Normalize Codex-specific property names to standard format
    const normalized: MCPServersRecord = {};

    for (const [name, value] of Object.entries(servers)) {
      const codexConfig = value as Record<string, unknown>;
      if (typeof codexConfig === 'object' && codexConfig !== null) {
        normalized[name] = {
          command: codexConfig.command,
          args: codexConfig.args,
          env: codexConfig.env,
          url: codexConfig.url,
          headers: codexConfig.http_headers,
        };
      }
    }

    return normalized;
  }
}
