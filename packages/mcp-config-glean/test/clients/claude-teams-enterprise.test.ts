import { describe, it, expect } from 'vitest';
import { createGleanRegistry } from '../../src/index.js';

/**
 * Claude for Teams/Enterprise: centrally managed by admins
 * createBuilder() throws an error - no local configuration support
 * MCP servers must be configured at the organization level
 */
describe('Client: claude-teams-enterprise (admin-managed only)', () => {
  const registry = createGleanRegistry();

  describe('createBuilder', () => {
    it('throws error because config is admin-managed', () => {
      expect(() =>
        registry.createBuilder('claude-teams-enterprise')
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: Cannot create builder for Claude for Teams/Enterprise: MCP servers are centrally managed by admins. No local configuration support - servers must be configured at the organization level.]`
      );
    });
  });
});
