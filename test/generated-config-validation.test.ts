import { describe, it, expect } from 'vitest';
import {
  validateGeneratedConfig,
  safeValidateMcpServersConfig,
  safeValidateVsCodeConfig,
  safeValidateGooseConfig,
} from '../src/index';

describe('Generated Config Validation', () => {
  describe('McpServers Config Schema', () => {
    it('should validate valid HTTP config', () => {
      const config = {
        mcpServers: {
          glean: {
            type: 'http',
            url: 'https://example.com/mcp/default',
          },
        },
      };

      const result = safeValidateMcpServersConfig(config);
      expect(result.success).toBe(true);
    });

    it('should validate valid stdio config', () => {
      const config = {
        mcpServers: {
          glean: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@gleanwork/local-mcp-server'],
            env: {
              GLEAN_INSTANCE: 'my-company',
              GLEAN_API_TOKEN: 'test-token',
            },
          },
        },
      };

      const result = safeValidateMcpServersConfig(config);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL in HTTP config', () => {
      const config = {
        mcpServers: {
          glean: {
            type: 'http',
            url: 'not-a-url',
          },
        },
      };

      const result = safeValidateMcpServersConfig(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid URL');
      }
    });

    it('should reject missing required fields', () => {
      const config = {
        mcpServers: {
          glean: {
            type: 'stdio',
          },
        },
      };

      const result = safeValidateMcpServersConfig(config);
      expect(result.success).toBe(false);
    });
  });

  describe('VS Code Config Schema', () => {
    it('should validate valid VS Code config', () => {
      const config = {
        servers: {
          glean: {
            type: 'http',
            url: 'https://example.com/mcp/default',
          },
        },
      };

      const result = safeValidateVsCodeConfig(config);
      expect(result.success).toBe(true);
    });

    it('should reject config with wrong top-level key', () => {
      const config = {
        mcpServers: {
          glean: {
            type: 'http',
            url: 'https://example.com/mcp/default',
          },
        },
      };

      const result = safeValidateVsCodeConfig(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Goose Config Schema', () => {
    it('should validate valid Goose config', () => {
      const config = {
        extensions: {
          glean: {
            name: 'glean',
            cmd: 'npx',
            args: ['-y', 'mcp-remote', 'https://example.com/mcp/default'],
            type: 'stdio',
            timeout: 300,
            enabled: true,
            bundled: null,
            description: null,
            env_keys: [],
            envs: {},
          },
        },
      };

      const result = safeValidateGooseConfig(config);
      expect(result.success).toBe(true);
    });

    it('should reject config missing required Goose fields', () => {
      const config = {
        extensions: {
          glean: {
            name: 'glean',
            cmd: 'npx',
            args: ['-y', 'mcp-remote'],
          },
        },
      };

      const result = safeValidateGooseConfig(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Generic validateGeneratedConfig', () => {
    it('should validate Claude Code config', () => {
      const config = {
        mcpServers: {
          glean: {
            type: 'http',
            url: 'https://example.com/mcp/default',
          },
        },
      };

      const result = validateGeneratedConfig(config, 'claude-code');
      expect(result.success).toBe(true);
    });

    it('should validate VS Code config', () => {
      const config = {
        servers: {
          glean: {
            type: 'http',
            url: 'https://example.com/mcp/default',
          },
        },
      };

      const result = validateGeneratedConfig(config, 'vscode');
      expect(result.success).toBe(true);
    });

    it('should validate Goose config', () => {
      const config = {
        extensions: {
          glean: {
            name: 'glean',
            cmd: 'npx',
            args: ['-y', 'mcp-remote', 'https://example.com/mcp/default'],
            type: 'stdio',
            timeout: 300,
            enabled: true,
            bundled: null,
            description: null,
            env_keys: [],
            envs: {},
          },
        },
      };

      const result = validateGeneratedConfig(config, 'goose');
      expect(result.success).toBe(true);
    });

    it('should validate Cursor config', () => {
      const config = {
        mcpServers: {
          glean: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://example.com/mcp/default'],
          },
        },
      };

      const result = validateGeneratedConfig(config, 'cursor');
      expect(result.success).toBe(true);
    });

    it('should validate Windsurf config without type field', () => {
      const config = {
        mcpServers: {
          glean: {
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://example.com/mcp/default'],
          },
        },
      };

      const result = validateGeneratedConfig(config, 'windsurf');
      expect(result.success).toBe(true);
    });

    it('should reject unknown client ID', () => {
      const config = {
        mcpServers: {
          glean: {
            type: 'http',
            url: 'https://example.com/mcp/default',
          },
        },
      };

      const result = validateGeneratedConfig(config, 'unknown-client');
      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.issues[0].message).toContain('Unknown client ID');
      }
    });
  });
});
