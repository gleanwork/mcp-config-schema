import { MCPClientConfig, GleanServerConfig, Platform, validateServerConfig } from './types.js';
import * as yaml from 'js-yaml';

function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions !== 'undefined' &&
    typeof process.versions.node !== 'undefined'
  );
}

export class ConfigBuilder {
  private platform: Platform;

  constructor(private config: MCPClientConfig) {
    this.platform = this.detectPlatform();
  }

  private detectPlatform(): Platform {
    if (isNodeEnvironment()) {
      try {
        return process.platform as Platform;
      } catch {
        // Ignore error and fall through to browser detection
      }
    }
    if (typeof globalThis !== 'undefined' && 'navigator' in globalThis) {
      const nav = (globalThis as Record<string, unknown>).navigator as { userAgent?: string };
      if (nav && nav.userAgent) {
        const ua = nav.userAgent.toLowerCase();
        if (ua.includes('mac')) return 'darwin';
        if (ua.includes('win')) return 'win32';
        return 'linux';
      }
    }
    return 'darwin';
  }

  buildConfiguration(gleanConfig: GleanServerConfig): string {
    if (this.config.localConfigSupport === 'none') {
      throw new Error(
        `${this.config.displayName} does not support local configuration. ` +
          `${this.config.localConfigNotes || 'Configuration must be done through other means.'}`
      );
    }

    const validatedConfig = validateServerConfig(gleanConfig);

    let configObj: Record<string, unknown> = {};

    if (validatedConfig.mode === 'local') {
      configObj = this.buildLocalConfig(validatedConfig);
    } else if (validatedConfig.mode === 'remote') {
      configObj = this.buildRemoteConfig(validatedConfig);
    } else {
      throw new Error(`Invalid server mode: ${validatedConfig.mode}`);
    }

    if (this.config.configFormat === 'json') {
      return JSON.stringify(configObj, null, 2);
    } else if (this.config.configFormat === 'yaml') {
      return yaml.dump(configObj);
    }

    throw new Error(`Unsupported config format: ${this.config.configFormat}`);
  }

  private buildLocalConfig(gleanConfig: GleanServerConfig): Record<string, unknown> {
    const { serverKey, stdioConfig } = this.config.configStructure;

    if (!stdioConfig) {
      throw new Error(`Client ${this.config.id} doesn't support local server configuration`);
    }

    const serverName = gleanConfig.serverName || 'glean';
    const serverConfig: Record<string, unknown> = {};

    serverConfig[stdioConfig.commandField] = 'npx';
    serverConfig[stdioConfig.argsField] = ['-y', '@gleanwork/local-mcp-server'];

    if (stdioConfig.typeField) {
      serverConfig[stdioConfig.typeField] = 'stdio';
    }

    if (stdioConfig.envField) {
      const env: Record<string, string> = {};

      if (gleanConfig.instance) {
        if (
          gleanConfig.instance.startsWith('http://') ||
          gleanConfig.instance.startsWith('https://')
        ) {
          env.GLEAN_URL = gleanConfig.instance;
        } else {
          env.GLEAN_INSTANCE = gleanConfig.instance;
        }
      }

      if (gleanConfig.apiToken) {
        env.GLEAN_API_TOKEN = gleanConfig.apiToken;
      }

      if (Object.keys(env).length > 0) {
        serverConfig[stdioConfig.envField] = env;
      }
    }

    if (this.config.id === 'goose') {
      return {
        extensions: {
          [serverName]: {
            name: serverName,
            ...serverConfig,
            type: 'stdio',
            timeout: 300,
            enabled: true,
            bundled: null,
            description: null,
            env_keys: [],
            envs: serverConfig.env || {},
          },
        },
      };
    }

    return {
      [serverKey]: {
        [serverName]: serverConfig,
      },
    };
  }

  private buildRemoteConfig(gleanConfig: GleanServerConfig): Record<string, unknown> {
    if (!gleanConfig.serverUrl) {
      throw new Error('Remote configuration requires serverUrl');
    }

    const { serverKey, httpConfig, stdioConfig } = this.config.configStructure;

    const serverName = gleanConfig.serverName || 'glean';

    if (
      httpConfig &&
      (this.config.clientSupports === 'http' || this.config.clientSupports === 'both')
    ) {
      const serverConfig: Record<string, unknown> = {};

      if (httpConfig.typeField) {
        serverConfig[httpConfig.typeField] = 'http';
      }

      serverConfig[httpConfig.urlField] = gleanConfig.serverUrl;

      return {
        [serverKey]: {
          [serverName]: serverConfig,
        },
      };
    } else if (stdioConfig) {
      const serverConfig: Record<string, unknown> = {};

      if (stdioConfig.typeField) {
        serverConfig[stdioConfig.typeField] = 'stdio';
      }

      serverConfig[stdioConfig.commandField] = 'npx';
      serverConfig[stdioConfig.argsField] = ['-y', 'mcp-remote', gleanConfig.serverUrl];

      if (this.config.id === 'goose') {
        return {
          extensions: {
            [serverName]: {
              name: serverName,
              ...serverConfig,
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
      }

      return {
        [serverKey]: {
          [serverName]: serverConfig,
        },
      };
    } else {
      throw new Error(`Client ${this.config.id} doesn't support remote server configuration`);
    }
  }

  getConfigPath(): string {
    if (!isNodeEnvironment()) {
      throw new Error('getConfigPath() is only available in Node.js environment');
    }

    if (this.config.localConfigSupport === 'none') {
      throw new Error(
        `${this.config.displayName} does not support local configuration. ` +
          `${this.config.localConfigNotes || 'Configuration must be done through other means.'}`
      );
    }

    const platformPath = this.config.configPath[this.platform];
    if (!platformPath) {
      throw new Error(`Platform ${this.platform} not supported for ${this.config.displayName}`);
    }

    return this.expandPath(platformPath);
  }

  private expandPath(filepath: string): string {
    const homedir = process.env.HOME || process.env.USERPROFILE || '';
    const sep = process.platform === 'win32' ? '\\' : '/';

    filepath = filepath.replace(/\$HOME/g, homedir);

    if (filepath.startsWith('~')) {
      filepath =
        homedir +
        (filepath.startsWith('~/') || filepath.startsWith('~\\') ? '' : sep) +
        filepath.slice(1);
    }

    filepath = filepath.replace(/%([^%]+)%/g, (_, envVar) => {
      return process.env[envVar] || '';
    });

    return filepath;
  }

  async writeConfiguration(gleanConfig: GleanServerConfig): Promise<void> {
    if (!isNodeEnvironment()) {
      throw new Error('writeConfiguration() is only available in Node.js environment');
    }

    if (this.config.localConfigSupport === 'none') {
      throw new Error(
        `${this.config.displayName} does not support local configuration. ` +
          `${this.config.localConfigNotes || 'Configuration must be done through other means.'}`
      );
    }

    const content = this.buildConfiguration(gleanConfig);
    const configPath = this.getConfigPath();

    const fs = await import('fs');
    const path = await import('path');
    const { mkdirp } = await import('mkdirp');
    const chalk = await import('chalk');

    await mkdirp(path.dirname(configPath));

    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      console.log(chalk.default.yellow(`📁 Backed up existing config to: ${backupPath}`));
    }

    fs.writeFileSync(configPath, content, 'utf-8');
    console.log(chalk.default.green(`✅ Configuration written to: ${configPath}`));

    if (this.config.requiresMcpRemoteForHttp && gleanConfig.mode === 'remote') {
      console.log(
        chalk.default.blue('\nℹ️  This client uses mcp-remote to connect to HTTP servers.')
      );
      console.log(chalk.default.blue('   Make sure mcp-remote is available via npx.'));
    }
  }
}
