import { describe, it, expect } from 'vitest';
import {
  createMCPConfigFactory,
  examplePreset,
  MCPConfigRegistry,
  CLIENT,
} from '../src/index';
import type { MCPConfig } from '../src/types';

// Custom config for testing vendor-neutral usage
const testConfig: MCPConfig = {
  serverPackage: '@acme/mcp-server',
  cliPackage: '@acme/configure-mcp',
  envVars: {
    url: 'ACME_URL',
    instance: 'ACME_INSTANCE',
    token: 'ACME_TOKEN',
  },
  urlPattern: 'https://[instance].acme.com/mcp/[endpoint]',
};

// Alternative config for testing independence
const alternativeConfig: MCPConfig = {
  serverPackage: '@other/mcp-server',
  cliPackage: '@other/configure-mcp',
  envVars: {
    url: 'OTHER_URL',
    instance: 'OTHER_INSTANCE',
    token: 'OTHER_TOKEN',
  },
  urlPattern: 'https://[instance].other.com/mcp/[endpoint]',
};

describe('createMCPConfigFactory', () => {
  it('should create a configured MCP instance with custom config', () => {
    const mcp = createMCPConfigFactory(testConfig);

    expect(mcp).toBeDefined();
    expect(mcp.createBuilder).toBeDefined();
    expect(mcp.buildCommand).toBeDefined();
    expect(mcp.buildConfiguration).toBeDefined();
    expect(mcp.buildConfigurationString).toBeDefined();
  });

  it('should throw when config is null', () => {
    expect(() => createMCPConfigFactory(null as unknown as MCPConfig)).toThrow(
      'MCPConfig is required'
    );
  });

  it('should throw when config is undefined', () => {
    expect(() => createMCPConfigFactory(undefined as unknown as MCPConfig)).toThrow(
      'MCPConfig is required'
    );
  });

  it('should throw when config is not an object', () => {
    expect(() => createMCPConfigFactory('invalid' as unknown as MCPConfig)).toThrow(
      'MCPConfig must be an object'
    );
    expect(() => createMCPConfigFactory(123 as unknown as MCPConfig)).toThrow(
      'MCPConfig must be an object'
    );
    expect(() => createMCPConfigFactory([] as unknown as MCPConfig)).toThrow(
      'MCPConfig must be an object'
    );
  });

  it('should accept empty object config for HTTP-only usage', () => {
    const mcp = createMCPConfigFactory({});
    expect(mcp).toBeDefined();
  });

  it('should create independent instances', () => {
    const mcp1 = createMCPConfigFactory(testConfig);
    const mcp2 = createMCPConfigFactory(alternativeConfig);

    // Each instance should have its own registry
    expect(mcp1).not.toBe(mcp2);

    // Building config with mcp1 should use test config
    const config1 = mcp1.buildConfiguration(CLIENT.CURSOR, {
      transport: 'stdio',
      instance: 'test-instance',
      apiToken: 'test-token',
    });
    expect(config1.mcpServers.mcp_local.args).toContain('@acme/mcp-server');
    expect(config1.mcpServers.mcp_local.env.ACME_INSTANCE).toBe('test-instance');

    // Building config with mcp2 should use alternative config
    const config2 = mcp2.buildConfiguration(CLIENT.CURSOR, {
      transport: 'stdio',
      instance: 'test-instance',
      apiToken: 'test-token',
    });
    expect(config2.mcpServers.mcp_local.args).toContain('@other/mcp-server');
    expect(config2.mcpServers.mcp_local.env.OTHER_INSTANCE).toBe('test-instance');
  });

  it('should use custom serverPackage for stdio config', () => {
    const mcp = createMCPConfigFactory(testConfig);
    const builder = mcp.createBuilder(CLIENT.CLAUDE_CODE);

    const config = builder.buildConfiguration({
      transport: 'stdio',
      instance: 'my-company',
      apiToken: 'secret-token',
    });

    const serverConfig = config.mcpServers.mcp_local;
    expect(serverConfig.args).toContain('@acme/mcp-server');
    expect(serverConfig.env).toEqual({
      ACME_INSTANCE: 'my-company',
      ACME_TOKEN: 'secret-token',
    });
  });

  it('should use custom cliPackage for CLI commands', () => {
    const mcp = createMCPConfigFactory(testConfig);

    const command = mcp.buildCommand(CLIENT.CURSOR, {
      transport: 'http',
      serverUrl: 'https://example.com/mcp/default',
      apiToken: 'test-token',
    });

    expect(command).toContain('@acme/configure-mcp');
    expect(command).toContain('--url https://example.com/mcp/default');
  });

  it('should use custom envVars for URL-style instances', () => {
    const mcp = createMCPConfigFactory(testConfig);
    const builder = mcp.createBuilder(CLIENT.VSCODE);

    const config = builder.buildConfiguration({
      transport: 'stdio',
      instance: 'https://custom.acme.com',
      apiToken: 'token123',
    });

    const serverConfig = config.servers.mcp_local;
    expect(serverConfig.env.ACME_URL).toBe('https://custom.acme.com');
    expect(serverConfig.env.ACME_INSTANCE).toBeUndefined();
  });

  it('should use custom urlPattern for placeholder URLs', () => {
    const mcp = createMCPConfigFactory(testConfig);

    const command = mcp.buildCommand(CLIENT.VSCODE, {
      transport: 'http',
      serverName: 'test',
    });

    // Should use the custom URL pattern as fallback
    expect(command).toContain('https://[instance].acme.com/mcp/[endpoint]');
  });

  it('should work with examplePreset', () => {
    const mcp = createMCPConfigFactory(examplePreset);
    const builder = mcp.createBuilder(CLIENT.CURSOR);

    const config = builder.buildConfiguration({
      transport: 'stdio',
      instance: 'test-company',
      apiToken: 'test-token',
    });

    expect(config.mcpServers.mcp_local.args).toContain('@example/mcp-server');
    expect(config.mcpServers.mcp_local.env.EXAMPLE_INSTANCE).toBe('test-company');
    expect(config.mcpServers.mcp_local.env.EXAMPLE_API_TOKEN).toBe('test-token');
  });
});

describe('Partial config', () => {
  it('should work with only serverPackage', () => {
    const mcp = createMCPConfigFactory({
      serverPackage: '@minimal/mcp-server',
    });

    const builder = mcp.createBuilder(CLIENT.CLAUDE_CODE);
    const config = builder.buildConfiguration({
      transport: 'stdio',
      instance: 'test',
    });

    expect(config.mcpServers.mcp_local.args).toContain('@minimal/mcp-server');
  });

  it('should throw when only envVars provided for stdio (no serverPackage)', () => {
    const mcp = createMCPConfigFactory({
      envVars: {
        instance: 'CUSTOM_INSTANCE',
        token: 'CUSTOM_TOKEN',
      },
    });

    const builder = mcp.createBuilder(CLIENT.CURSOR);

    // stdio transport requires serverPackage to be configured
    expect(() =>
      builder.buildConfiguration({
        transport: 'stdio',
        instance: 'my-instance',
        apiToken: 'my-token',
      })
    ).toThrow('No server package configured');
  });
});

describe('HTTP configurations', () => {
  it('should generate HTTP config without needing serverPackage', () => {
    const mcp = createMCPConfigFactory({});
    const builder = mcp.createBuilder(CLIENT.CLAUDE_CODE);

    const config = builder.buildConfiguration({
      transport: 'http',
      serverUrl: 'https://example.com/mcp/default',
      apiToken: 'test-token',
    });

    expect(config.mcpServers.mcp_default.type).toBe('http');
    expect(config.mcpServers.mcp_default.url).toBe('https://example.com/mcp/default');
  });

  it('should add bearer token to HTTP config', () => {
    const mcp = createMCPConfigFactory({});
    const builder = mcp.createBuilder(CLIENT.VSCODE);

    const config = builder.buildConfiguration({
      transport: 'http',
      serverUrl: 'https://example.com/mcp/default',
      apiToken: 'secret-token',
    });

    expect(config.servers.mcp_default.headers.Authorization).toBe('Bearer secret-token');
  });
});

describe('Registry access', () => {
  it('should provide access to underlying registry', () => {
    const mcp = createMCPConfigFactory(testConfig);

    // Registry methods should be accessible
    expect(mcp.getConfig(CLIENT.CURSOR)).toBeDefined();
    expect(mcp.getAllConfigs().length).toBeGreaterThan(0);
    expect(mcp.hasClient(CLIENT.VSCODE)).toBe(true);
  });

  it('should support clientNeedsMcpRemote check', () => {
    const mcp = createMCPConfigFactory(testConfig);

    // Claude Desktop needs mcp-remote for HTTP
    expect(mcp.clientNeedsMcpRemote(CLIENT.CLAUDE_DESKTOP)).toBe(true);
    // Claude Code has native HTTP support
    expect(mcp.clientNeedsMcpRemote(CLIENT.CLAUDE_CODE)).toBe(false);
  });

  it('should support clientSupportsHttpNatively check', () => {
    const mcp = createMCPConfigFactory(testConfig);

    expect(mcp.clientSupportsHttpNatively(CLIENT.VSCODE)).toBe(true);
    expect(mcp.clientSupportsHttpNatively(CLIENT.CLAUDE_DESKTOP)).toBe(false);
  });
});

describe('Direct MCPConfigRegistry usage', () => {
  it('should work with mcpConfig option', () => {
    const registry = new MCPConfigRegistry({ mcpConfig: testConfig });
    const builder = registry.createBuilder(CLIENT.CURSOR);

    const config = builder.buildConfiguration({
      transport: 'stdio',
      instance: 'direct-test',
      apiToken: 'test-token',
    });

    expect(config.mcpServers.mcp_local.args).toContain('@acme/mcp-server');
    expect(config.mcpServers.mcp_local.env.ACME_INSTANCE).toBe('direct-test');
  });

  it('should work without mcpConfig for HTTP-only usage', () => {
    const registry = new MCPConfigRegistry();
    const builder = registry.createBuilder(CLIENT.CLAUDE_CODE);

    // HTTP config doesn't require serverCommand or envVars
    const config = builder.buildConfiguration({
      transport: 'http',
      serverUrl: 'https://example.com/mcp/default',
    });

    expect(config.mcpServers.mcp_default.type).toBe('http');
    expect(config.mcpServers.mcp_default.url).toBe('https://example.com/mcp/default');
  });

  it('should throw for stdio without serverPackage', () => {
    const registry = new MCPConfigRegistry();
    const builder = registry.createBuilder(CLIENT.CURSOR);

    // Stdio requires serverPackage - without it, should throw
    expect(() =>
      builder.buildConfiguration({
        transport: 'stdio',
        instance: 'test',
      })
    ).toThrow('No server package configured');
  });

  it('should skip registry built-in configs when loadBuiltInConfigs is false', () => {
    const registry = new MCPConfigRegistry({ loadBuiltInConfigs: false });

    expect(registry.getAllConfigs().length).toBe(0);
    expect(registry.hasClient(CLIENT.CURSOR)).toBe(false);
  });

  it('should allow registering custom clients', () => {
    const registry = new MCPConfigRegistry({ mcpConfig: testConfig });

    registry.registerClient({
      id: 'my-custom-ide',
      name: 'my-custom-ide',
      displayName: 'My Custom IDE',
      description: 'A custom IDE with MCP support',
      userConfigurable: true,
      transports: ['stdio', 'http'],
      supportedPlatforms: ['darwin', 'linux', 'win32'],
      configFormat: 'json',
      configPath: {
        darwin: '$HOME/.my-ide/mcp.json',
        linux: '$HOME/.my-ide/mcp.json',
        win32: '%USERPROFILE%\\.my-ide\\mcp.json',
      },
      configStructure: {
        serversPropertyName: 'servers',
        httpPropertyMapping: {
          typeProperty: 'type',
          urlProperty: 'url',
          headersProperty: 'headers',
        },
        stdioPropertyMapping: {
          typeProperty: 'type',
          commandProperty: 'command',
          argsProperty: 'args',
          envProperty: 'env',
        },
      },
    });

    expect(registry.hasClient('my-custom-ide')).toBe(true);

    const builder = registry.createBuilder('my-custom-ide');
    const config = builder.buildConfiguration({
      transport: 'http',
      serverUrl: 'https://example.com/mcp/api',
      serverName: 'test',
    });

    expect(config.servers.mcp_test).toBeDefined();
  });
});

describe('examplePreset', () => {
  it('should have correct serverPackage', () => {
    expect(examplePreset.serverPackage).toBe('@example/mcp-server');
  });

  it('should have correct cliPackage', () => {
    expect(examplePreset.cliPackage).toBe('@example/configure-mcp');
  });

  it('should have correct envVars', () => {
    expect(examplePreset.envVars).toEqual({
      url: 'EXAMPLE_URL',
      instance: 'EXAMPLE_INSTANCE',
      token: 'EXAMPLE_API_TOKEN',
    });
  });

  it('should have correct urlPattern', () => {
    expect(examplePreset.urlPattern).toBe('https://[instance].example.com/mcp/[endpoint]');
  });
});
