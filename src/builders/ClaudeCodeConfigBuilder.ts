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

    let command = `claude mcp add ${serverName} ${serverUrl} --transport http`;

    // Claude Code uses --header flag for auth
    if (serverData.apiToken) {
      command += ` --header "Authorization: Bearer ${serverData.apiToken}"`;
    }

    return command;
  }

  protected buildLocalCommand(serverData: GleanServerConfig): string {
    // Claude Code doesn't have a native local command, fall back to configure-mcp-server
    return this.buildConfigureMcpServerCommand(serverData, 'local');
  }

  private buildConfigureMcpServerCommand(
    serverData: GleanServerConfig,
    mode: 'local' | 'remote'
  ): string {
    const packageName = this.getConfigureMcpServerPackage(serverData);

    let command = `npx -y ${packageName} ${mode}`;

    if (mode === 'remote') {
      const serverUrl = this.getServerUrl(serverData);
      command += ` --url ${serverUrl}`;
    } else {
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
    }

    command += ` --client ${this.config.id}`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }
}
