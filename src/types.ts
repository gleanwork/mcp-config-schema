export type ClientId =
  | 'claude-code'
  | 'vscode'
  | 'claude-desktop'
  | 'claude-desktop-org'
  | 'cursor'
  | 'goose'
  | 'windsurf'
  | 'chatgpt';

export type ClientConnectionSupport = 'http' | 'stdio-only' | 'both';
export type ServerType = 'http' | 'stdio';
export type CompatibilityLevel = 'full' | 'none' | 'investigating';
export type Platform = 'darwin' | 'linux' | 'win32';

export interface MCPClientConfig {
  id: ClientId;
  name: string;
  displayName: string;
  description: string;
  compatibility: CompatibilityLevel;
  compatibilityNotes?: string;

  clientSupports: ClientConnectionSupport;

  requiresMcpRemoteForHttp: boolean;

  supportedPlatforms: Platform[];
  configFormat: 'json' | 'yaml';
  configPath: PlatformPaths;
  oneClickProtocol?: string;
  configStructure: ConfigStructure;
  securityNotes?: string;
}

export interface PlatformPaths {
  darwin?: string;
  linux?: string;
  win32?: string;
}

export interface ConfigStructure {
  serverKey: string;
  serverNameKey: string;
  httpConfig?: HttpConfigStructure;
  stdioConfig?: StdioConfigStructure;
}

export interface HttpConfigStructure {
  typeField?: string;
  urlField: string;
}

export interface StdioConfigStructure {
  typeField?: string;
  commandField: string;
  argsField: string;
  envField?: string;
}

export interface GleanServerConfig {
  serverUrl: string;
  serverName?: string;
}
