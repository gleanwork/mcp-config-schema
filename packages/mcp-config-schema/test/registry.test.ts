import { describe, it, expect, beforeEach } from 'vitest';
import { MCPConfigRegistry } from '../src/registry';
import { CLIENT, CLIENT_DISPLAY_NAME } from '../src/constants';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('MCPConfigRegistry', () => {
  let registry: MCPConfigRegistry;

  beforeEach(() => {
    const configDir = path.join(__dirname, '../configs');
    registry = new MCPConfigRegistry(configDir);
  });

  describe('loading configs', () => {
    it('should load all configuration files', () => {
      const configs = registry.getAllConfigs();
      expect(configs.length).toBeGreaterThan(0);
    });

    it('should load Claude Code config', () => {
      const config = registry.getConfig(CLIENT.CLAUDE_CODE);
      expect(config).toBeDefined();
      expect(config?.displayName).toBe(CLIENT_DISPLAY_NAME.CLAUDE_CODE);
      expect(config?.transports).toEqual(['stdio', 'http']);
    });

    it('should load VS Code config', () => {
      const config = registry.getConfig(CLIENT.VSCODE);
      expect(config).toBeDefined();
      expect(config?.displayName).toBe('Visual Studio Code');
      expect(config?.configStructure.serversPropertyName).toBe('servers');
    });

    it('should load Cursor config with HTTP support', () => {
      const config = registry.getConfig(CLIENT.CURSOR);
      expect(config).toBeDefined();
      expect(config?.transports).toEqual(['stdio', 'http']);
    });

    it('should load Goose config with YAML format', () => {
      const config = registry.getConfig(CLIENT.GOOSE);
      expect(config).toBeDefined();
      expect(config?.configFormat).toBe('yaml');
    });
  });

  describe('filtering methods', () => {
    it('should get native HTTP clients', () => {
      const clients = registry.getNativeHttpClients();
      expect(clients.length).toBeGreaterThan(0);
      expect(clients.every((c) => c.transports.includes('http'))).toBe(true);
    });

    it('should get bridge-required clients', () => {
      const clients = registry.getBridgeRequiredClients();
      expect(clients.length).toBeGreaterThan(0);
      expect(clients.every((c) => !c.transports.includes('http'))).toBe(true);
    });

    it('should get stdio-only clients', () => {
      const clients = registry.getStdioOnlyClients();
      expect(clients.length).toBeGreaterThan(0);
      expect(clients.every((c) => c.transports.length === 1 && c.transports[0] === 'stdio')).toBe(
        true
      );
    });

    it('should get supported clients', () => {
      const clients = registry.getSupportedClients();
      expect(clients.length).toBeGreaterThan(0);
      expect(clients.every((c) => c.userConfigurable === true)).toBe(true);
    });

    it('should get unsupported clients', () => {
      const clients = registry.getUnsupportedClients();
      const chatgpt = clients.find((c) => c.id === CLIENT.CHATGPT);
      const claudeTeamsEnterprise = clients.find((c) => c.id === CLIENT.CLAUDE_TEAMS_ENTERPRISE);
      expect(chatgpt).toBeDefined();
      expect(claudeTeamsEnterprise).toBeDefined();
      expect(chatgpt?.userConfigurable).toBe(false);
      expect(claudeTeamsEnterprise?.userConfigurable).toBe(false);
    });

    it('should get clients with one-click support', () => {
      const clients = registry.getClientsWithOneClick();
      expect(clients.length).toBeGreaterThan(0);
      const cursor = clients.find((c) => c.id === CLIENT.CURSOR);
      expect(cursor).toBeDefined();
      expect(cursor?.protocolHandler?.protocol).toBe('cursor://');
    });

    it('should get clients by platform', () => {
      const darwinClients = registry.getClientsByPlatform('darwin');
      const linuxClients = registry.getClientsByPlatform('linux');
      const win32Clients = registry.getClientsByPlatform('win32');

      expect(darwinClients.length).toBeGreaterThan(0);
      expect(linuxClients.length).toBeGreaterThan(0);
      expect(win32Clients.length).toBeGreaterThan(0);

      const claudeDesktop = registry.getConfig(CLIENT.CLAUDE_DESKTOP);
      expect(darwinClients).toContainEqual(claudeDesktop);
      expect(linuxClients).toContainEqual(claudeDesktop);
      expect(win32Clients).toContainEqual(claudeDesktop);
    });
  });

  describe('transport utility methods', () => {
    it('should correctly identify clients that need mcp-remote', () => {
      // Stdio-only clients need mcp-remote for HTTP
      expect(registry.clientNeedsMcpRemote('claude-desktop')).toBe(true);

      // Clients with HTTP support don't need mcp-remote
      expect(registry.clientNeedsMcpRemote('vscode')).toBe(false);
      expect(registry.clientNeedsMcpRemote('cursor')).toBe(false);
      expect(registry.clientNeedsMcpRemote('goose')).toBe(false);
      expect(registry.clientNeedsMcpRemote('windsurf')).toBe(false);
    });

    it('should correctly identify clients that support HTTP natively', () => {
      // Clients with HTTP in transports
      expect(registry.clientSupportsHttpNatively('vscode')).toBe(true);
      expect(registry.clientSupportsHttpNatively('cursor')).toBe(true);
      expect(registry.clientSupportsHttpNatively('goose')).toBe(true);
      expect(registry.clientSupportsHttpNatively('windsurf')).toBe(true);

      // Stdio-only clients don't support HTTP natively
      expect(registry.clientSupportsHttpNatively('claude-desktop')).toBe(false);
    });

    it('should correctly identify clients that support stdio', () => {
      // Most clients support stdio
      expect(registry.clientSupportsStdio('vscode')).toBe(true);
      expect(registry.clientSupportsStdio('claude-desktop')).toBe(true);
      expect(registry.clientSupportsStdio('windsurf')).toBe(true);

      // ChatGPT only supports HTTP
      expect(registry.clientSupportsStdio('chatgpt')).toBe(false);
    });

    it('should throw for unknown clients', () => {
      expect(() => registry.clientNeedsMcpRemote('unknown' as any)).toThrow('Unknown client');
      expect(() => registry.clientSupportsHttpNatively('unknown' as any)).toThrow('Unknown client');
      expect(() => registry.clientSupportsStdio('unknown' as any)).toThrow('Unknown client');
    });
  });
});
