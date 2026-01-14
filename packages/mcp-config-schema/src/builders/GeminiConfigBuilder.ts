import { GenericConfigBuilder } from './GenericConfigBuilder.js';
import { MCPConnectionOptions } from '../types.js';

/**
 * Config builder for Gemini CLI which has native MCP support via `gemini mcp add`.
 * Added in Gemini CLI v0.1.20 (August 2025).
 */
export class GeminiConfigBuilder extends GenericConfigBuilder {
  protected get hasNativeCliSupport(): boolean {
    return true;
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

    // Gemini CLI format: gemini mcp add [options] <name> <url>
    // Options must come before positional args
    let command = `gemini mcp add --transport http`;

    const headers = this.buildHeaders(options);
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        command += ` -H "${key}: ${value}"`;
      }
    }

    command += ` ${serverName} ${resolvedUrl}`;

    return command;
  }

  protected buildStdioCommand(options: MCPConnectionOptions): string {
    const serverName = this.buildServerName({
      transport: 'stdio',
      serverName: options.serverName,
    });

    // Gemini CLI format: gemini mcp add [options] <name> <command> [args...]
    // Options must come before positional args
    let command = `gemini mcp add`;

    const env = this.getEnvVars(options);
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        command += ` -e ${key}=${value}`;
      }
    }

    command += ` ${serverName} npx -y ${this.serverPackage}`;

    return command;
  }
}
