import { GenericConfigBuilder } from './GenericConfigBuilder.js';
import { GleanServerConfig } from '../types.js';
import { buildMcpServerName } from '../server-name.js';

export class ClaudeCodeConfigBuilder extends GenericConfigBuilder {
  protected buildRemoteCommand(serverData: GleanServerConfig): string {
    if (!serverData.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    const serverName = buildMcpServerName({
      transport: serverData.transport,
      serverUrl: serverData.serverUrl,
      serverName: serverData.serverName,
    });

    let command = `claude mcp add ${serverName} ${serverData.serverUrl} --transport http`;

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
    let command = `npx -y @gleanwork/configure-mcp-server ${mode}`;

    if (mode === 'remote') {
      if (!serverData.serverUrl) {
        throw new Error('Remote configuration requires serverUrl');
      }
      command += ` --url ${serverData.serverUrl}`;
    } else {
      if (!serverData.instance) {
        throw new Error('Local configuration requires instance');
      }
      // Handle instance URL vs instance name
      if (serverData.instance.startsWith('http://') || serverData.instance.startsWith('https://')) {
        command += ` --url ${serverData.instance}`;
      } else {
        command += ` --instance ${serverData.instance}`;
      }
    }

    command += ` --client ${this.config.id}`;

    if (serverData.apiToken) {
      command += ` --token ${serverData.apiToken}`;
    }

    return command;
  }
}
