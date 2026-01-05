import { GenericConfigBuilder } from './GenericConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';

export class ClaudeCodeConfigBuilder extends GenericConfigBuilder {
  protected buildHttpCommand(options: MCPConnectionOptions): string {
    if (!options.serverUrl) {
      throw new Error('HTTP transport requires a server URL');
    }

    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    const serverName = this.buildServerName({
      transport: options.transport,
      serverUrl: options.serverUrl,
      serverName: options.serverName,
    });

    let command = `claude mcp add ${serverName} ${resolvedUrl} --transport http --scope user`;

    const headers = this.buildHeaders(options);
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        command += ` --header "${key}: ${value}"`;
      }
    }

    return command;
  }

  protected buildStdioCommand(options: MCPConnectionOptions): string {
    const serverName = this.buildServerName({
      transport: 'stdio',
      serverName: options.serverName,
    });

    let command = `claude mcp add ${serverName} --scope user`;

    const env = this.getEnvVars(options);
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        command += ` --env ${key}=${value}`;
      }
    }

    command += ` -- npx -y ${this.serverPackage}`;

    return command;
  }
}
