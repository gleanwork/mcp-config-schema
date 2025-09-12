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
      productName: serverData.productName,
    });

    let command = `claude mcp add ${serverName} ${serverUrl} --transport http --scope user`;

    if (serverData.apiToken) {
      command += ` --header "Authorization: Bearer ${serverData.apiToken}"`;
    }

    return command;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string {
    const serverName = buildMcpServerName({
      transport: 'stdio',
      serverName: serverData.serverName,
      productName: serverData.productName,
    });

    let command = `claude mcp add ${serverName} --scope user`;

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

    command += ` -- npx -y ${this.getLocalMcpServerPackage()}`;

    return command;
  }
}
