import { describe, it, expect } from 'vitest';
import {
  GLEAN_REGISTRY_OPTIONS,
  GLEAN_ENV,
  createGleanEnv,
  createGleanUrlEnv,
  createGleanHeaders,
  createGleanRegistry,
  buildGleanServerUrl,
  normalizeGleanProductName,
  buildGleanServerName,
  normalizeGleanServerName,
  // Re-exported from mcp-config-schema
  MCPConfigRegistry,
} from '../src/index.js';

describe('@gleanwork/mcp-config', () => {
  describe('GLEAN_REGISTRY_OPTIONS', () => {
    it('has correct serverPackage', () => {
      expect(GLEAN_REGISTRY_OPTIONS.serverPackage).toBe('@gleanwork/local-mcp-server');
    });

    it('has commandBuilder for http transport', () => {
      expect(GLEAN_REGISTRY_OPTIONS.commandBuilder).toBeDefined();
      expect(GLEAN_REGISTRY_OPTIONS.commandBuilder?.http).toBeDefined();

      const command = GLEAN_REGISTRY_OPTIONS.commandBuilder?.http?.('cursor', {
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
      });
      expect(command).toBe(
        'npx -y @gleanwork/configure-mcp-server remote --url https://example.com/mcp/default --client cursor'
      );
    });

    it('commandBuilder http includes token from Authorization header', () => {
      const command = GLEAN_REGISTRY_OPTIONS.commandBuilder?.http?.('cursor', {
        transport: 'http',
        serverUrl: 'https://example.com/mcp/default',
        headers: { Authorization: 'Bearer my-secret-token' },
      });
      expect(command).toBe(
        'npx -y @gleanwork/configure-mcp-server remote --url https://example.com/mcp/default --client cursor --token my-secret-token'
      );
    });

    it('has commandBuilder for stdio transport', () => {
      expect(GLEAN_REGISTRY_OPTIONS.commandBuilder?.stdio).toBeDefined();

      const command = GLEAN_REGISTRY_OPTIONS.commandBuilder?.stdio?.('cursor', {
        transport: 'stdio',
        env: { GLEAN_INSTANCE: 'my-company', GLEAN_API_TOKEN: 'token' },
      });
      expect(command).toBe(
        'npx -y @gleanwork/configure-mcp-server local --client cursor --env GLEAN_INSTANCE=my-company --env GLEAN_API_TOKEN=token'
      );
    });

    it('commandBuilder http returns null when no serverUrl', () => {
      const command = GLEAN_REGISTRY_OPTIONS.commandBuilder?.http?.('cursor', {
        transport: 'http',
      });
      expect(command).toBeNull();
    });

    it('serverNameBuilder delegates to buildGleanServerName', () => {
      expect(GLEAN_REGISTRY_OPTIONS.serverNameBuilder?.({ transport: 'stdio' })).toBe(
        'glean_local'
      );
      expect(GLEAN_REGISTRY_OPTIONS.serverNameBuilder?.({ transport: 'http' })).toBe(
        'glean_default'
      );
      expect(
        GLEAN_REGISTRY_OPTIONS.serverNameBuilder?.({
          transport: 'http',
          serverUrl: 'https://example.com/mcp/analytics',
        })
      ).toBe('glean_analytics');
    });
  });

  describe('GLEAN_ENV', () => {
    it('has correct environment variable names', () => {
      expect(GLEAN_ENV.INSTANCE).toBe('GLEAN_INSTANCE');
      expect(GLEAN_ENV.URL).toBe('GLEAN_URL');
      expect(GLEAN_ENV.API_TOKEN).toBe('GLEAN_API_TOKEN');
    });
  });

  describe('createGleanEnv', () => {
    it('creates env with instance only', () => {
      const env = createGleanEnv('my-company');
      expect(env).toEqual({
        GLEAN_INSTANCE: 'my-company',
      });
    });

    it('creates env with instance and token', () => {
      const env = createGleanEnv('my-company', 'my-token');
      expect(env).toEqual({
        GLEAN_INSTANCE: 'my-company',
        GLEAN_API_TOKEN: 'my-token',
      });
    });
  });

  describe('createGleanUrlEnv', () => {
    it('creates env with URL only', () => {
      const env = createGleanUrlEnv('https://my-company.glean.com');
      expect(env).toEqual({
        GLEAN_URL: 'https://my-company.glean.com',
      });
    });

    it('creates env with URL and token', () => {
      const env = createGleanUrlEnv('https://my-company.glean.com', 'my-token');
      expect(env).toEqual({
        GLEAN_URL: 'https://my-company.glean.com',
        GLEAN_API_TOKEN: 'my-token',
      });
    });
  });

  describe('createGleanHeaders', () => {
    it('creates Authorization header', () => {
      const headers = createGleanHeaders('my-token');
      expect(headers).toEqual({
        Authorization: 'Bearer my-token',
      });
    });
  });

  describe('buildGleanServerUrl', () => {
    it('builds URL with default endpoint', () => {
      const url = buildGleanServerUrl('my-company');
      expect(url).toBe('https://my-company-be.glean.com/mcp/default');
    });

    it('builds URL with custom endpoint', () => {
      const url = buildGleanServerUrl('my-company', 'custom');
      expect(url).toBe('https://my-company-be.glean.com/mcp/custom');
    });
  });

  describe('createGleanRegistry', () => {
    it('creates a registry with Glean options', () => {
      const registry = createGleanRegistry();
      expect(registry).toBeInstanceOf(MCPConfigRegistry);
    });

    it('can create builders', () => {
      const registry = createGleanRegistry();
      const builder = registry.createBuilder('cursor');
      expect(builder).toBeDefined();
    });
  });

  describe('re-exports from mcp-config-schema', () => {
    it('exports MCPConfigRegistry', () => {
      expect(MCPConfigRegistry).toBeDefined();
    });
  });

  describe('normalizeGleanProductName', () => {
    it('returns glean for undefined/empty', () => {
      expect(normalizeGleanProductName()).toBe('glean');
      expect(normalizeGleanProductName('')).toBe('glean');
    });

    it('normalizes single-word product names', () => {
      expect(normalizeGleanProductName('Glean')).toBe('glean');
      expect(normalizeGleanProductName('ACME')).toBe('acme');
    });

    it('normalizes multi-word product names', () => {
      expect(normalizeGleanProductName('Acme Platform')).toBe('acme_platform');
      expect(normalizeGleanProductName('My Company Search')).toBe('my_company_search');
    });

    it('handles special characters', () => {
      expect(normalizeGleanProductName('My-Product')).toBe('my_product');
      expect(normalizeGleanProductName('Product & Name')).toBe('product_name');
    });
  });

  describe('buildGleanServerName', () => {
    it('returns glean_local for stdio transport', () => {
      expect(buildGleanServerName({ transport: 'stdio' })).toBe('glean_local');
    });

    it('returns glean_default for http transport without URL', () => {
      expect(buildGleanServerName({ transport: 'http' })).toBe('glean_default');
    });

    it('returns glean_agents when agents flag is set', () => {
      expect(buildGleanServerName({ agents: true })).toBe('glean_agents');
    });

    it('extracts and prefixes server name from URL', () => {
      expect(
        buildGleanServerName({
          transport: 'http',
          serverUrl: 'https://example.com/mcp/analytics',
        })
      ).toBe('glean_analytics');
    });

    it('uses custom product name', () => {
      expect(buildGleanServerName({ transport: 'stdio', productName: 'Acme' })).toBe('acme_local');
      expect(buildGleanServerName({ agents: true, productName: 'Acme' })).toBe('acme_agents');
    });

    it('uses explicit serverName with prefix', () => {
      expect(buildGleanServerName({ serverName: 'custom' })).toBe('glean_custom');
    });

    it('does not double-prefix', () => {
      expect(buildGleanServerName({ serverName: 'glean_custom' })).toBe('glean_custom');
      expect(buildGleanServerName({ serverName: 'glean' })).toBe('glean');
    });

    it('returns just product prefix when no options', () => {
      expect(buildGleanServerName({})).toBe('glean');
      expect(buildGleanServerName({ productName: 'acme' })).toBe('acme');
    });
  });

  describe('normalizeGleanServerName', () => {
    it('adds glean prefix to names without it', () => {
      expect(normalizeGleanServerName('custom')).toBe('glean_custom');
      expect(normalizeGleanServerName('analytics')).toBe('glean_analytics');
    });

    it('does not double-prefix', () => {
      expect(normalizeGleanServerName('glean_custom')).toBe('glean_custom');
      expect(normalizeGleanServerName('glean_analytics')).toBe('glean_analytics');
    });

    it('handles name that equals product prefix', () => {
      expect(normalizeGleanServerName('glean')).toBe('glean');
    });

    it('handles names starting with product (e.g., gleancustom)', () => {
      expect(normalizeGleanServerName('gleancustom')).toBe('glean_custom');
    });

    it('uses custom product name', () => {
      expect(normalizeGleanServerName('custom', 'acme')).toBe('acme_custom');
      expect(normalizeGleanServerName('acme_custom', 'acme')).toBe('acme_custom');
    });

    it('returns product prefix for empty name', () => {
      expect(normalizeGleanServerName('')).toBe('glean');
      expect(normalizeGleanServerName('', 'acme')).toBe('acme');
    });
  });
});
