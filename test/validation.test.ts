import { describe, it, expect } from 'vitest';
import {
  safeValidateClientConfig,
  safeValidateServerConfig,
  validateServerConfig,
} from '../src/schemas';

describe('Zod Validation', () => {
  describe('Client Config Validation', () => {
    it('should validate a correct client config', () => {
      const validConfig = {
        id: 'claude-code',
        name: 'claude-code',
        displayName: 'Claude Code',
        description: 'Test client',
        localConfigSupport: 'full',
        transports: ['http'],

        supportedPlatforms: ['darwin'],
        configFormat: 'json',
        configPath: {
          darwin: '/test/path',
        },
        configStructure: {
          serverKey: 'mcpServers',
          httpConfig: {
            urlField: 'url',
          },
        },
      };

      const result = safeValidateClientConfig(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid client ID', () => {
      const invalidConfig = {
        id: 'invalid-client',
        name: 'invalid',
        displayName: 'Invalid',
        description: 'Test',
        localConfigSupport: 'full',
        transports: ['http'],

        supportedPlatforms: ['darwin'],
        configFormat: 'json',
        configPath: { darwin: '/test' },
        configStructure: {
          serverKey: 'servers',
          httpConfig: { urlField: 'url' },
        },
      };

      const result = safeValidateClientConfig(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id']);
      }
    });

    it('should reject invalid local config support level', () => {
      const invalidConfig = {
        id: 'claude-code',
        name: 'claude-code',
        displayName: 'Claude Code',
        description: 'Test',
        localConfigSupport: 'partial', // Invalid
        transports: ['http'],

        supportedPlatforms: ['darwin'],
        configFormat: 'json',
        configPath: { darwin: '/test' },
        configStructure: {
          serverKey: 'servers',
          httpConfig: { urlField: 'url' },
        },
      };

      const result = safeValidateClientConfig(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['localConfigSupport']);
        expect(result.error.issues[0].message).toContain('"full"|"none"');
      }
    });

    it('should validate optional documentation URL', () => {
      const configWithUrl = {
        id: 'claude-code',
        name: 'claude-code',
        displayName: 'Claude Code',
        description: 'Test',
        localConfigSupport: 'full',
        documentationUrl: 'https://docs.example.com',
        transports: ['http'],

        supportedPlatforms: ['darwin'],
        configFormat: 'json',
        configPath: { darwin: '/test' },
        configStructure: {
          serverKey: 'servers',
          httpConfig: { urlField: 'url' },
        },
      };

      const result = safeValidateClientConfig(configWithUrl);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const configWithBadUrl = {
        id: 'claude-code',
        name: 'claude-code',
        displayName: 'Claude Code',
        description: 'Test',
        localConfigSupport: 'full',
        documentationUrl: 'not-a-url', // Invalid URL
        transports: ['http'],

        supportedPlatforms: ['darwin'],
        configFormat: 'json',
        configPath: { darwin: '/test' },
        configStructure: {
          serverKey: 'servers',
          httpConfig: { urlField: 'url' },
        },
      };

      const result = safeValidateClientConfig(configWithBadUrl);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['documentationUrl']);
      }
    });
  });

  describe('Server Config Validation', () => {
    it('should validate remote server config', () => {
      const config = {
        transport: 'http',
        serverUrl: 'https://glean.com/mcp/default',
        serverName: 'glean',
      };

      const result = safeValidateServerConfig(config);
      expect(result.success).toBe(true);
    });

    it('should validate local server config', () => {
      const config = {
        transport: 'stdio',
        instance: 'my-company',
        apiToken: 'test-token',
      };

      const result = safeValidateServerConfig(config);
      expect(result.success).toBe(true);
    });

    it('should reject invalid transport', () => {
      const config = {
        transport: 'hybrid' as any, // Invalid
        serverUrl: 'https://glean.com/mcp/default',
      };

      const result = safeValidateServerConfig(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['transport']);
      }
    });

    it('should reject invalid URL in server config', () => {
      const config = {
        transport: 'http',
        serverUrl: 'not-a-url', // Invalid
      };

      const result = safeValidateServerConfig(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['serverUrl']);
      }
    });

    it('should throw on invalid config when using validateServerConfig', () => {
      const invalidConfig = {
        mode: 'invalid',
      };

      expect(() => validateServerConfig(invalidConfig)).toThrow();
    });
  });
});
