import { describe, it, expect } from 'vitest';
import {
  createGleanRegistry,
  createGleanEnv,
  createGleanHeaders,
  buildGleanServerUrl,
} from '../../src/index.js';

/**
 * JetBrains: IDE-managed client
 * No CLI installation - configured via IDE UI
 * buildCommand returns null for all cases
 */
describe('Client: jetbrains', () => {
  const registry = createGleanRegistry();
  const builder = registry.createBuilder('jetbrains');

  describe('buildConfiguration', () => {
    describe('stdio transport', () => {
      it('with token auth', () => {
        const config = builder.buildConfiguration({
          transport: 'stdio',
          env: createGleanEnv('my-company', 'my-api-token'),
        });

        expect(config).toMatchInlineSnapshot(`
          {
            "mcpServers": {
              "glean_local": {
                "args": [
                  "-y",
                  "@gleanwork/local-mcp-server",
                ],
                "command": "npx",
                "env": {
                  "GLEAN_API_TOKEN": "my-api-token",
                  "GLEAN_INSTANCE": "my-company",
                },
                "type": "stdio",
              },
            },
          }
        `);
      });

      it('with OAuth (instance only, no token)', () => {
        const config = builder.buildConfiguration({
          transport: 'stdio',
          env: createGleanEnv('my-company'),
        });

        expect(config).toMatchInlineSnapshot(`
          {
            "mcpServers": {
              "glean_local": {
                "args": [
                  "-y",
                  "@gleanwork/local-mcp-server",
                ],
                "command": "npx",
                "env": {
                  "GLEAN_INSTANCE": "my-company",
                },
                "type": "stdio",
              },
            },
          }
        `);
      });
    });

    describe('http transport', () => {
      it('with token auth', () => {
        const config = builder.buildConfiguration({
          transport: 'http',
          serverUrl: buildGleanServerUrl('my-company'),
          headers: createGleanHeaders('my-api-token'),
        });

        expect(config).toMatchInlineSnapshot(`
          {
            "mcpServers": {
              "glean_default": {
                "headers": {
                  "Authorization": "Bearer my-api-token",
                },
                "type": "http",
                "url": "https://my-company-be.glean.com/mcp/default",
              },
            },
          }
        `);
      });

      it('with OAuth (URL only, no token)', () => {
        const config = builder.buildConfiguration({
          transport: 'http',
          serverUrl: buildGleanServerUrl('my-company'),
        });

        expect(config).toMatchInlineSnapshot(`
          {
            "mcpServers": {
              "glean_default": {
                "type": "http",
                "url": "https://my-company-be.glean.com/mcp/default",
              },
            },
          }
        `);
      });
    });
  });

  describe('buildCommand', () => {
    describe('stdio transport', () => {
      it('with token auth returns null', () => {
        const command = builder.buildCommand({
          transport: 'stdio',
          env: createGleanEnv('my-company', 'my-api-token'),
        });

        expect(command).toMatchInlineSnapshot(`null`);
      });

      it('with OAuth returns null', () => {
        const command = builder.buildCommand({
          transport: 'stdio',
          env: createGleanEnv('my-company'),
        });

        expect(command).toMatchInlineSnapshot(`null`);
      });
    });

    describe('http transport', () => {
      it('with token auth returns null', () => {
        const command = builder.buildCommand({
          transport: 'http',
          serverUrl: buildGleanServerUrl('my-company'),
          headers: createGleanHeaders('my-api-token'),
        });

        expect(command).toMatchInlineSnapshot(`null`);
      });

      it('with OAuth returns null', () => {
        const command = builder.buildCommand({
          transport: 'http',
          serverUrl: buildGleanServerUrl('my-company'),
        });

        expect(command).toMatchInlineSnapshot(`null`);
      });
    });
  });

  describe('supportsCliInstallation', () => {
    it('returns unsupported status', () => {
      const status = builder.supportsCliInstallation();
      expect(status).toMatchInlineSnapshot(`
        {
          "message": "JetBrains AI Assistant is configured through IDE settings, not via CLI.",
          "reason": "no_config_path",
          "supported": false,
        }
      `);
    });
  });
});
