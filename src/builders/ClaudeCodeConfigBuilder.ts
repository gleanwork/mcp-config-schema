import { GenericConfigBuilder } from './GenericConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class ClaudeCodeConfigBuilder extends GenericConfigBuilder {
  protected buildHttpCommand(options: MCPConnectionOptions): string {
    const serverUrl = this.getServerUrl(options);

    const serverName = buildMcpServerName({
      transport: options.transport,
      serverUrl: serverUrl,
      serverName: options.serverName,
      productName: options.productName,
    });

    let command = `claude mcp add ${serverName} ${serverUrl} --transport http --scope user`;

    if (options.apiToken) {
      command += ` --header "Authorization: Bearer ${options.apiToken}"`;
    }

    return command;
  }

  protected buildStdioCommand(options: MCPConnectionOptions): string {
    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: options.serverName,
      productName: options.productName,
    });

    let command = `claude mcp add ${serverName} --scope user`;

    // Add environment variables from config
    const env = this.buildEnvVars(options);
    for (const [key, value] of Object.entries(env)) {
      command += ` --env ${key}=${value}`;
    }

    command += ` -- npx -y ${this.getServerPackage()}`;

    return command;
  }
}
