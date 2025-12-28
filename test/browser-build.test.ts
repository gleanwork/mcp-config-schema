import { describe, it, expect } from 'vitest';
import * as browserExports from '../src/browser.js';

describe('Browser Build', () => {
  it('exports MCPConfigRegistry', () => {
    expect(browserExports.MCPConfigRegistry).toBeDefined();
  });

  it('exports validation functions', () => {
    expect(browserExports.validateClientConfig).toBeDefined();
    expect(browserExports.validateServerConfig).toBeDefined();
    expect(browserExports.safeValidateClientConfig).toBeDefined();
    expect(browserExports.safeValidateServerConfig).toBeDefined();
  });

  it('exports schema validation functions', () => {
    expect(browserExports.validateMcpServersConfig).toBeDefined();
    expect(browserExports.validateVsCodeConfig).toBeDefined();
    expect(browserExports.validateGooseConfig).toBeDefined();
    expect(browserExports.validateGeneratedConfig).toBeDefined();
  });

  it('exports CLIENT constants', () => {
    expect(browserExports.CLIENT).toBeDefined();
    expect(browserExports.CLIENT.CLAUDE_CODE).toBe('claude-code');
    expect(browserExports.CLIENT.CLAUDE_DESKTOP).toBe('claude-desktop');
    expect(browserExports.CLIENT.CLAUDE_TEAMS_ENTERPRISE).toBe('claude-teams-enterprise');
    expect(browserExports.CLIENT.CURSOR).toBe('cursor');
    expect(browserExports.CLIENT.VSCODE).toBe('vscode');
    expect(browserExports.CLIENT.WINDSURF).toBe('windsurf');
    expect(browserExports.CLIENT.GOOSE).toBe('goose');
    expect(browserExports.CLIENT.CHATGPT).toBe('chatgpt');
  });

  it('exports CLIENT_DISPLAY_NAME constants', () => {
    expect(browserExports.CLIENT_DISPLAY_NAME).toBeDefined();
    expect(browserExports.CLIENT_DISPLAY_NAME.CLAUDE_CODE).toBe('Claude Code');
    expect(browserExports.CLIENT_DISPLAY_NAME.CLAUDE_DESKTOP).toBe('Claude for Desktop');
    expect(browserExports.CLIENT_DISPLAY_NAME.CLAUDE_TEAMS_ENTERPRISE).toBe(
      'Claude for Teams/Enterprise'
    );
    expect(browserExports.CLIENT_DISPLAY_NAME.CURSOR).toBe('Cursor');
    expect(browserExports.CLIENT_DISPLAY_NAME.VSCODE).toBe('VS Code');
    expect(browserExports.CLIENT_DISPLAY_NAME.WINDSURF).toBe('Windsurf');
    expect(browserExports.CLIENT_DISPLAY_NAME.GOOSE).toBe('Goose');
    expect(browserExports.CLIENT_DISPLAY_NAME.CHATGPT).toBe('ChatGPT');
  });

  it('exports getDisplayName helper function', () => {
    expect(browserExports.getDisplayName).toBeDefined();
    expect(typeof browserExports.getDisplayName).toBe('function');
    expect(browserExports.getDisplayName(browserExports.CLIENT.CURSOR)).toBe('Cursor');
    expect(browserExports.getDisplayName(browserExports.CLIENT.CLAUDE_DESKTOP)).toBe(
      'Claude for Desktop'
    );
  });

  it('MCPConfigRegistry works without Node.js dependencies', () => {
    const registry = new browserExports.MCPConfigRegistry();

    expect(registry.getAllConfigs()).toBeDefined();
    expect(registry.getAllConfigs().length).toBeGreaterThan(0);

    const cursorConfig = registry.getConfig('cursor');
    expect(cursorConfig).toBeDefined();
    expect(cursorConfig?.displayName).toBe('Cursor');
  });

  it('Registry builders can generate configurations in browser', () => {
    const registry = new browserExports.MCPConfigRegistry();
    const builder = registry.createBuilder('cursor');

    expect(builder).toBeDefined();

    const config = builder.buildConfiguration({
      transport: 'http',
      serverUrl: 'https://example.com/mcp',
      serverName: 'test-server',
    });

    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
    expect(JSON.stringify(config)).toContain('test-server');
  });

  it('Registry builder methods work in browser environment', () => {
    const registry = new browserExports.MCPConfigRegistry();
    const builder = registry.createBuilder('cursor');

    // Main methods should be available
    expect(builder.buildConfiguration).toBeDefined();
    expect(typeof builder.buildConfiguration).toBe('function');
    expect(builder.toString).toBeDefined();
    expect(typeof builder.toString).toBe('function');
  });

  it('Registry builders can generate one-click URLs in browser', () => {
    const registry = new browserExports.MCPConfigRegistry();
    const cursorBuilder = registry.createBuilder('cursor');

    const config = {
      transport: 'http' as const,
      serverUrl: 'https://example.com/mcp/default',
      serverName: 'test-server',
    };

    const cursorUrl = cursorBuilder.buildOneClickUrl(config);
    expect(cursorUrl).toContain('cursor://anysphere.cursor-deeplink/mcp/install');
    expect(cursorUrl).toContain('name=glean_test-server');
    expect(cursorUrl).toContain('config=');
  });
});
