import { GenericConfigBuilder } from './GenericConfigBuilder.js';
import { GleanServerConfig } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class ClaudeCodeConfigBuilder extends GenericConfigBuilder {
  protected buildRemoteCommand(serverData: GleanServerConfig): string {
    const serverUrl = this.getServerUrl(serverData);

    const serverName = buildMcpServerName({
      transport: serverData.transport,
      serverUrl: serverUrl,
      serverName: serverData.serverName,
    });

    let command = `claude mcp add ${serverName} ${serverUrl} --transport http --scope user`;

    // Claude Code uses --header flag for auth
    if (serverData.apiToken) {
      command += ` --header "Authorization: Bearer ${serverData.apiToken}"`;
    }

    return command;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string {
    // Claude Code supports local servers with stdio transport
    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: serverData.serverName,
    });

    // Claude Code expects: claude mcp add <name> --env KEY=VALUE -- <command> [args...]
    let command = `claude mcp add ${serverName} --scope user`;

    // Add environment variables before the -- separator
    if (serverData.instance) {
      if (this.isUrl(serverData.instance)) {
        command += ` --env GLEAN_URL=${serverData.instance}`;
      } else {
        command += ` --env GLEAN_INSTANCE=${serverData.instance}`;
      }
    }
    if (serverData.apiToken) {
      command += ` --env GLEAN_API_TOKEN=${serverData.apiToken}`;
    }

    // Add the -- separator and then the command
    command += ` -- npx -y ${this.getLocalMcpServerPackage()}`;

    return command;
  }
}
