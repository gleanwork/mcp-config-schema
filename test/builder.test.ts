import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigBuilder } from '../src/builder';
import { MCPClientConfig } from '../src/types';

describe('ConfigBuilder', () => {
  const gleanConfig = {
    serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
    serverName: 'glean',
  };

  describe('HTTP native clients', () => {
    it('should generate correct config for Claude Code', () => {
      const config: MCPClientConfig = {
        id: 'claude-code',
        name: 'claude-code',
        displayName: 'Claude Code',
        description: 'Claude Code with native HTTP support',
        compatibility: 'full',
        clientSupports: 'http',
        requiresMcpRemoteForHttp: false,
        supportedPlatforms: ['darwin', 'linux', 'win32'],
        configFormat: 'json',
        configPath: {
          darwin: '$HOME/.claude.json',
        },
        configStructure: {
          serverKey: 'mcpServers',
          serverNameKey: 'glean',
          httpConfig: {
            typeField: 'type',
            urlField: 'url',
          },
        },
      };

      const builder = new ConfigBuilder(config);
      const result = JSON.parse(builder.buildConfiguration(gleanConfig));

      expect(result).toEqual({
        mcpServers: {
          glean: {
            type: 'http',
            url: 'https://glean-dev-be.glean.com/mcp/default',
          },
        },
      });
    });

    it('should generate correct config for VS Code', () => {
      const config: MCPClientConfig = {
        id: 'vscode',
        name: 'vscode',
        displayName: 'Visual Studio Code',
        description: 'VS Code with native HTTP support',
        compatibility: 'full',
        clientSupports: 'http',
        requiresMcpRemoteForHttp: false,
        supportedPlatforms: ['darwin', 'linux', 'win32'],
        configFormat: 'json',
        configPath: {
          darwin: '$HOME/Library/Application Support/Code/User/mcp.json',
        },
        configStructure: {
          serverKey: 'servers',
          serverNameKey: 'glean',
          httpConfig: {
            typeField: 'type',
            urlField: 'url',
          },
        },
      };

      const builder = new ConfigBuilder(config);
      const result = JSON.parse(builder.buildConfiguration(gleanConfig));

      expect(result).toEqual({
        servers: {
          glean: {
            type: 'http',
            url: 'https://glean-dev-be.glean.com/mcp/default',
          },
        },
      });
    });
  });

  describe('stdio-only clients', () => {
    it('should generate correct config for Claude Desktop', () => {
      const config: MCPClientConfig = {
        id: 'claude-desktop',
        name: 'claude-desktop',
        displayName: 'Claude for Desktop',
        description: 'Claude Desktop',
        compatibility: 'full',
        clientSupports: 'stdio-only',
        requiresMcpRemoteForHttp: true,
        supportedPlatforms: ['darwin', 'win32'],
        configFormat: 'json',
        configPath: {
          darwin: '$HOME/Library/Application Support/Claude/claude_desktop_config.json',
        },
        configStructure: {
          serverKey: 'mcpServers',
          serverNameKey: 'glean',
          stdioConfig: {
            typeField: 'type',
            commandField: 'command',
            argsField: 'args',
          },
        },
      };

      const builder = new ConfigBuilder(config);
      const result = JSON.parse(builder.buildConfiguration(gleanConfig));

      expect(result).toEqual({
        mcpServers: {
          glean: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://glean-dev-be.glean.com/mcp/default'],
          },
        },
      });
    });

    it('should generate correct config for Cursor', () => {
      const config: MCPClientConfig = {
        id: 'cursor',
        name: 'cursor',
        displayName: 'Cursor',
        description: 'Cursor',
        compatibility: 'full',
        clientSupports: 'stdio-only',
        requiresMcpRemoteForHttp: true,
        supportedPlatforms: ['darwin', 'linux', 'win32'],
        configFormat: 'json',
        configPath: {
          darwin: '$HOME/.cursor/mcp.json',
        },
        configStructure: {
          serverKey: 'mcpServers',
          serverNameKey: 'glean',
          stdioConfig: {
            typeField: 'type',
            commandField: 'command',
            argsField: 'args',
          },
        },
      };

      const builder = new ConfigBuilder(config);
      const result = JSON.parse(builder.buildConfiguration(gleanConfig));

      expect(result).toEqual({
        mcpServers: {
          glean: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://glean-dev-be.glean.com/mcp/default'],
          },
        },
      });
    });

    it('should generate correct YAML config for Goose', () => {
      const config: MCPClientConfig = {
        id: 'goose',
        name: 'goose',
        displayName: 'Goose',
        description: 'Goose',
        compatibility: 'full',
        clientSupports: 'stdio-only',
        requiresMcpRemoteForHttp: true,
        supportedPlatforms: ['darwin', 'linux', 'win32'],
        configFormat: 'yaml',
        configPath: {
          darwin: '$HOME/.config/goose/config.yaml',
        },
        configStructure: {
          serverKey: 'extensions',
          serverNameKey: 'glean',
          stdioConfig: {
            commandField: 'cmd',
            argsField: 'args',
          },
        },
      };

      const builder = new ConfigBuilder(config);
      const result = builder.buildConfiguration(gleanConfig);

      expect(result).toContain('extensions:');
      expect(result).toContain('glean:');
      expect(result).toContain('cmd: npx');
      expect(result).toContain("'-y'");
      expect(result).toContain('- mcp-remote');
      expect(result).toContain('- https://glean-dev-be.glean.com/mcp/default');
      expect(result).toContain('type: stdio');
      expect(result).toContain('timeout: 300');
      expect(result).toContain('enabled: true');
    });

    it('should generate correct config for Windsurf', () => {
      const config: MCPClientConfig = {
        id: 'windsurf',
        name: 'windsurf',
        displayName: 'Windsurf',
        description: 'Windsurf',
        compatibility: 'full',
        clientSupports: 'stdio-only',
        requiresMcpRemoteForHttp: true,
        supportedPlatforms: ['darwin', 'linux', 'win32'],
        configFormat: 'json',
        configPath: {
          darwin: '$HOME/.codeium/windsurf/mcp_config.json',
        },
        configStructure: {
          serverKey: 'mcpServers',
          serverNameKey: 'glean',
          stdioConfig: {
            commandField: 'command',
            argsField: 'args',
          },
        },
      };

      const builder = new ConfigBuilder(config);
      const result = JSON.parse(builder.buildConfiguration(gleanConfig));

      expect(result).toEqual({
        mcpServers: {
          glean: {
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://glean-dev-be.glean.com/mcp/default'],
          },
        },
      });
    });
  });

  describe('path expansion', () => {
    it('should expand $HOME correctly', () => {
      const config: MCPClientConfig = {
        id: 'claude-code',
        name: 'claude-code',
        displayName: 'Claude Code',
        description: 'Claude Code',
        compatibility: 'full',
        clientSupports: 'http',
        requiresMcpRemoteForHttp: false,
        supportedPlatforms: ['darwin'],
        configFormat: 'json',
        configPath: {
          darwin: '$HOME/.claude.json',
        },
        configStructure: {
          serverKey: 'mcpServers',
          serverNameKey: 'glean',
          httpConfig: {
            typeField: 'type',
            urlField: 'url',
          },
        },
      };

      const builder = new ConfigBuilder(config);
      const path = builder.getConfigPath();

      expect(path).not.toContain('$HOME');
      expect(path).toContain('/.claude.json');
    });
  });
});
