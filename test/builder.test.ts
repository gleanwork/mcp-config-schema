import { describe, it, expect } from 'vitest';
import {
  MCPConfigRegistry,
  validateGeneratedConfig,
  validateMcpServersConfig,
  validateVsCodeConfig,
  createMCPConfigFactory,
  CLIENT,
  examplePreset,
} from '../src/index';
import type { ClientId, MCPConfig } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration for builder tests
const testConfig: MCPConfig = {
  serverPackage: '@test/mcp-server',
  cliPackage: '@test/configure-mcp',
  envVars: {
    url: 'TEST_URL',
    instance: 'TEST_INSTANCE',
    token: 'TEST_API_TOKEN',
  },
  urlPattern: 'https://[instance]-be.example.com/mcp/[endpoint]',
};

describe('ConfigBuilder', () => {
  // Create configured MCP instance with test config
  const mcp = createMCPConfigFactory(testConfig);

  // Create registry with test config for builder tests
  const registry = new MCPConfigRegistry({ mcpConfig: testConfig });

  describe('buildCommand', () => {
    it('generates VS Code command with remote server', () => {
      const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
      const command = vscodeBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"code --add-mcp '{"name":"mcp_test-server","type":"http","url":"https://example.com/mcp/default","headers":{"Authorization":"Bearer test-token"}}'"`
      );
    });

    it('generates VS Code command with local server', () => {
      const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
      const command = vscodeBuilder.buildCommand({
        transport: 'stdio',
        serverName: 'local-test',
        instance: 'test-instance',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"code --add-mcp '{"name":"mcp_local-test","type":"stdio","command":"npx","args":["-y","@test/mcp-server"],"env":{"TEST_INSTANCE":"test-instance","TEST_API_TOKEN":"test-token"}}'"`
      );
    });

    it('generates Claude Code command with remote server', () => {
      const claudeBuilder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const command = claudeBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"claude mcp add mcp_test-server https://example.com/mcp/default --transport http --scope user --header "Authorization: Bearer test-token""`
      );
    });

    it('generates Claude Code native command for local server', () => {
      const claudeBuilder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const command = claudeBuilder.buildCommand({
        transport: 'stdio',
        instance: 'test-instance',
        serverName: 'local-test',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"claude mcp add mcp_local-test --scope user --env TEST_INSTANCE=test-instance --env TEST_API_TOKEN=test-token -- npx -y @test/mcp-server"`
      );
    });

    it('generates Cursor command with remote server', () => {
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const command = cursorBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"npx -y @test/configure-mcp remote --url https://example.com/mcp/default --client cursor --token test-token"`
      );
    });

    it('generates Cursor command with local server', () => {
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const command = cursorBuilder.buildCommand({
        transport: 'stdio',
        instance: 'test-instance',
        serverName: 'local-test',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"npx -y @test/configure-mcp local --instance test-instance --client cursor --token test-token"`
      );
    });

    it('generates Junie command with remote server', () => {
      const junieBuilder = registry.createBuilder(CLIENT.JUNIE);
      const command = junieBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"npx -y @test/configure-mcp remote --url https://example.com/mcp/default --client junie --token test-token"`
      );
    });

    it('generates Junie command with local server', () => {
      const junieBuilder = registry.createBuilder(CLIENT.JUNIE);
      const command = junieBuilder.buildCommand({
        transport: 'stdio',
        instance: 'test-instance',
        serverName: 'local-test',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"npx -y @test/configure-mcp local --instance test-instance --client junie --token test-token"`
      );
    });

    it('handles URL-style instance for local config', () => {
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const command = cursorBuilder.buildCommand({
        transport: 'stdio',
        instance: 'https://test-instance.example.com',
        serverName: 'local-test',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"npx -y @test/configure-mcp local --url https://test-instance.example.com --client cursor --token test-token"`
      );
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
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"code --add-mcp '{"name":"mcp_test'\\''s-server","type":"http","url":"https://example.com/mcp/default","headers":{"Authorization":"Bearer test-token"}}'"`
      );
    });

    it('uses cliPackageVersion when provided for Cursor', () => {
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const command = cursorBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        apiToken: 'test-token',
        cliPackageVersion: 'beta',
      });

      expect(command).toMatchInlineSnapshot(
        `"npx -y @test/configure-mcp@beta remote --url https://example.com/mcp/default --client cursor --token test-token"`
      );
    });

    it('uses cliPackageVersion for local commands', () => {
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const command = cursorBuilder.buildCommand({
        transport: 'stdio',
        instance: 'test-instance',
        serverName: 'local-test',
        apiToken: 'test-token',
        cliPackageVersion: '1.0.0-beta.3',
      });

      expect(command).toMatchInlineSnapshot(
        `"npx -y @test/configure-mcp@1.0.0-beta.3 local --instance test-instance --client cursor --token test-token"`
      );
    });

    it('Claude Code native command ignores cliPackageVersion for local', () => {
      const claudeBuilder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const command = claudeBuilder.buildCommand({
        transport: 'stdio',
        instance: 'test-instance',
        serverName: 'local-test',
        cliPackageVersion: 'latest',
      });

      // Claude Code uses native command, so cliPackageVersion doesn't apply
      expect(command).toMatchInlineSnapshot(
        `"claude mcp add mcp_local-test --scope user --env TEST_INSTANCE=test-instance -- npx -y @test/mcp-server"`
      );
    });

    it('uses cliPackageVersion for Goose', () => {
      const gooseBuilder = registry.createBuilder(CLIENT.GOOSE);
      const command = gooseBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        cliPackageVersion: '2.0.0',
      });

      expect(command).toMatchInlineSnapshot(
        `"npx -y @test/configure-mcp@2.0.0 remote --url https://example.com/mcp/default --client goose"`
      );
    });

    it('generates Codex command with remote server', () => {
      const codexBuilder = registry.createBuilder(CLIENT.CODEX);
      const command = codexBuilder.buildCommand({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"codex mcp add --url https://example.com/mcp/default --bearer-token-env-var TEST_API_TOKEN mcp_test-server"`
      );
    });

    it('generates Codex command with local server', () => {
      const codexBuilder = registry.createBuilder(CLIENT.CODEX);
      const command = codexBuilder.buildCommand({
        transport: 'stdio',
        instance: 'test-instance',
        serverName: 'local-test',
        apiToken: 'test-token',
      });

      expect(command).toMatchInlineSnapshot(
        `"codex mcp add mcp_local-test --env TEST_INSTANCE=test-instance --env TEST_API_TOKEN=test-token -- npx -y @test/mcp-server"`
      );
    });

    describe('White-label support', () => {
      it('uses custom productName in server names for HTTP transport', () => {
        const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
        const command = vscodeBuilder.buildCommand({
          transport: 'http',
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test-server',
          apiToken: 'test-token',
          productName: 'acme',
        });
        expect(command).toMatchInlineSnapshot(
          `"code --add-mcp '{"name":"acme_test-server","type":"http","url":"https://example.com/mcp/default","headers":{"Authorization":"Bearer test-token"}}'"`
        );
      });

      it('uses custom productName in server names for stdio transport', () => {
        const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
        const command = vscodeBuilder.buildCommand({
          transport: 'stdio',
          serverName: 'local-test',
          instance: 'test-instance',
          apiToken: 'test-token',
          productName: 'corp',
        });
        expect(command).toMatchInlineSnapshot(
          `"code --add-mcp '{"name":"corp_local-test","type":"stdio","command":"npx","args":["-y","@test/mcp-server"],"env":{"TEST_INSTANCE":"test-instance","TEST_API_TOKEN":"test-token"}}'"`
        );
      });

      it('uses custom productName for extracted server names', () => {
        const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
        const config = cursorBuilder.buildConfiguration({
          transport: 'http',
          serverUrl: 'https://example.com/mcp/analytics',
          apiToken: 'test-token',
          productName: 'mycompany',
        });
        expect(Object.keys(config.mcpServers as Record<string, unknown>)[0]).toBe(
          'mycompany_analytics'
        );
      });

      it('defaults to mcp when productName is not provided', () => {
        const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
        const command = vscodeBuilder.buildCommand({
          transport: 'http',
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test-server',
        });
        expect(command).toMatchInlineSnapshot(
          `"code --add-mcp '{"name":"mcp_test-server","type":"http","url":"https://example.com/mcp/default"}'"`
        );
      });
    });

    describe('Edge cases and error handling', () => {
      it('handles placeholder URLs', () => {
        const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
        const command = cursorBuilder.buildCommand({
          transport: 'http',
          serverUrl: 'https://[instance]-be.example.com/mcp/[endpoint]',
          serverName: 'my-server',
        });
        expect(command).toMatchInlineSnapshot(
          `"npx -y @test/configure-mcp remote --url https://[instance]-be.example.com/mcp/[endpoint] --client cursor"`
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
          `"code --add-mcp '{"name":"mcp_test","type":"http","url":"not-a-valid-url"}'"`
        );
      });

      it('handles missing serverUrl for remote', () => {
        const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
        const command = cursorBuilder.buildCommand({
          transport: 'http',
          serverName: 'test',
        });
        expect(command).toMatchInlineSnapshot(
          `"npx -y @test/configure-mcp remote --url https://[instance]-be.example.com/mcp/[endpoint] --client cursor"`
        );
      });

      it('handles missing instance for local', () => {
        const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
        const command = vscodeBuilder.buildCommand({
          transport: 'stdio',
          serverName: 'test',
        });
        expect(command).toMatchInlineSnapshot(
          `"code --add-mcp '{"name":"mcp_test","type":"stdio","command":"npx","args":["-y","@test/mcp-server"],"env":{"TEST_INSTANCE":"[instance]"}}'"`
        );
      });

      it('handles empty string serverUrl', () => {
        const gooseBuilder = registry.createBuilder(CLIENT.GOOSE);
        const command = gooseBuilder.buildCommand({
          transport: 'http',
          serverUrl: '',
          serverName: 'test',
        });
        expect(command).toMatchInlineSnapshot(
          `"npx -y @test/configure-mcp remote --url https://[instance]-be.example.com/mcp/[endpoint] --client goose"`
        );
      });

      it('handles claude-teams-enterprise client', () => {
        // Claude Teams doesn't support local config, but buildCommand should handle it gracefully
        const command = mcp.buildCommand(CLIENT.CLAUDE_TEAMS_ENTERPRISE, {
          transport: 'http',
          serverUrl: 'https://example.com/mcp',
          serverName: 'test',
          apiToken: 'token123',
        });
        // Should return null since Claude Teams doesn't support local config
        expect(command).toBe(null);
      });

      it('handles chatgpt client', () => {
        // ChatGPT doesn't support local config, but buildCommand should not throw
        const command = mcp.buildCommand(CLIENT.CHATGPT, {
          transport: 'http',
          serverUrl: 'https://example.com/mcp',
          serverName: 'test',
        });
        // ChatGPT requires web UI, so command should be null
        expect(command).toBe(null);
      });

      it('handles jetbrains client', () => {
        // JetBrains AI Assistant doesn't support local config, but buildCommand should not throw
        const command = mcp.buildCommand(CLIENT.JETBRAINS, {
          transport: 'http',
          serverUrl: 'https://example.com/mcp',
          serverName: 'test',
        });
        // JetBrains requires UI configuration, so command should be null
        expect(command).toBe(null);
      });

      it('buildCommand wrapper handles errors gracefully', () => {
        // Test with an invalid client ID
        const command = mcp.buildCommand('invalid-client' as ClientId, {
          transport: 'http',
          serverUrl: 'https://example.com/mcp',
        });
        expect(command).toBe(null);
      });

      it('handles all supported clients for remote', () => {
        const clients = [
          CLIENT.CLAUDE_CODE,
          CLIENT.CODEX,
          CLIENT.CURSOR,
          CLIENT.VSCODE,
          CLIENT.WINDSURF,
          CLIENT.GOOSE,
          CLIENT.CLAUDE_DESKTOP,
        ];

        clients.forEach((clientId) => {
          const command = mcp.buildCommand(clientId, {
            transport: 'http',
            serverUrl: 'https://example.com/mcp',
            serverName: 'test',
          });
          expect(command).not.toBe(null);
          expect(command).toContain('example.com/mcp');
        });
      });

      it('handles all supported clients for local', () => {
        const clients = [
          CLIENT.CLAUDE_CODE,
          CLIENT.CODEX,
          CLIENT.CURSOR,
          CLIENT.VSCODE,
          CLIENT.WINDSURF,
          CLIENT.GOOSE,
          CLIENT.CLAUDE_DESKTOP,
        ];

        clients.forEach((clientId) => {
          const command = mcp.buildCommand(clientId, {
            transport: 'stdio',
            instance: 'my-instance',
            serverName: 'test',
          });
          expect(command).not.toBe(null);
          expect(command).toContain('my-instance');
        });
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
      expect(urlObj.searchParams.get('name')).toBe('mcp_test-server');

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
        name: 'mcp_test-server',
        type: 'http',
        url: 'https://example.com/mcp/default',
      });
    });

    it('generates one-click URL for VSCode with local mode', () => {
      const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
      const config = {
        transport: 'stdio' as const,
        serverName: 'local-test',
        instance: 'test-instance',
        apiToken: 'test-token',
      };
      const url = vscodeBuilder.buildOneClickUrl!(config);

      // VSCode uses single colon format (vscode:) not double slash (vscode://)
      expect(url.startsWith('vscode:mcp/install?')).toBe(true);

      // Extract and decode the config
      const queryString = url.replace('vscode:mcp/install?', '');
      const decodedConfig = JSON.parse(decodeURIComponent(queryString));

      expect(decodedConfig).toEqual({
        name: 'mcp_local-test',
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@test/mcp-server'],
        env: {
          TEST_INSTANCE: 'test-instance',
          TEST_API_TOKEN: 'test-token',
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
      serverUrl: 'https://api.example.com/mcp/default',
      serverName: 'my-server',
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
            "mcp_my-server": {
              "type": "http",
              "url": "https://api.example.com/mcp/default",
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
            "mcp_my-server": {
              "type": "http",
              "url": "https://api.example.com/mcp/default",
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
            "mcp_my-server": {
              "args": [
                "-y",
                "mcp-remote",
                "https://api.example.com/mcp/default",
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
            "mcp_my-server": {
              "args": [
                "-y",
                "mcp-remote",
                "https://api.example.com/mcp/default",
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
            "mcp_my-server": {
              "args": [
                "-y",
                "mcp-remote",
                "https://api.example.com/mcp/default",
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
            "mcp_my-server": {
              "httpUrl": "https://api.example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should add bearer token to Gemini CLI HTTP config', () => {
      const builder = registry.createBuilder(CLIENT.GEMINI);
      const result = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://api.example.com/mcp/default',
        apiToken: 'test-token-123',
      });

      const validation = validateGeneratedConfig(result, 'gemini');
      expect(validation.success).toBe(true);

      // Should include headers with Authorization when token is provided
      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "mcp_default": {
              "headers": {
                "Authorization": "Bearer test-token-123",
              },
              "httpUrl": "https://api.example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should generate correct stdio config for Gemini CLI', () => {
      const builder = registry.createBuilder(CLIENT.GEMINI);
      const result = builder.buildConfiguration({
        transport: 'stdio',
        instance: 'test-instance',
        apiToken: 'test-token',
      });

      const validation = validateGeneratedConfig(result, 'gemini');
      expect(validation.success).toBe(true);

      // Gemini stdio uses command, args, env - no type property
      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "mcp_local": {
              "args": [
                "-y",
                "@test/mcp-server",
              ],
              "command": "npx",
              "env": {
                "TEST_API_TOKEN": "test-token",
                "TEST_INSTANCE": "test-instance",
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
          mcp_my-server:
            enabled: true
            name: mcp_my-server
            type: streamable_http
            uri: https://api.example.com/mcp/default
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

    it('should add bearer token to Goose HTTP config', () => {
      const builder = registry.createBuilder(CLIENT.GOOSE);
      const result = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://api.example.com/mcp/default',
        apiToken: 'test-token-123',
      });

      const validation = validateGeneratedConfig(result, 'goose');
      expect(validation.success).toBe(true);

      const yamlString = builder.toString(result);
      expect(yamlString).toContain('Authorization: Bearer test-token-123');
      expect(yamlString).toMatchInlineSnapshot(`
        "extensions:
          mcp_default:
            enabled: true
            name: mcp_default
            type: streamable_http
            uri: https://api.example.com/mcp/default
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
        "[mcp_servers.mcp_my-server]
        url = "https://api.example.com/mcp/default"
        "
      `);
    });

    it('should add bearer token to Codex HTTP config', () => {
      const builder = registry.createBuilder(CLIENT.CODEX);
      const result = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://api.example.com/mcp/default',
        apiToken: 'test-token-123',
      });

      const validation = validateGeneratedConfig(result, 'codex');
      expect(validation.success).toBe(true);

      const tomlString = builder.toString(result);
      expect(tomlString).toContain('Authorization');
      expect(tomlString).toContain('Bearer test-token-123');
      expect(tomlString).toMatchInlineSnapshot(`
        "[mcp_servers.mcp_default]
        url = "https://api.example.com/mcp/default"

        [mcp_servers.mcp_default.http_headers]
        Authorization = "Bearer test-token-123"
        "
      `);
    });

    it('should generate correct TOML config for Codex stdio', () => {
      const builder = registry.createBuilder(CLIENT.CODEX);
      const result = builder.buildConfiguration({
        transport: 'stdio',
        instance: 'test-instance',
        apiToken: 'test-token',
      });

      const validation = validateGeneratedConfig(result, 'codex');
      expect(validation.success).toBe(true);

      const tomlString = builder.toString(result);
      expect(tomlString).toMatchInlineSnapshot(`
        "[mcp_servers.mcp_local]
        command = "npx"
        args = [ "-y", "@test/mcp-server" ]

        [mcp_servers.mcp_local.env]
        TEST_INSTANCE = "test-instance"
        TEST_API_TOKEN = "test-token"
        "
      `);
    });
  });

  describe('Local configurations', () => {
    const localConfig = {
      transport: 'stdio' as const,
      instance: 'my-company',
      apiToken: 'test-token',
    };

    it('should generate correct local config for Claude Code', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const result = builder.buildConfiguration(localConfig);

      const validation = validateGeneratedConfig(result, 'claude-code');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "mcp_local": {
              "args": [
                "-y",
                "@test/mcp-server",
              ],
              "command": "npx",
              "env": {
                "TEST_API_TOKEN": "test-token",
                "TEST_INSTANCE": "my-company",
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
            "mcp_local": {
              "args": [
                "-y",
                "@test/mcp-server",
              ],
              "command": "npx",
              "env": {
                "TEST_API_TOKEN": "test-token",
                "TEST_INSTANCE": "my-company",
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
            "mcp_local": {
              "args": [
                "-y",
                "@test/mcp-server",
              ],
              "command": "npx",
              "env": {
                "TEST_API_TOKEN": "test-token",
                "TEST_INSTANCE": "my-company",
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
            "mcp_local": {
              "args": [
                "-y",
                "@test/mcp-server",
              ],
              "command": "npx",
              "env": {
                "TEST_API_TOKEN": "test-token",
                "TEST_INSTANCE": "my-company",
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
        'Cannot create builder for ChatGPT: ChatGPT is web-based and requires creating custom GPTs through their web UI. No local configuration file support.'
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
          mcp_test:
            enabled: true
            name: mcp_test
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
            "mcp_test": {
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
            "mcp_test": {
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
            "mcp_test": {
              "serverUrl": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should add bearer token to Windsurf HTTP config', () => {
      const builder = registry.createBuilder(CLIENT.WINDSURF);
      const result = builder.buildConfiguration({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        apiToken: 'test-token-123',
      });

      const validation = validateGeneratedConfig(result, 'windsurf');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "mcp_default": {
              "headers": {
                "Authorization": "Bearer test-token-123",
              },
              "serverUrl": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should default server name to "mcp" when not provided', () => {
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
            "mcp_default": {
              "type": "http",
              "url": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should handle URL-style instance for local config', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const config = builder.buildConfiguration({
        transport: 'stdio',
        instance: 'https://my-company.example.com',
        apiToken: 'test-token',
      });

      const parsed = config;

      const validation = validateGeneratedConfig(parsed, 'claude-code');
      expect(validation.success).toBe(true);

      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "mcp_local": {
              "args": [
                "-y",
                "@test/mcp-server",
              ],
              "command": "npx",
              "env": {
                "TEST_API_TOKEN": "test-token",
                "TEST_URL": "https://my-company.example.com",
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

      const serverConfig = generatedConfig.servers.mcp_test;
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

      const serverConfig = generatedConfig.extensions.mcp_test;
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
      expect(generatedConfig.mcpServers.mcp_test).not.toHaveProperty('type');
      expect(generatedConfig.mcpServers.mcp_test).toHaveProperty('serverUrl');
      expect(generatedConfig.mcpServers.mcp_test.serverUrl).toBe('https://example.com/mcp/default');
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
        serverUrl: 'https://api.example.com/mcp/default',
        serverName: 'myproduct_default',
        productName: 'MyProduct',
        includeRootObject: false,
      };

      it('should generate partial HTTP config for Claude Code', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          myproduct_default: {
            type: 'http',
            url: 'https://api.example.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial HTTP config for VS Code', () => {
        const builder = registry.createBuilder(CLIENT.VSCODE);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          myproduct_default: {
            type: 'http',
            url: 'https://api.example.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('servers');
      });

      it('should generate partial bridge config for Claude Desktop', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_DESKTOP);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          myproduct_default: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://api.example.com/mcp/default'],
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial config for Cursor', () => {
        const builder = registry.createBuilder(CLIENT.CURSOR);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          myproduct_default: {
            type: 'http',
            url: 'https://api.example.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial config for Windsurf', () => {
        const builder = registry.createBuilder(CLIENT.WINDSURF);
        const result = builder.buildConfiguration(remoteConfig);

        // Windsurf now supports native HTTP with serverUrl field
        expect(result).toEqual({
          myproduct_default: {
            serverUrl: 'https://api.example.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('type');
        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial YAML config for Goose', () => {
        const builder = registry.createBuilder(CLIENT.GOOSE);
        const result = builder.buildConfiguration(remoteConfig);

        expect(result).toEqual({
          myproduct_default: {
            enabled: true,
            type: 'streamable_http',
            name: 'myproduct_default',
            uri: 'https://api.example.com/mcp/default',
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
        instance: 'my-company',
        apiToken: 'test-token',
        serverName: 'myproduct_local',
        productName: 'MyProduct',
        includeRootObject: false,
      };

      it('should generate partial local config for Claude Code', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const result = builder.buildConfiguration(localConfig);

        expect(result).toEqual({
          myproduct_local: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@test/mcp-server'],
            env: {
              TEST_INSTANCE: 'my-company',
              TEST_API_TOKEN: 'test-token',
            },
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial local config for Cursor', () => {
        const builder = registry.createBuilder(CLIENT.CURSOR);
        const result = builder.buildConfiguration(localConfig);

        expect(result).toEqual({
          myproduct_local: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@test/mcp-server'],
            env: {
              TEST_INSTANCE: 'my-company',
              TEST_API_TOKEN: 'test-token',
            },
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should handle URL-style instance with partial config', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const result = builder.buildConfiguration({
          transport: 'stdio',
          instance: 'https://my-company.example.com',
          apiToken: 'test-token',
          serverName: 'myproduct_custom',
          productName: 'MyProduct',
          includeRootObject: false,
        });

        expect(result).toEqual({
          myproduct_custom: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@test/mcp-server'],
            env: {
              TEST_URL: 'https://my-company.example.com',
              TEST_API_TOKEN: 'test-token',
            },
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial YAML config for Goose local', () => {
        const builder = registry.createBuilder(CLIENT.GOOSE);
        const result = builder.buildConfiguration(localConfig);

        expect(result).toEqual({
          myproduct_local: {
            name: 'myproduct_local',
            cmd: 'npx',
            args: ['-y', '@test/mcp-server'],
            type: 'stdio',
            timeout: 300,
            enabled: true,
            bundled: null,
            description: null,
            env_keys: [],
            envs: {
              TEST_INSTANCE: 'my-company',
              TEST_API_TOKEN: 'test-token',
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
        expect(result.mcpServers).toHaveProperty('mcp_test');
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
        expect(result.mcpServers).toHaveProperty('mcp_test');
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
        expect(result.servers).toHaveProperty('mcp_test');
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
        expect(result.extensions).toHaveProperty('mcp_test');
      });
    });

    describe('Edge cases', () => {
      it('should use default server name "mcp" when not provided with partial config', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          transport: 'http' as const,
          serverUrl: 'https://example.com/mcp/default',
          includeRootObject: false,
        };

        const result = builder.buildConfiguration(config);

        expect(result).toHaveProperty('mcp_default');
        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should handle partial config for local mode with placeholder instance', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          transport: 'stdio' as const,
          includeRootObject: false,
        };

        const result = builder.buildConfiguration(config);

        expect(result).toEqual({
          mcp_local: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@test/mcp-server'],
            env: {
              TEST_INSTANCE: '[instance]',
            },
          },
        });
      });
    });
  });
});
