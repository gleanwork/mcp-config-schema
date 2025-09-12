import { describe, it, expect } from 'vitest';
import {
  extractServerNameFromUrl,
  buildMcpServerName,
  normalizeServerName,
  normalizeProductName,
} from '../src/server-name';

describe('Server Name Logic', () => {
  describe('normalizeProductName', () => {
    it('handles single-word product names', () => {
      expect(normalizeProductName('Glean')).toBe('glean');
      expect(normalizeProductName('uSearch')).toBe('usearch');
      expect(normalizeProductName('ACME')).toBe('acme');
    });

    it('handles multi-word product names with spaces', () => {
      expect(normalizeProductName('Dell Saleschat')).toBe('dell_saleschat');
      expect(normalizeProductName('My Product Name')).toBe('my_product_name');
      expect(normalizeProductName('Enterprise Search Solution')).toBe('enterprise_search_solution');
    });

    it('handles special characters', () => {
      expect(normalizeProductName('My-Product')).toBe('my_product');
      expect(normalizeProductName('Product.Name')).toBe('product_name');
      expect(normalizeProductName('Product@Name')).toBe('product_name');
      expect(normalizeProductName('Product & Name')).toBe('product_name');
    });

    it('handles consecutive spaces and special chars', () => {
      expect(normalizeProductName('My   Product')).toBe('my_product');
      expect(normalizeProductName('Product---Name')).toBe('product_name');
      expect(normalizeProductName('_Product_Name_')).toBe('product_name');
    });

    it('handles edge cases', () => {
      expect(normalizeProductName('')).toBe('glean');
      expect(normalizeProductName('   ')).toBe('glean');
      expect(normalizeProductName('123')).toBe('123');
      expect(normalizeProductName('Product123')).toBe('product123');
    });
  });

  describe('extractServerNameFromUrl', () => {
    it('extracts server name from standard MCP URL', () => {
      expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/analytics')).toBe('analytics');
      expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/default')).toBe('default');
      expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/custom-agent')).toBe(
        'custom-agent'
      );
    });

    it('handles URLs with trailing slashes', () => {
      expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/analytics/')).toBe('analytics');
      expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/default/')).toBe('default');
    });

    it('handles URLs with additional path segments', () => {
      expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/analytics/v1')).toBe(
        'analytics'
      );
    });

    it('returns null for URLs without MCP path', () => {
      expect(extractServerNameFromUrl('https://my-be.glean.com/api/v1')).toBeNull();
      expect(extractServerNameFromUrl('https://my-be.glean.com/')).toBeNull();
    });
  });

  describe('buildMcpServerName', () => {
    describe('stdio transport', () => {
      it('returns glean_local for stdio transport', () => {
        expect(buildMcpServerName({ transport: 'stdio' })).toBe('glean_local');
      });

      it('returns glean_local even with custom serverName in stdio transport', () => {
        expect(buildMcpServerName({ transport: 'stdio', serverName: 'custom' })).toBe(
          'glean_custom'
        );
      });
    });

    describe('agents mode', () => {
      it('returns glean_agents when agents flag is set', () => {
        expect(buildMcpServerName({ agents: true })).toBe('glean_agents');
      });

      it('prioritizes agents over serverUrl', () => {
        expect(
          buildMcpServerName({
            agents: true,
            serverUrl: 'https://my-be.glean.com/mcp/analytics',
          })
        ).toBe('glean_agents');
      });
    });

    describe('http transport with URL', () => {
      it('extracts and prefixes server name from URL', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://my-be.glean.com/mcp/analytics',
          })
        ).toBe('glean_analytics');
      });

      it('returns glean_default for default endpoint (consistent behavior)', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://my-be.glean.com/mcp/default',
          })
        ).toBe('glean_default');
      });

      it('handles custom-agent URLs', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://my-be.glean.com/mcp/custom-agent',
          })
        ).toBe('glean_custom-agent');
      });
    });

    describe('explicit serverName', () => {
      it('uses explicit serverName with prefix', () => {
        expect(buildMcpServerName({ serverName: 'custom' })).toBe('glean_custom');
        expect(buildMcpServerName({ serverName: 'analytics' })).toBe('glean_analytics');
      });

      it('does not double-prefix if serverName already has glean prefix', () => {
        expect(buildMcpServerName({ serverName: 'glean_custom' })).toBe('glean_custom');
        expect(buildMcpServerName({ serverName: 'glean' })).toBe('glean');
      });

      it('explicit serverName overrides URL extraction', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://my-be.glean.com/mcp/analytics',
            serverName: 'custom',
          })
        ).toBe('glean_custom');
      });
    });

    describe('fallback behavior', () => {
      it('returns glean as default fallback', () => {
        expect(buildMcpServerName({})).toBe('glean');
        expect(buildMcpServerName({ transport: 'http' })).toBe('glean');
      });
    });
  });

  describe('normalizeServerName', () => {
    it('adds glean_ prefix to names without it', () => {
      expect(normalizeServerName('custom')).toBe('glean_custom');
      expect(normalizeServerName('analytics')).toBe('glean_analytics');
    });

    it('does not double-prefix names that already have glean_', () => {
      expect(normalizeServerName('glean_custom')).toBe('glean_custom');
      expect(normalizeServerName('glean_analytics')).toBe('glean_analytics');
    });

    it('handles names that start with just glean', () => {
      expect(normalizeServerName('glean')).toBe('glean');
      expect(normalizeServerName('gleancustom')).toBe('glean_custom');
    });

    it('converts to lowercase', () => {
      expect(normalizeServerName('CUSTOM')).toBe('glean_custom');
      expect(normalizeServerName('Glean_Analytics')).toBe('glean_analytics');
    });

    it('handles edge cases', () => {
      expect(normalizeServerName('')).toBe('glean');
      expect(normalizeServerName('glean_')).toBe('glean');
    });

    describe('with custom productName', () => {
      it('uses custom product name for prefix', () => {
        expect(normalizeServerName('custom', 'acme')).toBe('acme_custom');
        expect(normalizeServerName('analytics', 'corp')).toBe('corp_analytics');
      });

      it('does not double-prefix with custom product name', () => {
        expect(normalizeServerName('acme_custom', 'acme')).toBe('acme_custom');
        expect(normalizeServerName('corp_analytics', 'corp')).toBe('corp_analytics');
      });

      it('handles product name in input', () => {
        expect(normalizeServerName('acme', 'acme')).toBe('acme');
        expect(normalizeServerName('acmecustom', 'acme')).toBe('acme_custom');
      });
    });
  });

  describe('buildMcpServerName with white-label support', () => {
    describe('custom productName', () => {
      it('uses custom product name for stdio transport', () => {
        expect(buildMcpServerName({ transport: 'stdio', productName: 'acme' })).toBe('acme_local');
        expect(buildMcpServerName({ transport: 'stdio', productName: 'corp' })).toBe('corp_local');
      });

      it('uses custom product name for agents mode', () => {
        expect(buildMcpServerName({ agents: true, productName: 'acme' })).toBe('acme_agents');
      });

      it('uses custom product name with URL extraction', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://my-be.acme.com/mcp/analytics',
            productName: 'acme',
          })
        ).toBe('acme_analytics');
      });

      it('uses custom product name with explicit serverName', () => {
        expect(buildMcpServerName({ serverName: 'custom', productName: 'acme' })).toBe(
          'acme_custom'
        );
      });

      it('does not double-prefix with custom product name', () => {
        expect(buildMcpServerName({ serverName: 'acme_custom', productName: 'acme' })).toBe(
          'acme_custom'
        );
        expect(buildMcpServerName({ serverName: 'acme', productName: 'acme' })).toBe('acme');
      });

      it('uses custom product name as fallback', () => {
        expect(buildMcpServerName({ productName: 'acme' })).toBe('acme');
        expect(buildMcpServerName({ transport: 'http', productName: 'corp' })).toBe('corp');
      });
    });

    describe('real-world white-label examples', () => {
      it('handles Glean product name', () => {
        expect(buildMcpServerName({ transport: 'stdio', productName: 'Glean' })).toBe(
          'glean_local'
        );
        expect(buildMcpServerName({ agents: true, productName: 'Glean' })).toBe('glean_agents');
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://example.com/mcp/analytics',
            productName: 'Glean',
          })
        ).toBe('glean_analytics');
      });

      it('handles uSearch product name', () => {
        expect(buildMcpServerName({ transport: 'stdio', productName: 'uSearch' })).toBe(
          'usearch_local'
        );
        expect(buildMcpServerName({ agents: true, productName: 'uSearch' })).toBe('usearch_agents');
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://example.com/mcp/analytics',
            productName: 'uSearch',
          })
        ).toBe('usearch_analytics');
      });

      it('handles Dell Saleschat product name', () => {
        expect(buildMcpServerName({ transport: 'stdio', productName: 'Dell Saleschat' })).toBe(
          'dell_saleschat_local'
        );
        expect(buildMcpServerName({ agents: true, productName: 'Dell Saleschat' })).toBe(
          'dell_saleschat_agents'
        );
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://example.com/mcp/analytics',
            productName: 'Dell Saleschat',
          })
        ).toBe('dell_saleschat_analytics');
      });

      it('handles other multi-word product names', () => {
        expect(buildMcpServerName({ transport: 'stdio', productName: 'My Company Search' })).toBe(
          'my_company_search_local'
        );
        expect(
          buildMcpServerName({ transport: 'stdio', productName: 'Enterprise-AI-Platform' })
        ).toBe('enterprise_ai_platform_local');
        expect(buildMcpServerName({ transport: 'stdio', productName: 'Search & Discovery' })).toBe(
          'search_discovery_local'
        );
      });
    });
  });
});
