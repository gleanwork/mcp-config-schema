import { describe, it, expect } from 'vitest';
import {
  extractServerNameFromUrl,
  buildMcpServerName,
  normalizeServerName,
} from '../src/server-name';

describe('Server Name Logic', () => {
  // extractServerNameFromUrl tests
  describe('extractServerNameFromUrl', () => {
    it('extracts server name from standard MCP URL', () => {
      expect(extractServerNameFromUrl('https://example.com/mcp/analytics')).toBe('analytics');
      expect(extractServerNameFromUrl('https://example.com/mcp/default')).toBe('default');
      expect(extractServerNameFromUrl('https://example.com/mcp/custom-agent')).toBe('custom-agent');
    });

    it('handles URLs with trailing slashes', () => {
      expect(extractServerNameFromUrl('https://example.com/mcp/analytics/')).toBe('analytics');
      expect(extractServerNameFromUrl('https://example.com/mcp/default/')).toBe('default');
    });

    it('handles URLs with additional path segments', () => {
      expect(extractServerNameFromUrl('https://example.com/mcp/analytics/v1')).toBe('analytics');
    });

    it('returns null for URLs without MCP path', () => {
      expect(extractServerNameFromUrl('https://example.com/api/v1')).toBeNull();
      expect(extractServerNameFromUrl('https://example.com/')).toBeNull();
    });
  });

  // buildMcpServerName tests
  describe('buildMcpServerName', () => {
    describe('stdio transport', () => {
      it('returns "local" for stdio transport', () => {
        expect(buildMcpServerName({ transport: 'stdio' })).toBe('local');
      });

      it('uses explicit serverName when provided', () => {
        expect(buildMcpServerName({ transport: 'stdio', serverName: 'custom' })).toBe('custom');
      });
    });

    describe('http transport with URL', () => {
      it('extracts server name from URL path', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://example.com/mcp/analytics',
          })
        ).toBe('analytics');
      });

      it('extracts "default" from default endpoint URL', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://example.com/mcp/default',
          })
        ).toBe('default');
      });

      it('handles custom-agent URLs', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://example.com/mcp/custom-agent',
          })
        ).toBe('custom-agent');
      });
    });

    describe('explicit serverName', () => {
      it('uses explicit serverName directly', () => {
        expect(buildMcpServerName({ serverName: 'custom' })).toBe('custom');
        expect(buildMcpServerName({ serverName: 'analytics' })).toBe('analytics');
      });

      it('serverName overrides URL extraction', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://example.com/mcp/analytics',
            serverName: 'custom',
          })
        ).toBe('custom');
      });
    });

    describe('fallback behavior', () => {
      it('returns "default" when no options match', () => {
        expect(buildMcpServerName({})).toBe('default');
      });

      it('returns "default" for http transport without URL', () => {
        expect(buildMcpServerName({ transport: 'http' })).toBe('default');
      });

      it('returns "default" for http with non-MCP URL', () => {
        expect(
          buildMcpServerName({
            transport: 'http',
            serverUrl: 'https://example.com/api/v1',
          })
        ).toBe('default');
      });
    });
  });

  // normalizeServerName tests
  describe('normalizeServerName', () => {
    it('converts to lowercase', () => {
      expect(normalizeServerName('CUSTOM')).toBe('custom');
      expect(normalizeServerName('Analytics')).toBe('analytics');
      expect(normalizeServerName('MyServer')).toBe('myserver');
    });

    it('replaces special characters with underscores', () => {
      expect(normalizeServerName('my server')).toBe('my_server');
      expect(normalizeServerName('my.server')).toBe('my_server');
      expect(normalizeServerName('my@server')).toBe('my_server');
      expect(normalizeServerName('my&server')).toBe('my_server');
    });

    it('preserves hyphens', () => {
      expect(normalizeServerName('my-server')).toBe('my-server');
      expect(normalizeServerName('custom-agent')).toBe('custom-agent');
    });

    it('collapses consecutive underscores', () => {
      expect(normalizeServerName('my   server')).toBe('my_server');
      expect(normalizeServerName('my___server')).toBe('my_server');
      expect(normalizeServerName('my...server')).toBe('my_server');
    });

    it('trims underscores from start and end', () => {
      expect(normalizeServerName('_server_')).toBe('server');
      expect(normalizeServerName('__server__')).toBe('server');
      expect(normalizeServerName(' server ')).toBe('server');
    });

    it('handles edge cases', () => {
      expect(normalizeServerName('')).toBe('default');
      expect(normalizeServerName('   ')).toBe('default');
    });

    it('preserves numbers', () => {
      expect(normalizeServerName('server123')).toBe('server123');
      expect(normalizeServerName('123')).toBe('123');
      expect(normalizeServerName('v2-api')).toBe('v2-api');
    });
  });
});
