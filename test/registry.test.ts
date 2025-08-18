import { describe, it, expect } from 'vitest';
import { MCPConfigRegistry } from '../src/registry';
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
      const config = registry.getConfig('claude-code');
      expect(config).toBeDefined();
      expect(config?.displayName).toBe('Claude Code');
      expect(config?.clientSupports).toBe('http');
      expect(config?.requiresMcpRemoteForHttp).toBe(false);
    });

    it('should load VS Code config', () => {
      const config = registry.getConfig('vscode');
      expect(config).toBeDefined();
      expect(config?.displayName).toBe('Visual Studio Code');
      expect(config?.configStructure.serverKey).toBe('servers');
    });

    it('should load Cursor config with security notes', () => {
      const config = registry.getConfig('cursor');
      expect(config).toBeDefined();
      expect(config?.securityNotes).toContain('CSRF');
    });

    it('should load Goose config with YAML format', () => {
      const config = registry.getConfig('goose');
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
      expect(clients.every((c) => c.compatibility === 'full')).toBe(true);
    });

    it('should get investigating clients', () => {
      const clients = registry.getInvestigatingClients();
      const claudeDesktopOrg = clients.find((c) => c.id === 'claude-desktop-org');
      expect(claudeDesktopOrg).toBeDefined();
      expect(claudeDesktopOrg?.compatibility).toBe('investigating');
    });

    it('should get unsupported clients', () => {
      const clients = registry.getUnsupportedClients();
      const chatgpt = clients.find((c) => c.id === 'chatgpt');
      expect(chatgpt).toBeDefined();
      expect(chatgpt?.compatibility).toBe('none');
    });

    it('should get clients with one-click protocol', () => {
      const clients = registry.getClientsWithOneClick();
      const vscode = clients.find((c) => c.id === 'vscode');
      const cursor = clients.find((c) => c.id === 'cursor');
      expect(vscode).toBeDefined();
      expect(cursor).toBeDefined();
      expect(vscode?.oneClickProtocol).toBe('vscode://');
      expect(cursor?.oneClickProtocol).toBe('cursor://');
    });

    it('should get clients by platform', () => {
      const darwinClients = registry.getClientsByPlatform('darwin');
      const linuxClients = registry.getClientsByPlatform('linux');
      const win32Clients = registry.getClientsByPlatform('win32');

      expect(darwinClients.length).toBeGreaterThan(0);
      expect(linuxClients.length).toBeGreaterThan(0);
      expect(win32Clients.length).toBeGreaterThan(0);

      const claudeDesktop = registry.getConfig('claude-desktop');
      expect(darwinClients).toContainEqual(claudeDesktop);
      expect(linuxClients).not.toContainEqual(claudeDesktop);
    });
  });
});
