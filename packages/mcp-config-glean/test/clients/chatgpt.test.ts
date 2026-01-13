import { describe, it, expect } from 'vitest';
import { createGleanRegistry } from '../../src/index.js';

/**
 * ChatGPT: web-based client with no local config support
 * createBuilder() throws an error - configuration must be done via web UI
 */
describe('Client: chatgpt (web-based only)', () => {
  const registry = createGleanRegistry();

  describe('createBuilder', () => {
    it('throws error because ChatGPT requires web UI configuration', () => {
      expect(() => registry.createBuilder('chatgpt')).toThrowErrorMatchingInlineSnapshot(
        `[Error: Cannot create builder for ChatGPT: ChatGPT is web-based and requires configuring MCP servers through their web UI. No local configuration file support.]`
      );
    });
  });
});
