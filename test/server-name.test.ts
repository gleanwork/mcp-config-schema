import { describe, it, expect } from 'vitest';
import {
  extractServerNameFromUrl,
  buildMcpServerName,
  normalizeServerName,
} from '../src/server-name';

describe('Server Name Logic', () => {
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
  });
});
