import { describe, it, expect } from 'vitest';
import {
  MCPConfigRegistry,
  validateGeneratedConfig,
  validateMcpServersConfig,
  validateVsCodeConfig,
  CLIENT,
} from '../src/index';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Registry options for Glean (used for stdio transport tests)
// Note: The vendor-neutral API uses serverPackage for stdio configs.
// Environment variables are passed directly via the `env` option in MCPConnectionOptions.
// For non-native CLI clients, consumers can provide a commandBuilder callback.
const GLEAN_REGISTRY_OPTIONS = {
  serverPackage: '@gleanwork/local-mcp-server',
};

// Helper to create Glean environment variables (for tests that need stdio transport)
const createGleanEnv = (instance: string, token?: string) => ({
  GLEAN_INSTANCE: instance,
  ...(token && { GLEAN_API_TOKEN: token }),
});

const createGleanUrlEnv = (url: string, token?: string) => ({
  GLEAN_URL: url,
  ...(token && { GLEAN_API_TOKEN: token }),
});

describe('ConfigBuilder', () => {
  // Registry with Glean config for all tests
  const registry = new MCPConfigRegistry(GLEAN_REGISTRY_OPTIONS);

  describe('buildCommand', () => {
    it('generates VS Code command with remote server', () => {
      const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
      const command = vscodeBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(command).toMatchInlineSnapshot(
        `"code --add-mcp '{"name":"test-server","type":"http","url":"https://example.com/mcp/default","headers":{"Authorization":"Bearer test-token"}}'"`
      );
    });

    it('generates VS Code command with local server', () => {
      const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
      const command = vscodeBuilder.buildCommand({
        transport: 'stdio',
        serverName: 'local-test',
        env: createGleanEnv('test-instance', 'test-token'),
      });

      expect(command).toMatchInlineSnapshot(
        `"code --add-mcp '{"name":"local-test","type":"stdio","command":"npx","args":["-y","@gleanwork/local-mcp-server"],"env":{"GLEAN_INSTANCE":"test-instance","GLEAN_API_TOKEN":"test-token"}}'"`
      );
    });

    it('generates Claude Code command with remote server', () => {
      const claudeBuilder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const command = claudeBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(command).toMatchInlineSnapshot(
        `"claude mcp add test-server https://example.com/mcp/default --transport http --scope user --header "Authorization: Bearer test-token""`
      );
    });

    it('generates Claude Code native command for local server', () => {
      const claudeBuilder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const command = claudeBuilder.buildCommand({
        transport: 'stdio',
        serverName: 'local-test',
        env: createGleanEnv('test-instance', 'test-token'),
      });

      expect(command).toMatchInlineSnapshot(
        `"claude mcp add local-test --scope user --env GLEAN_INSTANCE=test-instance --env GLEAN_API_TOKEN=test-token -- npx -y @gleanwork/local-mcp-server"`
      );
    });

    it('returns null for Cursor without commandBuilder', () => {
      // Cursor has no native CLI, so without a commandBuilder callback, it returns null
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const command = cursorBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      });

      expect(command).toBeNull();
    });

    it('generates Cursor command with local server returns null', () => {
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const command = cursorBuilder.buildCommand({
        transport: 'stdio',
        serverName: 'local-test',
        env: createGleanEnv('test-instance', 'test-token'),
      });

      // Local commands return null as they are CLI-tool specific
      expect(command).toBeNull();
    });

    it('returns null for Junie without commandBuilder', () => {
      // Junie has no native CLI, so without a commandBuilder callback, it returns null
      const junieBuilder = registry.createBuilder(CLIENT.JUNIE);
      const command = junieBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      });

      expect(command).toBeNull();
    });

    it('generates Junie command with local server returns null', () => {
      const junieBuilder = registry.createBuilder(CLIENT.JUNIE);
      const command = junieBuilder.buildCommand({
        transport: 'stdio',
        serverName: 'local-test',
        env: createGleanEnv('test-instance', 'test-token'),
      });

      // Local commands return null as they are CLI-tool specific
      expect(command).toBeNull();
    });

    it('throws for clients without local config support', () => {
      // ChatGPT doesn't support local configuration, so we can't create a builder
      expect(() => registry.createBuilder(CLIENT.CHATGPT)).toThrow(
        'Cannot create builder for ChatGPT'
      );
    });

    it('escapes single quotes in VS Code commands', () => {
      const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
      const command = vscodeBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: "test's-server",
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(command).toMatchInlineSnapshot(
        `"code --add-mcp '{"name":"test'\\''s-server","type":"http","url":"https://example.com/mcp/default","headers":{"Authorization":"Bearer test-token"}}'"`
      );
    });

    it('uses commandBuilder callback for Cursor when provided', () => {
      // Create registry with custom commandBuilder callback
      const registryWithCallback = new MCPConfigRegistry({
        serverPackage: '@gleanwork/local-mcp-server',
        commandBuilder: {
          http: (clientId, options) => {
            return `npx -y @custom/cli install --url ${options.serverUrl} --client ${clientId}`;
          },
        },
      });
      const cursorBuilder = registryWithCallback.createBuilder(CLIENT.CURSOR);
      const command = cursorBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      });

      expect(command).toMatchInlineSnapshot(
        `"npx -y @custom/cli install --url https://example.com/mcp/default --client cursor"`
      );
    });

    it('local commands return null for generic CLI clients', () => {
      // Local commands return null as they are CLI-tool specific
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const command = cursorBuilder.buildCommand({
        transport: 'stdio',
        serverName: 'local-test',
        env: createGleanEnv('test-instance', 'test-token'),
      });

      expect(command).toBeNull();
    });

    it('Claude Code native command ignores configureMcpServerVersion for local', () => {
      const claudeBuilder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const command = claudeBuilder.buildCommand({
        transport: 'stdio',
        serverName: 'local-test',
        env: { GLEAN_INSTANCE: 'test-instance' },
      });

      // Claude Code uses native command, so configureMcpServerVersion doesn't apply
      expect(command).toMatchInlineSnapshot(
        `"claude mcp add local-test --scope user --env GLEAN_INSTANCE=test-instance -- npx -y @gleanwork/local-mcp-server"`
      );
    });

    it('returns null for Goose without commandBuilder', () => {
      // Goose has no native CLI, so without a commandBuilder callback, it returns null
      const gooseBuilder = registry.createBuilder(CLIENT.GOOSE);
      const command = gooseBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      });

      expect(command).toBeNull();
    });

    it('generates Codex command with remote server', () => {
      const codexBuilder = registry.createBuilder(CLIENT.CODEX);
      const command = codexBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        headers: { Authorization: 'Bearer test-token' },
        env: { GLEAN_API_TOKEN: 'test-token' },
      });

      // Codex CLI uses bearer-token-env-var to reference the env var containing the token
      expect(command).toMatchInlineSnapshot(
        `"codex mcp add --url https://example.com/mcp/default --bearer-token-env-var GLEAN_API_TOKEN test-server"`
      );
    });

    it('generates Codex command with local server', () => {
      const codexBuilder = registry.createBuilder(CLIENT.CODEX);
      const command = codexBuilder.buildCommand({
        transport: 'stdio',
        serverName: 'local-test',
        env: createGleanEnv('test-instance', 'test-token'),
      });

      expect(command).toMatchInlineSnapshot(
        `"codex mcp add local-test --env GLEAN_INSTANCE=test-instance --env GLEAN_API_TOKEN=test-token -- npx -y @gleanwork/local-mcp-server"`
      );
    });

    describe('Edge cases and error handling', () => {
      it('handles placeholder URLs with commandBuilder', () => {
        // Create registry with custom commandBuilder callback
        const registryWithCallback = new MCPConfigRegistry({
          serverPackage: '@gleanwork/local-mcp-server',
          commandBuilder: {
            http: (clientId, options) => {
              return `npx -y @custom/cli install --url ${options.serverUrl} --client ${clientId}`;
            },
          },
        });
        const cursorBuilder = registryWithCallback.createBuilder(CLIENT.CURSOR);
        const command = cursorBuilder.buildCommand({
          transport: 'http',
          serverUrl: 'https://[instance]-be.glean.com/mcp/[endpoint]',
          serverName: 'glean',
        });
        expect(command).toMatchInlineSnapshot(
          `"npx -y @custom/cli install --url https://[instance]-be.glean.com/mcp/[endpoint] --client cursor"`
        );
      });

      it('handles invalid URLs', () => {
        const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
        const command = vscodeBuilder.buildCommand({
          transport: 'http',
          serverUrl: 'not-a-valid-url',
          serverName: 'test',
        });
        expect(command).toMatchInlineSnapshot(
          `"code --add-mcp '{"name":"test","type":"http","url":"not-a-valid-url"}'"`
        );
      });

      it('handles missing serverUrl for remote', () => {
        // Without registry options, buildCommand returns null for stdio-based commands
        const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
        const command = cursorBuilder.buildCommand({
          transport: 'http',
          serverName: 'test',
        });
        // Returns null because serverUrl is required for http transport
        expect(command).toBe(null);
      });

      it('handles missing env for local', () => {
        const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
        const command = vscodeBuilder.buildCommand({
          transport: 'stdio',
          serverName: 'test',
        });
        // No env vars when none are provided
        expect(command).toMatchInlineSnapshot(
          `"code --add-mcp '{"name":"test","type":"stdio","command":"npx","args":["-y","@gleanwork/local-mcp-server"]}'"`
        );
      });

      it('handles empty string serverUrl', () => {
        // Empty string serverUrl means no URL provided, so should return null
        const gooseBuilder = registry.createBuilder(CLIENT.GOOSE);
        const command = gooseBuilder.buildCommand({
          transport: 'http',
          serverUrl: '',
          serverName: 'test',
        });
        // Returns null because serverUrl is required for http transport
        expect(command).toBe(null);
      });

    });
  });

  describe('buildOneClickUrl', () => {
    it('generates one-click URL for Cursor with HTTP native', () => {
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const config = {
        transport: 'http' as const,
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      };
      const url = cursorBuilder.buildOneClickUrl!(config);

      // Decode the config parameter to verify it
      const urlObj = new URL(url.replace('cursor://', 'https://'));
      expect(urlObj.hostname).toBe('anysphere.cursor-deeplink');
      expect(urlObj.pathname).toBe('/mcp/install');
      expect(urlObj.searchParams.get('name')).toBe('test-server');

      const encodedConfig = urlObj.searchParams.get('config');
      const decodedConfig = JSON.parse(Buffer.from(encodedConfig!, 'base64').toString());
      expect(decodedConfig).toEqual({
        type: 'http',
        url: 'https://example.com/mcp/default',
      });
    });

    it('generates one-click URL for VSCode with HTTP native', () => {
      const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
      const config = {
        transport: 'http' as const,
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      };
      const url = vscodeBuilder.buildOneClickUrl!(config);

      // VSCode uses single colon format (vscode:) not double slash (vscode://)
      expect(url.startsWith('vscode:mcp/install?')).toBe(true);

      // Extract and decode the config
      const queryString = url.replace('vscode:mcp/install?', '');
      const decodedConfig = JSON.parse(decodeURIComponent(queryString));

      expect(decodedConfig).toEqual({
        name: 'test-server',
        type: 'http',
        url: 'https://example.com/mcp/default',
      });
    });

    it('generates one-click URL for VSCode with local mode', () => {
      const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
      const config = {
        transport: 'stdio' as const,
        serverName: 'local-test',
        env: createGleanEnv('test-instance', 'test-token'),
      };
      const url = vscodeBuilder.buildOneClickUrl!(config);

      // VSCode uses single colon format (vscode:) not double slash (vscode://)
      expect(url.startsWith('vscode:mcp/install?')).toBe(true);

      // Extract and decode the config
      const queryString = url.replace('vscode:mcp/install?', '');
      const decodedConfig = JSON.parse(decodeURIComponent(queryString));

      expect(decodedConfig).toEqual({
        name: 'local-test',
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@gleanwork/local-mcp-server'],
        env: {
          GLEAN_INSTANCE: 'test-instance',
          GLEAN_API_TOKEN: 'test-token',
        },
      });
    });

    it('throws for clients without one-click support', () => {
      const claudeBuilder = registry.createBuilder(CLIENT.CLAUDE_DESKTOP);
      const config = {
        transport: 'http' as const,
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      };
      expect(() => claudeBuilder.buildOneClickUrl!(config)).toThrow(
        'Claude for Desktop does not support one-click installation'
      );
    });
  });

  describe('Remote configurations', () => {
    const remoteConfig = {
      transport: 'http' as const,
      serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
      serverName: 'glean',
    };

    it('should generate correct HTTP config for Claude Code', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const result = builder.buildConfiguration(remoteConfig);

      expect(() => validateMcpServersConfig(result)).not.toThrow();
      const validation = validateGeneratedConfig(result, 'claude-code');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean": {
              "type": "http",
              "url": "https://glean-dev-be.glean.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should generate correct HTTP config for VS Code', () => {
      const builder = registry.createBuilder(CLIENT.VSCODE);
      const result = builder.buildConfiguration(remoteConfig);

      expect(() => validateVsCodeConfig(result)).not.toThrow();

      const validation = validateGeneratedConfig(result, 'vscode');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "servers": {
            "glean": {
              "type": "http",
              "url": "https://glean-dev-be.glean.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should generate correct bridge config for Claude Desktop', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_DESKTOP);
      const result = builder.buildConfiguration(remoteConfig);

      const validation = validateGeneratedConfig(result, 'claude-desktop');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean": {
              "args": [
                "-y",
                "mcp-remote",
                "https://glean-dev-be.glean.com/mcp/default",
              ],
              "command": "npx",
              "type": "stdio",
            },
          },
        }
      `);
    });

    it('should generate correct bridge config for Junie', () => {
      const builder = registry.createBuilder(CLIENT.JUNIE);
      const result = builder.buildConfiguration(remoteConfig);

      const validation = validateGeneratedConfig(result, 'junie');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean": {
              "args": [
                "-y",
                "mcp-remote",
                "https://glean-dev-be.glean.com/mcp/default",
              ],
              "command": "npx",
              "type": "stdio",
            },
          },
        }
      `);
    });

    it('should generate correct bridge config for JetBrains', () => {
      const builder = registry.createBuilder(CLIENT.JETBRAINS);
      const result = builder.buildConfiguration(remoteConfig);

      const validation = validateGeneratedConfig(result, 'jetbrains');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean": {
              "args": [
                "-y",
                "mcp-remote",
                "https://glean-dev-be.glean.com/mcp/default",
              ],
              "command": "npx",
              "type": "stdio",
            },
          },
        }
      `);
    });

    it('should generate correct HTTP config for Gemini CLI', () => {
      const builder = registry.createBuilder(CLIENT.GEMINI);
      const result = builder.buildConfiguration(remoteConfig);

      const validation = validateGeneratedConfig(result, 'gemini');
      expect(validation.success).toBe(true);

      // Gemini uses httpUrl (not url) and no type property
      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean": {
              "httpUrl": "https://glean-dev-be.glean.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should add headers to Gemini CLI HTTP config', () => {
      const builder = registry.createBuilder(CLIENT.GEMINI);
      const result = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
        headers: { Authorization: 'Bearer test-token-123' },
      });

      const validation = validateGeneratedConfig(result, 'gemini');
      expect(validation.success).toBe(true);

      // Should include headers when provided
      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "default": {
              "headers": {
                "Authorization": "Bearer test-token-123",
              },
              "httpUrl": "https://glean-dev-be.glean.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should generate correct stdio config for Gemini CLI', () => {
      const builder = registry.createBuilder(CLIENT.GEMINI);
      const result = builder.buildConfiguration({
        transport: 'stdio',
        env: createGleanEnv('test-instance', 'test-token'),
      });

      const validation = validateGeneratedConfig(result, 'gemini');
      expect(validation.success).toBe(true);

      // Gemini stdio uses command, args, env - no type property
      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "local": {
              "args": [
                "-y",
                "@gleanwork/local-mcp-server",
              ],
              "command": "npx",
              "env": {
                "GLEAN_API_TOKEN": "test-token",
                "GLEAN_INSTANCE": "test-instance",
              },
            },
          },
        }
      `);
    });

    it('should generate correct YAML config for Goose', () => {
      const builder = registry.createBuilder(CLIENT.GOOSE);
      const result = builder.buildConfiguration(remoteConfig);

      const validation = validateGeneratedConfig(result, 'goose');
      expect(validation.success).toBe(true);

      const yamlString = builder.toString(result);
      expect(yamlString).toMatchInlineSnapshot(`
        "extensions:
          glean:
            enabled: true
            name: glean
            type: streamable_http
            uri: https://glean-dev-be.glean.com/mcp/default
            envs: {}
            env_keys: []
            headers: {}
            description: ''
            timeout: 300
            bundled: null
            available_tools: []
        "
      `);
    });

    it('should add headers to Goose HTTP config', () => {
      const builder = registry.createBuilder(CLIENT.GOOSE);
      const result = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
        headers: { Authorization: 'Bearer test-token-123' },
      });

      const validation = validateGeneratedConfig(result, 'goose');
      expect(validation.success).toBe(true);

      const yamlString = builder.toString(result);
      expect(yamlString).toContain('Authorization: Bearer test-token-123');
      expect(yamlString).toMatchInlineSnapshot(`
        "extensions:
          default:
            enabled: true
            name: default
            type: streamable_http
            uri: https://glean-dev-be.glean.com/mcp/default
            envs: {}
            env_keys: []
            headers:
              Authorization: Bearer test-token-123
            description: ''
            timeout: 300
            bundled: null
            available_tools: []
        "
      `);
    });

    it('should generate correct TOML config for Codex HTTP', () => {
      const builder = registry.createBuilder(CLIENT.CODEX);
      const result = builder.buildConfiguration(remoteConfig);

      const validation = validateGeneratedConfig(result, 'codex');
      expect(validation.success).toBe(true);

      const tomlString = builder.toString(result);
      expect(tomlString).toMatchInlineSnapshot(`
        "[mcp_servers.glean]
        url = "https://glean-dev-be.glean.com/mcp/default"
        "
      `);
    });

    it('should add headers to Codex HTTP config', () => {
      const builder = registry.createBuilder(CLIENT.CODEX);
      const result = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
        headers: { Authorization: 'Bearer test-token-123' },
      });

      const validation = validateGeneratedConfig(result, 'codex');
      expect(validation.success).toBe(true);

      const tomlString = builder.toString(result);
      expect(tomlString).toContain('Authorization');
      expect(tomlString).toContain('Bearer test-token-123');
      expect(tomlString).toMatchInlineSnapshot(`
        "[mcp_servers.default]
        url = "https://glean-dev-be.glean.com/mcp/default"

        [mcp_servers.default.http_headers]
        Authorization = "Bearer test-token-123"
        "
      `);
    });

    it('should generate correct TOML config for Codex stdio', () => {
      const builder = registry.createBuilder(CLIENT.CODEX);
      const result = builder.buildConfiguration({
        transport: 'stdio',
        env: createGleanEnv('test-instance', 'test-token'),
      });

      const validation = validateGeneratedConfig(result, 'codex');
      expect(validation.success).toBe(true);

      const tomlString = builder.toString(result);
      expect(tomlString).toMatchInlineSnapshot(`
        "[mcp_servers.local]
        command = "npx"
        args = [ "-y", "@gleanwork/local-mcp-server" ]

        [mcp_servers.local.env]
        GLEAN_INSTANCE = "test-instance"
        GLEAN_API_TOKEN = "test-token"
        "
      `);
    });
  });

  describe('Local configurations', () => {
    const localConfig = {
      transport: 'stdio' as const,
      env: {
        GLEAN_INSTANCE: 'my-company',
        GLEAN_API_TOKEN: 'test-token',
      },
    };

    it('should generate correct local config for Claude Code', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const result = builder.buildConfiguration(localConfig);

      const validation = validateGeneratedConfig(result, 'claude-code');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "local": {
              "args": [
                "-y",
                "@gleanwork/local-mcp-server",
              ],
              "command": "npx",
              "env": {
                "GLEAN_API_TOKEN": "test-token",
                "GLEAN_INSTANCE": "my-company",
              },
              "type": "stdio",
            },
          },
        }
      `);
    });

    it('should generate correct local config for Cursor', () => {
      const builder = registry.createBuilder(CLIENT.CURSOR);
      const result = builder.buildConfiguration(localConfig);

      const validation = validateGeneratedConfig(result, 'cursor');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "local": {
              "args": [
                "-y",
                "@gleanwork/local-mcp-server",
              ],
              "command": "npx",
              "env": {
                "GLEAN_API_TOKEN": "test-token",
                "GLEAN_INSTANCE": "my-company",
              },
              "type": "stdio",
            },
          },
        }
      `);
    });

    it('should generate correct local config for Junie', () => {
      const builder = registry.createBuilder(CLIENT.JUNIE);
      const result = builder.buildConfiguration(localConfig);

      const validation = validateGeneratedConfig(result, 'junie');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "local": {
              "args": [
                "-y",
                "@gleanwork/local-mcp-server",
              ],
              "command": "npx",
              "env": {
                "GLEAN_API_TOKEN": "test-token",
                "GLEAN_INSTANCE": "my-company",
              },
              "type": "stdio",
            },
          },
        }
      `);
    });

    it('should generate correct local config for JetBrains', () => {
      const builder = registry.createBuilder(CLIENT.JETBRAINS);
      const result = builder.buildConfiguration(localConfig);

      const validation = validateGeneratedConfig(result, 'jetbrains');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "local": {
              "args": [
                "-y",
                "@gleanwork/local-mcp-server",
              ],
              "command": "npx",
              "env": {
                "GLEAN_API_TOKEN": "test-token",
                "GLEAN_INSTANCE": "my-company",
              },
              "type": "stdio",
            },
          },
        }
      `);
    });

  });

  describe('path expansion', () => {
    it('should expand $HOME correctly', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const path = builder.getConfigPath();

      expect(path).not.toContain('$HOME');
      expect(path).toContain('/.claude.json');
    });

    it('should expand $HOME correctly for Junie', () => {
      const builder = registry.createBuilder(CLIENT.JUNIE);
      const path = builder.getConfigPath();

      expect(path).not.toContain('$HOME');
      expect(path).toContain('/.junie/mcp.json');
    });

  });

  describe('Unsupported clients', () => {
    it('should throw when trying to create builder for ChatGPT', () => {
      expect(() => registry.createBuilder(CLIENT.CHATGPT)).toThrow(
        'Cannot create builder for ChatGPT: ChatGPT is web-based and requires configuring MCP servers through their web UI. No local configuration file support.'
      );
    });

    it('should throw when trying to create builder for Claude Teams/Enterprise', () => {
      expect(() => registry.createBuilder(CLIENT.CLAUDE_TEAMS_ENTERPRISE)).toThrow(
        'Cannot create builder for Claude for Teams/Enterprise: MCP servers are centrally managed by admins. No local configuration support - servers must be configured at the organization level.'
      );
    });
  });

  describe('Client-specific configurations', () => {
    it('should use correct server key for VS Code', () => {
      const config = registry.getConfig(CLIENT.VSCODE);
      expect(config?.configStructure.serversPropertyName).toBe('servers');
    });

    it('should use correct server key for Goose', () => {
      const config = registry.getConfig(CLIENT.GOOSE);
      expect(config?.configStructure.serversPropertyName).toBe('extensions');
    });

    it('should use correct command field for Goose', () => {
      const config = registry.getConfig(CLIENT.GOOSE);
      expect(config?.configStructure.stdioPropertyMapping?.commandProperty).toBe('cmd');
    });

    it('should not have type field for Windsurf', () => {
      const config = registry.getConfig(CLIENT.WINDSURF);
      expect(config?.configStructure.stdioPropertyMapping?.typeProperty).toBeUndefined();
    });

    it('should handle Claude Desktop with Linux support', () => {
      const config = registry.getConfig(CLIENT.CLAUDE_DESKTOP);
      expect(config?.supportedPlatforms).toEqual(['darwin', 'win32', 'linux']);
      expect(config?.supportedPlatforms).toContain('linux');
    });

    it('should have correct platform-specific paths for Claude Desktop', () => {
      const config = registry.getConfig(CLIENT.CLAUDE_DESKTOP);
      expect(config?.configPath.darwin).toBe(
        '$HOME/Library/Application Support/Claude/claude_desktop_config.json'
      );
      expect(config?.configPath.win32).toBe('%APPDATA%\\Claude\\claude_desktop_config.json');
      expect(config?.configPath.linux).toBe('$HOME/.config/Claude/claude_desktop_config.json');
    });
  });

  describe('Special configuration generation', () => {
    it('should generate correct Goose YAML with special fields', () => {
      const builder = registry.createBuilder(CLIENT.GOOSE);
      const config = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      const validation = validateGeneratedConfig(config, 'goose');
      expect(validation.success).toBe(true);

      const yamlString = builder.toString(config);
      expect(yamlString).toMatchInlineSnapshot(`
        "extensions:
          test:
            enabled: true
            name: test
            type: streamable_http
            uri: https://example.com/mcp/default
            envs: {}
            env_keys: []
            headers: {}
            description: ''
            timeout: 300
            bundled: null
            available_tools: []
        "
      `);
    });

    it('should generate HTTP config for Claude Code', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const config = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      const parsed = config;

      const validation = validateGeneratedConfig(parsed, 'claude-code');
      expect(validation.success).toBe(true);

      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "test": {
              "type": "http",
              "url": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should generate HTTP config for Cursor', () => {
      const builder = registry.createBuilder(CLIENT.CURSOR);
      const config = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      const parsed = config;

      const validation = validateGeneratedConfig(parsed, 'cursor');
      expect(validation.success).toBe(true);

      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "test": {
              "type": "http",
              "url": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should generate HTTP config for Windsurf', () => {
      const builder = registry.createBuilder(CLIENT.WINDSURF);
      const config = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      const parsed = config;

      const validation = validateGeneratedConfig(parsed, 'windsurf');
      expect(validation.success).toBe(true);

      // Windsurf uses serverUrl instead of url and has no type field
      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "test": {
              "serverUrl": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should add headers to Windsurf HTTP config', () => {
      const builder = registry.createBuilder(CLIENT.WINDSURF);
      const result = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        headers: { Authorization: 'Bearer test-token-123' },
      });

      const validation = validateGeneratedConfig(result, 'windsurf');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "default": {
              "headers": {
                "Authorization": "Bearer test-token-123",
              },
              "serverUrl": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should extract server name from URL when not provided', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const config = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
      });

      const parsed = config;

      const validation = validateGeneratedConfig(parsed, 'claude-code');
      expect(validation.success).toBe(true);

      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "default": {
              "type": "http",
              "url": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should handle URL-style env for local config', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const config = builder.buildConfiguration({
        transport: 'stdio',
        env: createGleanUrlEnv('https://my-company.glean.com', 'test-token'),
      });

      const parsed = config;

      const validation = validateGeneratedConfig(parsed, 'claude-code');
      expect(validation.success).toBe(true);

      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "local": {
              "args": [
                "-y",
                "@gleanwork/local-mcp-server",
              ],
              "command": "npx",
              "env": {
                "GLEAN_API_TOKEN": "test-token",
                "GLEAN_URL": "https://my-company.glean.com",
              },
              "type": "stdio",
            },
          },
        }
      `);
    });
  });

  describe('SSOT Verification', () => {
    it('should use JSON configs as Single Source of Truth', () => {
      const configPath = path.join(__dirname, '../configs/claude-code.json');
      const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      const registryConfig = registry.getConfig(CLIENT.CLAUDE_CODE);

      expect(registryConfig).toEqual(jsonConfig);
    });

    it('should generate config based on JSON file structure', () => {
      const configPath = path.join(__dirname, '../configs/vscode.json');
      const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      const builder = registry.createBuilder(CLIENT.VSCODE);
      const generatedConfig = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      expect(Object.keys(generatedConfig)[0]).toBe(jsonConfig.configStructure.serversPropertyName);
      expect(generatedConfig).toHaveProperty('servers'); // VS Code uses 'servers'

      const serverConfig = generatedConfig.servers.test;
      expect(serverConfig).toHaveProperty(jsonConfig.configStructure.httpPropertyMapping.typeProperty);
      expect(serverConfig).toHaveProperty(jsonConfig.configStructure.httpPropertyMapping.urlProperty);
    });

    it('should use Goose YAML structure from JSON config', () => {
      const configPath = path.join(__dirname, '../configs/goose.json');
      const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      const builder = registry.createBuilder(CLIENT.GOOSE);
      const generatedConfig = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      expect(Object.keys(generatedConfig)[0]).toBe(jsonConfig.configStructure.serversPropertyName);
      expect(generatedConfig).toHaveProperty('extensions');

      const serverConfig = generatedConfig.extensions.test;
      expect(serverConfig).toHaveProperty(jsonConfig.configStructure.httpPropertyMapping.urlProperty);
      expect(serverConfig.uri).toBe('https://example.com/mcp/default');
      expect(serverConfig.type).toBe('streamable_http');
    });

    it('should respect client-specific field presence from JSON', () => {
      const windsurfConfig = registry.getConfig(CLIENT.WINDSURF);
      expect(windsurfConfig?.configStructure.stdioPropertyMapping?.typeProperty).toBeUndefined();

      const builder = registry.createBuilder(CLIENT.WINDSURF);
      const generatedConfig = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      // Windsurf now supports native HTTP with serverUrl field
      expect(generatedConfig.mcpServers.test).not.toHaveProperty('type');
      expect(generatedConfig.mcpServers.test).toHaveProperty('serverUrl');
      expect(generatedConfig.mcpServers.test.serverUrl).toBe('https://example.com/mcp/default');
    });

    it('should use platform-specific paths from JSON config', () => {
      const cursorConfig = registry.getConfig(CLIENT.CURSOR);

      expect(cursorConfig?.configPath.darwin).toBe('$HOME/.cursor/mcp.json');
      expect(cursorConfig?.configPath.linux).toBe('$HOME/.cursor/mcp.json');
      expect(cursorConfig?.configPath.win32).toBe('%USERPROFILE%\\.cursor\\mcp.json');

      const configPath = path.join(__dirname, '../configs/cursor.json');
      const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(cursorConfig?.configPath).toEqual(jsonConfig.configPath);
    });

    it('should fail for unsupported clients defined in JSON', () => {
      const chatgptConfig = registry.getConfig(CLIENT.CHATGPT);
      expect(chatgptConfig?.userConfigurable).toBe(false);

      expect(() => registry.createBuilder(CLIENT.CHATGPT)).toThrow();
    });

    it('should handle all clients consistently based on their JSON configs', () => {
      const allConfigs = registry.getAllConfigs();

      for (const config of allConfigs) {
        const configPath = path.join(__dirname, `../configs/${config.id}.json`);
        const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        expect(config).toEqual(jsonConfig);

        if (config.userConfigurable === true) {
          expect(() => registry.createBuilder(config.id)).not.toThrow();
        } else {
          expect(() => registry.createBuilder(config.id)).toThrow();
        }
      }
    });
  });

  describe('Partial Configuration (includeRootObject: false)', () => {
    describe('Remote configurations', () => {
      const remoteConfig = {
        transport: 'http' as const,
        serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
        serverName: 'default',
        includeRootObject: false,
      };

      it('should generate partial HTTP config for Claude Code', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          default: {
            type: 'http',
            url: 'https://glean-dev-be.glean.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial HTTP config for VS Code', () => {
        const builder = registry.createBuilder(CLIENT.VSCODE);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          default: {
            type: 'http',
            url: 'https://glean-dev-be.glean.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('servers');
      });

      it('should generate partial bridge config for Claude Desktop', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_DESKTOP);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          default: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://glean-dev-be.glean.com/mcp/default'],
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial config for Cursor', () => {
        const builder = registry.createBuilder(CLIENT.CURSOR);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          default: {
            type: 'http',
            url: 'https://glean-dev-be.glean.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial config for Windsurf', () => {
        const builder = registry.createBuilder(CLIENT.WINDSURF);
        const result = builder.buildConfiguration(remoteConfig);

        // Windsurf now supports native HTTP with serverUrl field
        expect(result).toEqual({
          default: {
            serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('type');
        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial YAML config for Goose', () => {
        const builder = registry.createBuilder(CLIENT.GOOSE);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          default: {
            enabled: true,
            type: 'streamable_http',
            name: 'default',
            uri: 'https://glean-dev-be.glean.com/mcp/default',
            envs: {},
            env_keys: [],
            headers: {},
            description: '',
            timeout: 300,
            bundled: null,
            available_tools: [],
          },
        });

        expect(result).not.toHaveProperty('extensions');
      });
    });

    describe('Local configurations', () => {
      const localConfig = {
        transport: 'stdio' as const,
        serverName: 'local',
        includeRootObject: false,
        env: {
          GLEAN_INSTANCE: 'my-company',
          GLEAN_API_TOKEN: 'test-token',
        },
      };

      it('should generate partial local config for Claude Code', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const result = builder.buildConfiguration(localConfig);

        expect(result).toEqual({
          local: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@gleanwork/local-mcp-server'],
            env: {
              GLEAN_INSTANCE: 'my-company',
              GLEAN_API_TOKEN: 'test-token',
            },
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial local config for Cursor', () => {
        const builder = registry.createBuilder(CLIENT.CURSOR);
        const result = builder.buildConfiguration(localConfig);

        expect(result).toEqual({
          local: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@gleanwork/local-mcp-server'],
            env: {
              GLEAN_INSTANCE: 'my-company',
              GLEAN_API_TOKEN: 'test-token',
            },
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should handle URL-style env with partial config', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const result = builder.buildConfiguration({
          transport: 'stdio',
          serverName: 'custom',
          includeRootObject: false,
          env: createGleanUrlEnv('https://my-company.glean.com', 'test-token'),
        });

        expect(result).toEqual({
          custom: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@gleanwork/local-mcp-server'],
            env: {
              GLEAN_URL: 'https://my-company.glean.com',
              GLEAN_API_TOKEN: 'test-token',
            },
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial YAML config for Goose local', () => {
        const builder = registry.createBuilder(CLIENT.GOOSE);
        const result = builder.buildConfiguration(localConfig);

        expect(result).toEqual({
          local: {
            name: 'local',
            cmd: 'npx',
            args: ['-y', '@gleanwork/local-mcp-server'],
            type: 'stdio',
            timeout: 300,
            enabled: true,
            bundled: null,
            description: null,
            env_keys: [],
            envs: {
              GLEAN_INSTANCE: 'my-company',
              GLEAN_API_TOKEN: 'test-token',
            },
          },
        });

        expect(result).not.toHaveProperty('extensions');
      });
    });

    describe('Backward compatibility', () => {
      it('should default to including wrapper when includeRootObject is not specified', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          transport: 'http' as const,
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        };

        const result = builder.buildConfiguration(config);

        expect(result).toHaveProperty('mcpServers');
        expect(result.mcpServers).toHaveProperty('test');
      });

      it('should include wrapper when includeRootObject is explicitly true', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          transport: 'http' as const,
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
          includeRootObject: true,
        };

        const result = builder.buildConfiguration(config);

        expect(result).toHaveProperty('mcpServers');
        expect(result.mcpServers).toHaveProperty('test');
      });

      it('should maintain backward compatibility for VS Code', () => {
        const builder = registry.createBuilder(CLIENT.VSCODE);
        const config = {
          transport: 'http' as const,
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        };

        const result = builder.buildConfiguration(config);

        expect(result).toHaveProperty('servers');
        expect(result.servers).toHaveProperty('test');
      });

      it('should maintain backward compatibility for Goose', () => {
        const builder = registry.createBuilder(CLIENT.GOOSE);
        const config = {
          transport: 'http' as const,
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        };

        const result = builder.buildConfiguration(config);

        expect(result).toHaveProperty('extensions');
        expect(result.extensions).toHaveProperty('test');
      });
    });

    describe('Edge cases', () => {
      it('should extract server name from URL when not provided with partial config', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          transport: 'http' as const,
          serverUrl: 'https://example.com/mcp/default',
          includeRootObject: false,
        };

        const result = builder.buildConfiguration(config);

        expect(result).toHaveProperty('default');
        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should handle partial config for local mode without env vars', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          transport: 'stdio' as const,
          includeRootObject: false,
        };

        const result = builder.buildConfiguration(config);

        expect(result).toEqual({
          local: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@gleanwork/local-mcp-server'],
          },
        });

        expect(result.local).not.toHaveProperty('env');
      });
    });
  });
});
