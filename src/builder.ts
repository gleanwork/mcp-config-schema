import { MCPClientConfig, GleanServerConfig, Platform } from './types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { mkdirp } from 'mkdirp';
import chalk from 'chalk';

export class ConfigBuilder {
  private platform: Platform;

  constructor(private config: MCPClientConfig) {
    this.platform = os.platform() as Platform;
  }

  buildConfiguration(gleanConfig: GleanServerConfig): string {
    const serverName = gleanConfig.serverName || 'glean';
    let configObj: Record<string, unknown> = {};

    if (this.config.clientSupports === 'http' || this.config.clientSupports === 'both') {
      configObj = this.buildHttpConfig(serverName, gleanConfig.serverUrl);
    } else if (this.config.clientSupports === 'stdio-only') {
      configObj = this.buildMcpRemoteConfig(serverName, gleanConfig.serverUrl);
    }

    if (this.config.configFormat === 'json') {
      return JSON.stringify(configObj, null, 2);
    } else if (this.config.configFormat === 'yaml') {
      return yaml.dump(configObj);
    }

    throw new Error(`Unsupported config format: ${this.config.configFormat}`);
  }

  private buildHttpConfig(serverName: string, serverUrl: string): Record<string, unknown> {
    const { serverKey, serverNameKey, httpConfig } = this.config.configStructure;

    if (!httpConfig) {
      throw new Error(`Client ${this.config.id} doesn't have HTTP config structure defined`);
    }

    const serverConfig: Record<string, unknown> = {};

    if (httpConfig.typeField) {
      serverConfig[httpConfig.typeField] = 'http';
    }

    serverConfig[httpConfig.urlField] = serverUrl;

    return {
      [serverKey]: {
        [serverNameKey]: serverConfig,
      },
    };
  }

  private buildMcpRemoteConfig(serverName: string, serverUrl: string): Record<string, unknown> {
    const { serverKey, serverNameKey, stdioConfig } = this.config.configStructure;

    if (!stdioConfig) {
      throw new Error(`Client ${this.config.id} doesn't have stdio config structure defined`);
    }

    if (this.config.id === 'goose') {
      return {
        extensions: {
          [serverNameKey]: {
            name: serverNameKey,
            [stdioConfig.commandField]: 'npx',
            [stdioConfig.argsField]: ['-y', 'mcp-remote', serverUrl],
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

    const serverConfig: Record<string, unknown> = {};

    if (stdioConfig.typeField) {
      serverConfig[stdioConfig.typeField] = 'stdio';
    }

    serverConfig[stdioConfig.commandField] = 'npx';
    serverConfig[stdioConfig.argsField] = ['-y', 'mcp-remote', serverUrl];

    return {
      [serverKey]: {
        [serverNameKey]: serverConfig,
      },
    };
  }

  getConfigPath(): string {
    const platformPath = this.config.configPath[this.platform];
    if (!platformPath) {
      throw new Error(`Platform ${this.platform} not supported for ${this.config.displayName}`);
    }

    return this.expandPath(platformPath);
  }

  private expandPath(filepath: string): string {
    filepath = filepath.replace(/\$HOME/g, os.homedir());

    if (filepath.startsWith('~')) {
      filepath = path.join(os.homedir(), filepath.slice(1));
    }

    filepath = filepath.replace(/%([^%]+)%/g, (_, envVar) => {
      return process.env[envVar] || '';
    });

    return filepath;
  }

  async writeConfiguration(gleanConfig: GleanServerConfig): Promise<void> {
    const content = this.buildConfiguration(gleanConfig);
    const configPath = this.getConfigPath();

    await mkdirp(path.dirname(configPath));

    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      console.log(chalk.yellow(`📁 Backed up existing config to: ${backupPath}`));
    }

    fs.writeFileSync(configPath, content, 'utf-8');
    console.log(chalk.green(`✅ Configuration written to: ${configPath}`));

    if (this.config.requiresMcpRemoteForHttp) {
      console.log(chalk.blue('\nℹ️  This client uses mcp-remote to connect to HTTP servers.'));
      console.log(chalk.blue('   Make sure mcp-remote is available via npx.'));
    }
  }

  generateExample(): string {
    const exampleConfig: GleanServerConfig = {
      serverUrl: 'https://your-company.glean.com/mcp/default',
      serverName: 'glean',
    };

    return this.buildConfiguration(exampleConfig);
  }

  needsMcpRemote(): boolean {
    return this.config.requiresMcpRemoteForHttp;
  }

  getConnectionCommand(): string {
    if (this.config.requiresMcpRemoteForHttp) {
      return 'npx -y mcp-remote <server-url>';
    } else {
      return 'Direct HTTP connection';
    }
  }
}
