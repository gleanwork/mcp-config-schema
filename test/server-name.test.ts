import { describe, it, expect } from 'vitest';
import {
  extractServerNameFromUrl,
  buildMcpServerName,
  normalizeServerName,
  normalizeProductName,
} from '../src/server-name';

describe('Server Name Logic', () => {
  // normalizeProductName tests
  it('normalizeProductName handles single-word product names', () => {
    expect(normalizeProductName('Glean')).toBe('glean');
    expect(normalizeProductName('Search')).toBe('search');
    expect(normalizeProductName('ACME')).toBe('acme');
  });

  it('normalizeProductName handles multi-word product names with spaces', () => {
    expect(normalizeProductName('Acme Platform')).toBe('acme_platform');
    expect(normalizeProductName('My Product Name')).toBe('my_product_name');
    expect(normalizeProductName('Enterprise Search Solution')).toBe('enterprise_search_solution');
  });

  it('normalizeProductName handles special characters', () => {
    expect(normalizeProductName('My-Product')).toBe('my_product');
    expect(normalizeProductName('Product.Name')).toBe('product_name');
    expect(normalizeProductName('Product@Name')).toBe('product_name');
    expect(normalizeProductName('Product & Name')).toBe('product_name');
  });

  it('normalizeProductName handles consecutive spaces and special chars', () => {
    expect(normalizeProductName('My   Product')).toBe('my_product');
    expect(normalizeProductName('Product---Name')).toBe('product_name');
    expect(normalizeProductName('_Product_Name_')).toBe('product_name');
  });

  it('normalizeProductName handles edge cases', () => {
    expect(normalizeProductName('')).toBe('glean');
    expect(normalizeProductName('   ')).toBe('glean');
    expect(normalizeProductName('123')).toBe('123');
    expect(normalizeProductName('Product123')).toBe('product123');
  });

  // extractServerNameFromUrl tests
  it('extractServerNameFromUrl extracts server name from standard MCP URL', () => {
    expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/analytics')).toBe('analytics');
    expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/default')).toBe('default');
    expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/custom-agent')).toBe(
      'custom-agent'
    );
  });

  it('extractServerNameFromUrl handles URLs with trailing slashes', () => {
    expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/analytics/')).toBe('analytics');
    expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/default/')).toBe('default');
  });

  it('extractServerNameFromUrl handles URLs with additional path segments', () => {
    expect(extractServerNameFromUrl('https://my-be.glean.com/mcp/analytics/v1')).toBe('analytics');
  });

  it('extractServerNameFromUrl returns null for URLs without MCP path', () => {
    expect(extractServerNameFromUrl('https://my-be.glean.com/api/v1')).toBeNull();
    expect(extractServerNameFromUrl('https://my-be.glean.com/')).toBeNull();
  });

  // buildMcpServerName tests - stdio transport
  it('buildMcpServerName returns glean_local for stdio transport', () => {
    expect(buildMcpServerName({ transport: 'stdio' })).toBe('glean_local');
  });

  it('buildMcpServerName returns custom server name with stdio transport', () => {
    expect(buildMcpServerName({ transport: 'stdio', serverName: 'custom' })).toBe('glean_custom');
  });

  // buildMcpServerName tests - agents mode
  it('buildMcpServerName returns glean_agents when agents flag is set', () => {
    expect(buildMcpServerName({ agents: true })).toBe('glean_agents');
  });

  it('buildMcpServerName prioritizes agents over serverUrl', () => {
    expect(
      buildMcpServerName({
        agents: true,
        serverUrl: 'https://my-be.glean.com/mcp/analytics',
      })
    ).toBe('glean_agents');
  });

  // buildMcpServerName tests - http transport with URL
  it('buildMcpServerName extracts and prefixes server name from URL', () => {
    expect(
      buildMcpServerName({
        transport: 'http',
        serverUrl: 'https://my-be.glean.com/mcp/analytics',
      })
    ).toBe('glean_analytics');
  });

  it('buildMcpServerName returns glean_default for default endpoint', () => {
    expect(
      buildMcpServerName({
        transport: 'http',
        serverUrl: 'https://my-be.glean.com/mcp/default',
      })
    ).toBe('glean_default');
  });

  it('buildMcpServerName handles custom-agent URLs', () => {
    expect(
      buildMcpServerName({
        transport: 'http',
        serverUrl: 'https://my-be.glean.com/mcp/custom-agent',
      })
    ).toBe('glean_custom-agent');
  });

  // buildMcpServerName tests - explicit serverName
  it('buildMcpServerName uses explicit serverName with prefix', () => {
    expect(buildMcpServerName({ serverName: 'custom' })).toBe('glean_custom');
    expect(buildMcpServerName({ serverName: 'analytics' })).toBe('glean_analytics');
  });

  it('buildMcpServerName does not double-prefix if serverName already has glean prefix', () => {
    expect(buildMcpServerName({ serverName: 'glean_custom' })).toBe('glean_custom');
    expect(buildMcpServerName({ serverName: 'glean' })).toBe('glean');
  });

  it('buildMcpServerName explicit serverName overrides URL extraction', () => {
    expect(
      buildMcpServerName({
        transport: 'http',
        serverUrl: 'https://my-be.glean.com/mcp/analytics',
        serverName: 'custom',
      })
    ).toBe('glean_custom');
  });

  // buildMcpServerName tests - fallback behavior
  it('buildMcpServerName returns glean as default fallback', () => {
    expect(buildMcpServerName({})).toBe('glean');
    expect(buildMcpServerName({ transport: 'http' })).toBe('glean');
  });

  // normalizeServerName tests
  it('normalizeServerName adds glean_ prefix to names without it', () => {
    expect(normalizeServerName('custom')).toBe('glean_custom');
    expect(normalizeServerName('analytics')).toBe('glean_analytics');
  });

  it('normalizeServerName does not double-prefix names that already have glean_', () => {
    expect(normalizeServerName('glean_custom')).toBe('glean_custom');
    expect(normalizeServerName('glean_analytics')).toBe('glean_analytics');
  });

  it('normalizeServerName handles names that start with just glean', () => {
    expect(normalizeServerName('glean')).toBe('glean');
    expect(normalizeServerName('gleancustom')).toBe('glean_custom');
  });

  it('normalizeServerName converts to lowercase', () => {
    expect(normalizeServerName('CUSTOM')).toBe('glean_custom');
    expect(normalizeServerName('Glean_Analytics')).toBe('glean_analytics');
  });

  it('normalizeServerName handles edge cases', () => {
    expect(normalizeServerName('')).toBe('glean');
    expect(normalizeServerName('glean_')).toBe('glean');
  });

  it('normalizeServerName uses custom product name for prefix', () => {
    expect(normalizeServerName('custom', 'acme')).toBe('acme_custom');
    expect(normalizeServerName('analytics', 'corp')).toBe('corp_analytics');
  });

  it('normalizeServerName does not double-prefix with custom product name', () => {
    expect(normalizeServerName('acme_custom', 'acme')).toBe('acme_custom');
    expect(normalizeServerName('corp_analytics', 'corp')).toBe('corp_analytics');
  });

  it('normalizeServerName handles product name in input', () => {
    expect(normalizeServerName('acme', 'acme')).toBe('acme');
    expect(normalizeServerName('acmecustom', 'acme')).toBe('acme_custom');
  });

  // buildMcpServerName with white-label support - custom productName
  it('buildMcpServerName uses custom product name for stdio transport', () => {
    expect(buildMcpServerName({ transport: 'stdio', productName: 'acme' })).toBe('acme_local');
    expect(buildMcpServerName({ transport: 'stdio', productName: 'corp' })).toBe('corp_local');
  });

  it('buildMcpServerName uses custom product name for agents mode', () => {
    expect(buildMcpServerName({ agents: true, productName: 'acme' })).toBe('acme_agents');
  });

  it('buildMcpServerName uses custom product name with URL extraction', () => {
    expect(
      buildMcpServerName({
        transport: 'http',
        serverUrl: 'https://my-be.acme.com/mcp/analytics',
        productName: 'acme',
      })
    ).toBe('acme_analytics');
  });

  it('buildMcpServerName uses custom product name with explicit serverName', () => {
    expect(buildMcpServerName({ serverName: 'custom', productName: 'acme' })).toBe('acme_custom');
  });

  it('buildMcpServerName does not double-prefix with custom product name', () => {
    expect(buildMcpServerName({ serverName: 'acme_custom', productName: 'acme' })).toBe(
      'acme_custom'
    );
    expect(buildMcpServerName({ serverName: 'acme', productName: 'acme' })).toBe('acme');
  });

  it('buildMcpServerName uses custom product name as fallback', () => {
    expect(buildMcpServerName({ productName: 'acme' })).toBe('acme');
    expect(buildMcpServerName({ transport: 'http', productName: 'corp' })).toBe('corp');
  });

  // Real-world white-label examples
  it('buildMcpServerName handles Glean product name', () => {
    expect(buildMcpServerName({ transport: 'stdio', productName: 'Glean' })).toBe('glean_local');
    expect(buildMcpServerName({ agents: true, productName: 'Glean' })).toBe('glean_agents');
    expect(
      buildMcpServerName({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/analytics',
        productName: 'Glean',
      })
    ).toBe('glean_analytics');
  });

  it('buildMcpServerName handles single-word custom product name', () => {
    expect(buildMcpServerName({ transport: 'stdio', productName: 'Search' })).toBe('search_local');
    expect(buildMcpServerName({ agents: true, productName: 'Search' })).toBe('search_agents');
    expect(
      buildMcpServerName({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/analytics',
        productName: 'Search',
      })
    ).toBe('search_analytics');
  });

  it('buildMcpServerName handles multi-word product name', () => {
    expect(buildMcpServerName({ transport: 'stdio', productName: 'Acme Platform' })).toBe(
      'acme_platform_local'
    );
    expect(buildMcpServerName({ agents: true, productName: 'Acme Platform' })).toBe(
      'acme_platform_agents'
    );
    expect(
      buildMcpServerName({
        transport: 'http',
        serverUrl: 'https://example.com/mcp/analytics',
        productName: 'Acme Platform',
      })
    ).toBe('acme_platform_analytics');
  });

  it('buildMcpServerName handles other multi-word product names', () => {
    expect(buildMcpServerName({ transport: 'stdio', productName: 'My Company Search' })).toBe(
      'my_company_search_local'
    );
    expect(buildMcpServerName({ transport: 'stdio', productName: 'Enterprise-AI-Platform' })).toBe(
      'enterprise_ai_platform_local'
    );
    expect(buildMcpServerName({ transport: 'stdio', productName: 'Search & Discovery' })).toBe(
      'search_discovery_local'
    );
  });
});
