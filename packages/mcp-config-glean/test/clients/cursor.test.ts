import { describe, it, expect } from 'vitest';
import {
  createGleanRegistry,
  createGleanEnv,
  createGleanHeaders,
  buildGleanServerUrl,
} from '../../src/index.js';

/**
 * Cursor: commandBuilder client (no native CLI)
 * Uses GLEAN_REGISTRY_OPTIONS.commandBuilder for CLI commands
 */
describe('Client: cursor', () => {
  const registry = createGleanRegistry();
  const builder = registry.createBuilder('cursor');

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
      it('with token auth', () => {
        const command = builder.buildCommand({
          transport: 'stdio',
          env: createGleanEnv('my-company', 'my-api-token'),
        });

        expect(command).toMatchInlineSnapshot(
          `"npx -y @gleanwork/configure-mcp-server local --client cursor --env GLEAN_INSTANCE=my-company --env GLEAN_API_TOKEN=my-api-token"`
        );
      });

      it('with OAuth (instance only, no token)', () => {
        const command = builder.buildCommand({
          transport: 'stdio',
          env: createGleanEnv('my-company'),
        });

        expect(command).toMatchInlineSnapshot(
          `"npx -y @gleanwork/configure-mcp-server local --client cursor --env GLEAN_INSTANCE=my-company"`
        );
      });
    });

    describe('http transport', () => {
      it('with token auth', () => {
        const command = builder.buildCommand({
          transport: 'http',
          serverUrl: buildGleanServerUrl('my-company'),
          headers: createGleanHeaders('my-api-token'),
        });

        expect(command).toMatchInlineSnapshot(
          `"npx -y @gleanwork/configure-mcp-server remote --url https://my-company-be.glean.com/mcp/default --client cursor --token my-api-token"`
        );
      });

      it('with OAuth (URL only, no token)', () => {
        const command = builder.buildCommand({
          transport: 'http',
          serverUrl: buildGleanServerUrl('my-company'),
        });

        expect(command).toMatchInlineSnapshot(
          `"npx -y @gleanwork/configure-mcp-server remote --url https://my-company-be.glean.com/mcp/default --client cursor"`
        );
      });
    });
  });

  describe('supportsCliInstallation', () => {
    it('returns status', () => {
      const status = builder.supportsCliInstallation();
      expect(status).toMatchInlineSnapshot(`
        {
          "reason": "command_builder",
          "supported": true,
        }
      `);
    });
  });
});
