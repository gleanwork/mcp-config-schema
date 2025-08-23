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
      expect(config?.clientSupports).toBe('http');
      expect(config?.requiresMcpRemoteForHttp).toBe(false);
    });

    it('should load VS Code config', () => {
      const config = registry.getConfig(CLIENT.VSCODE);
      expect(config).toBeDefined();
      expect(config?.displayName).toBe('Visual Studio Code');
      expect(config?.configStructure.serverKey).toBe('servers');
    });

    it('should load Cursor config with HTTP support', () => {
      const config = registry.getConfig(CLIENT.CURSOR);
      expect(config).toBeDefined();
      expect(config?.clientSupports).toBe('http');
      expect(config?.requiresMcpRemoteForHttp).toBe(false);
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
      expect(clients.every((c) => !c.requiresMcpRemoteForHttp)).toBe(true);
    });

    it('should get bridge-required clients', () => {
      const clients = registry.getBridgeRequiredClients();
      expect(clients.length).toBeGreaterThan(0);
      expect(clients.every((c) => c.requiresMcpRemoteForHttp)).toBe(true);
    });

    it('should get stdio-only clients', () => {
      const clients = registry.getStdioOnlyClients();
      expect(clients.length).toBeGreaterThan(0);
      expect(clients.every((c) => c.clientSupports === 'stdio-only')).toBe(true);
    });

    it('should get supported clients', () => {
      const clients = registry.getSupportedClients();
      expect(clients.length).toBeGreaterThan(0);
      expect(clients.every((c) => c.localConfigSupport === 'full')).toBe(true);
    });

    it('should get unsupported clients', () => {
      const clients = registry.getUnsupportedClients();
      const chatgpt = clients.find((c) => c.id === CLIENT.CHATGPT);
      const claudeTeamsEnterprise = clients.find((c) => c.id === CLIENT.CLAUDE_TEAMS_ENTERPRISE);
      expect(chatgpt).toBeDefined();
      expect(claudeTeamsEnterprise).toBeDefined();
      expect(chatgpt?.localConfigSupport).toBe('none');
      expect(claudeTeamsEnterprise?.localConfigSupport).toBe('none');
    });

    it('should get clients with one-click support', () => {
      const clients = registry.getClientsWithOneClick();
      expect(clients.length).toBeGreaterThan(0);
      const cursor = clients.find((c) => c.id === CLIENT.CURSOR);
      expect(cursor).toBeDefined();
      expect(cursor?.oneClick?.protocol).toBe('cursor://');
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
});
