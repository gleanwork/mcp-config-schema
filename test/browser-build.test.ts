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

  it('exports ConfigBuilder', () => {
    expect(browserExports.ConfigBuilder).toBeDefined();
  });

  it('MCPConfigRegistry works without Node.js dependencies', () => {
    const registry = new browserExports.MCPConfigRegistry();
    
    expect(registry.getAllConfigs()).toBeDefined();
    expect(registry.getAllConfigs().length).toBeGreaterThan(0);
    
    const cursorConfig = registry.getConfig('cursor');
    expect(cursorConfig).toBeDefined();
    expect(cursorConfig?.displayName).toBe('Cursor');
  });

  it('ConfigBuilder can generate configurations in browser', () => {
    const registry = new browserExports.MCPConfigRegistry();
    const builder = registry.createBuilder('cursor');
    
    expect(builder).toBeDefined();
    
    const config = builder.buildConfiguration({
      mode: 'remote',
      serverUrl: 'https://example.com/mcp',
      serverName: 'test-server'
    });
    
    expect(config).toBeDefined();
    expect(typeof config).toBe('string');
    expect(config).toContain('test-server');
  });

  it('ConfigBuilder.writeConfiguration is properly guarded', () => {
    const registry = new browserExports.MCPConfigRegistry();
    const builder = registry.createBuilder('cursor');
    
    expect(builder.writeConfiguration).toBeDefined();
    expect(typeof builder.writeConfiguration).toBe('function');
  });
});
