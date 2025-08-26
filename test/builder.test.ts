import { describe, it, expect } from 'vitest';
import {
  MCPConfigRegistry,
  validateGeneratedConfig,
  validateMcpServersConfig,
  validateVsCodeConfig,
  CLIENT,
  CLIENT_DISPLAY_NAME,
} from '../src/index';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ConfigBuilder', () => {
  const registry = new MCPConfigRegistry();

  describe('buildOneClickUrl', () => {
    it('generates one-click URL for Cursor with HTTP native', () => {
      const cursorBuilder = registry.createBuilder(CLIENT.CURSOR);
      const config = {
        mode: 'remote' as const,
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      };
      const url = cursorBuilder.buildOneClickUrl(config);

      // Decode the config parameter to verify it
      const urlObj = new URL(url.replace('cursor://', 'https://'));
      expect(urlObj.hostname).toBe('anysphere.cursor-deeplink');
      expect(urlObj.pathname).toBe('/mcp/install');
      expect(urlObj.searchParams.get('name')).toBe('glean_test-server');

      const encodedConfig = urlObj.searchParams.get('config');
      const decodedConfig = JSON.parse(Buffer.from(encodedConfig!, 'base64').toString());
      expect(decodedConfig).toEqual({
        url: 'https://example.com/mcp/default',
      });
    });

    it('throws for VSCode since one-click is not configured', () => {
      const vscodeBuilder = registry.createBuilder(CLIENT.VSCODE);
      const config = {
        mode: 'remote' as const,
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      };
      expect(() => vscodeBuilder.buildOneClickUrl(config)).toThrow(
        'Visual Studio Code does not support one-click installation'
      );
    });

    it('throws for clients without one-click support', () => {
      const claudeBuilder = registry.createBuilder(CLIENT.CLAUDE_DESKTOP);
      const config = {
        mode: 'remote' as const,
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server',
      };
      expect(() => claudeBuilder.buildOneClickUrl(config)).toThrow(
        'Claude for Desktop does not support one-click installation'
      );
    });
  });

  describe('Remote configurations', () => {
    const remoteConfig = {
      mode: 'remote' as const,
      serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
      serverName: 'glean',
    };

    it('should generate correct HTTP config for Claude Code', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const result = JSON.parse(builder.buildConfiguration(remoteConfig));

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
      const result = JSON.parse(builder.buildConfiguration(remoteConfig));

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
      const result = JSON.parse(builder.buildConfiguration(remoteConfig));

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

    it('should generate correct YAML config for Goose', () => {
      const builder = registry.createBuilder(CLIENT.GOOSE);
      const result = builder.buildConfiguration(remoteConfig);

      const parsed = yaml.load(result);
      const validation = validateGeneratedConfig(parsed, 'goose');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
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
  });

  describe('Local configurations', () => {
    const localConfig = {
      mode: 'local' as const,
      instance: 'my-company',
      apiToken: 'test-token',
    };

    it('should generate correct local config for Claude Code', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const result = JSON.parse(builder.buildConfiguration(localConfig));

      const validation = validateGeneratedConfig(result, 'claude-code');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean_local": {
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
      const result = JSON.parse(builder.buildConfiguration(localConfig));

      const validation = validateGeneratedConfig(result, 'cursor');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean_local": {
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
      expect(config?.configStructure.serverKey).toBe('servers');
    });

    it('should use correct server key for Goose', () => {
      const config = registry.getConfig(CLIENT.GOOSE);
      expect(config?.configStructure.serverKey).toBe('extensions');
    });

    it('should use correct command field for Goose', () => {
      const config = registry.getConfig(CLIENT.GOOSE);
      expect(config?.configStructure.stdioConfig?.commandField).toBe('cmd');
    });

    it('should not have type field for Windsurf', () => {
      const config = registry.getConfig(CLIENT.WINDSURF);
      expect(config?.configStructure.stdioConfig?.typeField).toBeUndefined();
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
        mode: 'remote',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      const yaml = require('js-yaml');
      const parsed = yaml.load(config);
      const validation = validateGeneratedConfig(parsed, 'goose');
      expect(validation.success).toBe(true);

      expect(config).toMatchInlineSnapshot(`
        "extensions:
          glean_test:
            enabled: true
            name: glean_test
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
        mode: 'remote',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      const parsed = JSON.parse(config);

      const validation = validateGeneratedConfig(parsed, 'claude-code');
      expect(validation.success).toBe(true);

      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean_test": {
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
        mode: 'remote',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      const parsed = JSON.parse(config);

      const validation = validateGeneratedConfig(parsed, 'cursor');
      expect(validation.success).toBe(true);

      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean_test": {
              "type": "http",
              "url": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should default server name to "glean" when not provided', () => {
      const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
      const config = builder.buildConfiguration({
        mode: 'remote',
        serverUrl: 'https://example.com/mcp/default',
      });

      const parsed = JSON.parse(config);

      const validation = validateGeneratedConfig(parsed, 'claude-code');
      expect(validation.success).toBe(true);

      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean_default": {
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
        mode: 'local',
        instance: 'https://my-company.glean.com',
        apiToken: 'test-token',
      });

      const parsed = JSON.parse(config);

      const validation = validateGeneratedConfig(parsed, 'claude-code');
      expect(validation.success).toBe(true);

      expect(parsed).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean_local": {
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
      const generatedConfig = JSON.parse(
        builder.buildConfiguration({
          mode: 'remote',
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        })
      );

      expect(Object.keys(generatedConfig)[0]).toBe(jsonConfig.configStructure.serverKey);
      expect(generatedConfig).toHaveProperty('servers'); // VS Code uses 'servers'

      const serverConfig = generatedConfig.servers.glean_test;
      expect(serverConfig).toHaveProperty(jsonConfig.configStructure.httpConfig.typeField);
      expect(serverConfig).toHaveProperty(jsonConfig.configStructure.httpConfig.urlField);
    });

    it('should use Goose YAML structure from JSON config', () => {
      const configPath = path.join(__dirname, '../configs/goose.json');
      const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      const builder = registry.createBuilder(CLIENT.GOOSE);
      const generatedYaml = builder.buildConfiguration({
        mode: 'remote',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      const yaml = require('js-yaml');
      const generatedConfig = yaml.load(generatedYaml);

      expect(Object.keys(generatedConfig)[0]).toBe(jsonConfig.configStructure.serverKey);
      expect(generatedConfig).toHaveProperty('extensions');

      const serverConfig = generatedConfig.extensions.glean_test;
      expect(serverConfig).toHaveProperty(jsonConfig.configStructure.httpConfig.urlField);
      expect(serverConfig.uri).toBe('https://example.com/mcp/default');
      expect(serverConfig.type).toBe('streamable_http');
    });

    it('should respect client-specific field presence from JSON', () => {
      const windsurfConfig = registry.getConfig(CLIENT.WINDSURF);
      expect(windsurfConfig?.configStructure.stdioConfig?.typeField).toBeUndefined();

      const builder = registry.createBuilder(CLIENT.WINDSURF);
      const generatedConfig = JSON.parse(
        builder.buildConfiguration({
          mode: 'remote',
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        })
      );

      expect(generatedConfig.mcpServers.glean_test).not.toHaveProperty('type');
      expect(generatedConfig.mcpServers.glean_test).toHaveProperty('command');
      expect(generatedConfig.mcpServers.glean_test).toHaveProperty('args');
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
      expect(chatgptConfig?.localConfigSupport).toBe('none');

      expect(() => registry.createBuilder(CLIENT.CHATGPT)).toThrow();
    });

    it('should handle all clients consistently based on their JSON configs', () => {
      const allConfigs = registry.getAllConfigs();

      for (const config of allConfigs) {
        const configPath = path.join(__dirname, `../configs/${config.id}.json`);
        const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        expect(config).toEqual(jsonConfig);

        if (config.localConfigSupport === 'full') {
          expect(() => registry.createBuilder(config.id)).not.toThrow();
        } else {
          expect(() => registry.createBuilder(config.id)).toThrow();
        }
      }
    });
  });

  describe('Partial Configuration (includeWrapper: false)', () => {
    describe('Remote configurations', () => {
      const remoteConfig = {
        mode: 'remote' as const,
        serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
        serverName: 'glean_default',
        includeWrapper: false,
      };

      it('should generate partial HTTP config for Claude Code', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const result = JSON.parse(builder.buildConfiguration(remoteConfig));

        expect(result).toEqual({
          glean_default: {
            type: 'http',
            url: 'https://glean-dev-be.glean.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial HTTP config for VS Code', () => {
        const builder = registry.createBuilder(CLIENT.VSCODE);
        const result = JSON.parse(builder.buildConfiguration(remoteConfig));

        expect(result).toEqual({
          glean_default: {
            type: 'http',
            url: 'https://glean-dev-be.glean.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('servers');
      });

      it('should generate partial bridge config for Claude Desktop', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_DESKTOP);
        const result = JSON.parse(builder.buildConfiguration(remoteConfig));

        expect(result).toEqual({
          glean_default: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://glean-dev-be.glean.com/mcp/default'],
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial config for Cursor', () => {
        const builder = registry.createBuilder(CLIENT.CURSOR);
        const result = JSON.parse(builder.buildConfiguration(remoteConfig));

        expect(result).toEqual({
          glean_default: {
            type: 'http',
            url: 'https://glean-dev-be.glean.com/mcp/default',
          },
        });

        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial config for Windsurf', () => {
        const builder = registry.createBuilder(CLIENT.WINDSURF);
        const result = JSON.parse(builder.buildConfiguration(remoteConfig));

        expect(result).toEqual({
          glean_default: {
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://glean-dev-be.glean.com/mcp/default'],
          },
        });

        expect(result).not.toHaveProperty('type');
        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should generate partial YAML config for Goose', () => {
        const builder = registry.createBuilder(CLIENT.GOOSE);
        const yamlResult = builder.buildConfiguration(remoteConfig);
        const result = yaml.load(yamlResult) as Record<string, unknown>;

        expect(result).toEqual({
          glean_default: {
            enabled: true,
            type: 'streamable_http',
            name: 'glean_default',
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
        mode: 'local' as const,
        instance: 'my-company',
        apiToken: 'test-token',
        serverName: 'glean_local',
        includeWrapper: false,
      };

      it('should generate partial local config for Claude Code', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const result = JSON.parse(builder.buildConfiguration(localConfig));

        expect(result).toEqual({
          glean_local: {
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
        const result = JSON.parse(builder.buildConfiguration(localConfig));

        expect(result).toEqual({
          glean_local: {
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

      it('should handle URL-style instance with partial config', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const result = JSON.parse(
          builder.buildConfiguration({
            mode: 'local',
            instance: 'https://my-company.glean.com',
            apiToken: 'test-token',
            serverName: 'glean_custom',
            includeWrapper: false,
          })
        );

        expect(result).toEqual({
          glean_custom: {
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
        const yamlResult = builder.buildConfiguration(localConfig);
        const result = yaml.load(yamlResult) as Record<string, unknown>;

        expect(result).toEqual({
          glean_local: {
            name: 'glean_local',
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
      it('should default to including wrapper when includeWrapper is not specified', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          mode: 'remote' as const,
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        };

        const result = JSON.parse(builder.buildConfiguration(config));

        expect(result).toHaveProperty('mcpServers');
        expect(result.mcpServers).toHaveProperty('glean_test');
      });

      it('should include wrapper when includeWrapper is explicitly true', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          mode: 'remote' as const,
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
          includeWrapper: true,
        };

        const result = JSON.parse(builder.buildConfiguration(config));

        expect(result).toHaveProperty('mcpServers');
        expect(result.mcpServers).toHaveProperty('glean_test');
      });

      it('should maintain backward compatibility for VS Code', () => {
        const builder = registry.createBuilder(CLIENT.VSCODE);
        const config = {
          mode: 'remote' as const,
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        };

        const result = JSON.parse(builder.buildConfiguration(config));

        expect(result).toHaveProperty('servers');
        expect(result.servers).toHaveProperty('glean_test');
      });

      it('should maintain backward compatibility for Goose', () => {
        const builder = registry.createBuilder(CLIENT.GOOSE);
        const config = {
          mode: 'remote' as const,
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        };

        const yamlResult = builder.buildConfiguration(config);
        const result = yaml.load(yamlResult) as Record<string, unknown>;

        expect(result).toHaveProperty('extensions');
        expect(result.extensions).toHaveProperty('glean_test');
      });
    });

    describe('Edge cases', () => {
      it('should use default server name "glean" when not provided with partial config', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          mode: 'remote' as const,
          serverUrl: 'https://example.com/mcp/default',
          includeWrapper: false,
        };

        const result = JSON.parse(builder.buildConfiguration(config));

        expect(result).toHaveProperty('glean_default');
        expect(result).not.toHaveProperty('mcpServers');
      });

      it('should handle partial config for local mode without env vars', () => {
        const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);
        const config = {
          mode: 'local' as const,
          includeWrapper: false,
        };

        const result = JSON.parse(builder.buildConfiguration(config));

        expect(result).toEqual({
          glean_local: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@gleanwork/local-mcp-server'],
          },
        });

        expect(result.glean_local).not.toHaveProperty('env');
      });
    });
  });
});
