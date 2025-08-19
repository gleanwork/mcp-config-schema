import { describe, it, expect } from 'vitest';
import {
  MCPConfigRegistry,
  validateGeneratedConfig,
  validateMcpServersConfig,
  validateVsCodeConfig,
} from '../src/index';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ConfigBuilder', () => {
  const registry = new MCPConfigRegistry();

  describe('buildOneClickUrl', () => {
    it('generates one-click URL for Cursor with remote config', () => {
      const cursorBuilder = registry.createBuilder('cursor');
      const config = {
        mode: 'remote' as const,
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server'
      };
      const url = cursorBuilder.buildOneClickUrl(config);
      
      // Decode the config parameter to verify it
      const urlObj = new URL(url.replace('cursor://', 'https://'));
      expect(urlObj.hostname).toBe('anysphere.cursor-deeplink');
      expect(urlObj.pathname).toBe('/mcp/install');
      expect(urlObj.searchParams.get('name')).toBe('test-server');
      
      const encodedConfig = urlObj.searchParams.get('config');
      const decodedConfig = JSON.parse(Buffer.from(encodedConfig!, 'base64').toString());
      expect(decodedConfig).toEqual({
        command: 'npx',
        args: ['-y', 'mcp-remote', 'https://example.com/mcp/default']
      });
    });

    it('throws for VSCode since one-click is not configured', () => {
      const vscodeBuilder = registry.createBuilder('vscode');
      const config = {
        mode: 'remote' as const,
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server'
      };
      expect(() => vscodeBuilder.buildOneClickUrl(config))
        .toThrow('Visual Studio Code does not support one-click installation');
    });

    it('throws for clients without one-click support', () => {
      const claudeBuilder = registry.createBuilder('claude-desktop');
      const config = {
        mode: 'remote' as const,
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test-server'
      };
      expect(() => claudeBuilder.buildOneClickUrl(config))
        .toThrow('Claude for Desktop does not support one-click installation');
    });
  });

  describe('Remote configurations', () => {
    const remoteConfig = {
      mode: 'remote' as const,
      serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
      serverName: 'glean',
    };

    it('should generate correct HTTP config for Claude Code', () => {
      const builder = registry.createBuilder('claude-code');
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
      const builder = registry.createBuilder('vscode');
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
      const builder = registry.createBuilder('claude-desktop');
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
      const builder = registry.createBuilder('goose');
      const result = builder.buildConfiguration(remoteConfig);

      const yaml = require('js-yaml');
      const parsed = yaml.load(result);
      const validation = validateGeneratedConfig(parsed, 'goose');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        "extensions:
          glean:
            name: glean
            cmd: npx
            args:
              - '-y'
              - mcp-remote
              - https://glean-dev-be.glean.com/mcp/default
            type: stdio
            timeout: 300
            enabled: true
            bundled: null
            description: null
            env_keys: []
            envs: {}
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
      const builder = registry.createBuilder('claude-code');
      const result = JSON.parse(builder.buildConfiguration(localConfig));

      const validation = validateGeneratedConfig(result, 'claude-code');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean": {
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
      const builder = registry.createBuilder('cursor');
      const result = JSON.parse(builder.buildConfiguration(localConfig));

      const validation = validateGeneratedConfig(result, 'cursor');
      expect(validation.success).toBe(true);

      expect(result).toMatchInlineSnapshot(`
        {
          "mcpServers": {
            "glean": {
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
      const builder = registry.createBuilder('claude-code');
      const path = builder.getConfigPath();

      expect(path).not.toContain('$HOME');
      expect(path).toContain('/.claude.json');
    });
  });

  describe('Unsupported clients', () => {
    it('should throw when trying to create builder for ChatGPT', () => {
      expect(() => registry.createBuilder('chatgpt')).toThrow(
        'Cannot create builder for ChatGPT: ChatGPT is web-based and requires creating custom GPTs through their web UI. No local configuration file support.'
      );
    });

    it('should throw when trying to create builder for Claude Desktop Org', () => {
      expect(() => registry.createBuilder('claude-desktop-org')).toThrow(
        'Cannot create builder for Claude for Desktop - Organization Connectors: Organization connectors are centrally managed by admins. No local configuration support - connectors must be configured at the organization level.'
      );
    });
  });

  describe('Client-specific configurations', () => {
    it('should use correct server key for VS Code', () => {
      const config = registry.getConfig('vscode');
      expect(config?.configStructure.serverKey).toBe('servers');
    });

    it('should use correct server key for Goose', () => {
      const config = registry.getConfig('goose');
      expect(config?.configStructure.serverKey).toBe('extensions');
    });

    it('should use correct command field for Goose', () => {
      const config = registry.getConfig('goose');
      expect(config?.configStructure.stdioConfig?.commandField).toBe('cmd');
    });

    it('should not have type field for Windsurf', () => {
      const config = registry.getConfig('windsurf');
      expect(config?.configStructure.stdioConfig?.typeField).toBeUndefined();
    });

    it('should handle Claude Desktop which has no Linux support', () => {
      const config = registry.getConfig('claude-desktop');
      expect(config?.supportedPlatforms).toEqual(['darwin', 'win32']);
      expect(config?.supportedPlatforms).not.toContain('linux');
    });
  });

  describe('Special configuration generation', () => {
    it('should generate correct Goose YAML with special fields', () => {
      const builder = registry.createBuilder('goose');
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
          test:
            name: test
            cmd: npx
            args:
              - '-y'
              - mcp-remote
              - https://example.com/mcp/default
            type: stdio
            timeout: 300
            enabled: true
            bundled: null
            description: null
            env_keys: []
            envs: {}
        "
      `);
    });

    it('should generate HTTP config for Claude Code', () => {
      const builder = registry.createBuilder('claude-code');
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
            "test": {
              "type": "http",
              "url": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should generate stdio config with mcp-remote for Cursor', () => {
      const builder = registry.createBuilder('cursor');
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
            "test": {
              "args": [
                "-y",
                "mcp-remote",
                "https://example.com/mcp/default",
              ],
              "command": "npx",
              "type": "stdio",
            },
          },
        }
      `);
    });

    it('should default server name to "glean" when not provided', () => {
      const builder = registry.createBuilder('claude-code');
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
            "glean": {
              "type": "http",
              "url": "https://example.com/mcp/default",
            },
          },
        }
      `);
    });

    it('should handle URL-style instance for local config', () => {
      const builder = registry.createBuilder('claude-code');
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
            "glean": {
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

      const registryConfig = registry.getConfig('claude-code');

      expect(registryConfig).toEqual(jsonConfig);
    });

    it('should generate config based on JSON file structure', () => {
      const configPath = path.join(__dirname, '../configs/vscode.json');
      const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      const builder = registry.createBuilder('vscode');
      const generatedConfig = JSON.parse(
        builder.buildConfiguration({
          mode: 'remote',
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        })
      );

      expect(Object.keys(generatedConfig)[0]).toBe(jsonConfig.configStructure.serverKey);
      expect(generatedConfig).toHaveProperty('servers'); // VS Code uses 'servers'

      const serverConfig = generatedConfig.servers.test;
      expect(serverConfig).toHaveProperty(jsonConfig.configStructure.httpConfig.typeField);
      expect(serverConfig).toHaveProperty(jsonConfig.configStructure.httpConfig.urlField);
    });

    it('should use Goose YAML structure from JSON config', () => {
      const configPath = path.join(__dirname, '../configs/goose.json');
      const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      const builder = registry.createBuilder('goose');
      const generatedYaml = builder.buildConfiguration({
        mode: 'remote',
        serverUrl: 'https://example.com/mcp/default',
        serverName: 'test',
      });

      const yaml = require('js-yaml');
      const generatedConfig = yaml.load(generatedYaml);

      expect(Object.keys(generatedConfig)[0]).toBe(jsonConfig.configStructure.serverKey);
      expect(generatedConfig).toHaveProperty('extensions'); // Goose uses 'extensions'

      const serverConfig = generatedConfig.extensions.test;
      expect(serverConfig).toHaveProperty(jsonConfig.configStructure.stdioConfig.commandField); // 'cmd' for Goose
      expect(serverConfig.cmd).toBe('npx'); // Should use 'cmd' not 'command'
    });

    it('should respect client-specific field presence from JSON', () => {
      const windsurfConfig = registry.getConfig('windsurf');
      expect(windsurfConfig?.configStructure.stdioConfig?.typeField).toBeUndefined();

      const builder = registry.createBuilder('windsurf');
      const generatedConfig = JSON.parse(
        builder.buildConfiguration({
          mode: 'remote',
          serverUrl: 'https://example.com/mcp/default',
          serverName: 'test',
        })
      );

      expect(generatedConfig.mcpServers.test).not.toHaveProperty('type');
      expect(generatedConfig.mcpServers.test).toHaveProperty('command');
      expect(generatedConfig.mcpServers.test).toHaveProperty('args');
    });

    it('should use platform-specific paths from JSON config', () => {
      const cursorConfig = registry.getConfig('cursor');

      expect(cursorConfig?.configPath.darwin).toBe('$HOME/.cursor/mcp.json');
      expect(cursorConfig?.configPath.linux).toBe('$HOME/.cursor/mcp.json');
      expect(cursorConfig?.configPath.win32).toBe('%USERPROFILE%\\.cursor\\mcp.json');

      const configPath = path.join(__dirname, '../configs/cursor.json');
      const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(cursorConfig?.configPath).toEqual(jsonConfig.configPath);
    });

    it('should fail for unsupported clients defined in JSON', () => {
      const chatgptConfig = registry.getConfig('chatgpt');
      expect(chatgptConfig?.localConfigSupport).toBe('none');

      expect(() => registry.createBuilder('chatgpt')).toThrow();
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
});
