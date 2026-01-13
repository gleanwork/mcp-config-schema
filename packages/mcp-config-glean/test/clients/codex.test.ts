import { describe, it, expect } from 'vitest';
import {
  createGleanRegistry,
  createGleanEnv,
  createGleanHeaders,
  buildGleanServerUrl,
} from '../../src/index.js';

/**
 * Codex: native CLI client
 * Has native `codex mcp add` command - uses schema's native command generation
 * Uses { mcp_servers: {...} } format (snake_case)
 */
describe('Client: codex', () => {
  const registry = createGleanRegistry();
  const builder = registry.createBuilder('codex');

  describe('buildConfiguration', () => {
    describe('stdio transport', () => {
      it('with token auth', () => {
        const config = builder.buildConfiguration({
          transport: 'stdio',
          env: createGleanEnv('my-company', 'my-api-token'),
        });

        expect(config).toMatchInlineSnapshot(`
          {
            "mcp_servers": {
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
            "mcp_servers": {
              "glean_local": {
                "args": [
                  "-y",
                  "@gleanwork/local-mcp-server",
                ],
                "command": "npx",
                "env": {
                  "GLEAN_INSTANCE": "my-company",
                },
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
            "mcp_servers": {
              "glean_default": {
                "http_headers": {
                  "Authorization": "Bearer my-api-token",
                },
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
            "mcp_servers": {
              "glean_default": {
                "url": "https://my-company-be.glean.com/mcp/default",
              },
            },
          }
        `);
      });
    });
  });

  describe('buildCommand (native CLI)', () => {
    describe('stdio transport', () => {
      it('with token auth', () => {
        const command = builder.buildCommand({
          transport: 'stdio',
          env: createGleanEnv('my-company', 'my-api-token'),
        });

        expect(command).toMatchInlineSnapshot(
          `"codex mcp add glean_local --env GLEAN_INSTANCE=my-company --env GLEAN_API_TOKEN=my-api-token -- npx -y @gleanwork/local-mcp-server"`
        );
      });

      it('with OAuth (instance only, no token)', () => {
        const command = builder.buildCommand({
          transport: 'stdio',
          env: createGleanEnv('my-company'),
        });

        expect(command).toMatchInlineSnapshot(
          `"codex mcp add glean_local --env GLEAN_INSTANCE=my-company -- npx -y @gleanwork/local-mcp-server"`
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
          `"codex mcp add --url https://my-company-be.glean.com/mcp/default glean_default"`
        );
      });

      it('with OAuth (URL only, no token)', () => {
        const command = builder.buildCommand({
          transport: 'http',
          serverUrl: buildGleanServerUrl('my-company'),
        });

        expect(command).toMatchInlineSnapshot(
          `"codex mcp add --url https://my-company-be.glean.com/mcp/default glean_default"`
        );
      });
    });
  });

  describe('supportsCliInstallation', () => {
    it('returns status', () => {
      const status = builder.supportsCliInstallation();
      expect(status).toMatchInlineSnapshot(`
        {
          "reason": "native_cli",
          "supported": true,
        }
      `);
    });
  });
});
