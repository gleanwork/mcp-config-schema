import { GenericConfigBuilder } from './GenericConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class ClaudeCodeConfigBuilder extends GenericConfigBuilder {
  protected buildRemoteCommand(options: MCPConnectionOptions): string {
    if (!options.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    // Substitute URL template variables
    const resolvedUrl = this.substituteUrlVariables(options.serverUrl, options.urlVariables);

    const serverName = buildMcpServerName({
      transport: options.transport,
      serverUrl: options.serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    let command = `claude mcp add ${serverName} ${resolvedUrl} --transport http --scope user`;

    // Add headers as command arguments
    const headers = this.buildHeaders(options);
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        command += ` --header "${key}: ${value}"`;
      }
    }

    return command;
  }

  protected buildLocalCommand(options: MCPConnectionOptions): string {
    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: options.serverName,
      productName: options.productName,
    });

    let command = `claude mcp add ${serverName} --scope user`;

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
}
