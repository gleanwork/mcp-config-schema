import { z } from 'zod';
import {
  PlatformSchema,
  ClientIdSchema,
  SupportedTransportsSchema,
  ServerTypeSchema,
  LocalConfigSupportSchema,
  TransportSchema,
  HttpConfigStructureSchema,
  StdioConfigStructureSchema,
  ConfigStructureSchema,
  PlatformPathsSchema,
  MCPClientConfigSchema,
  GleanServerConfigSchema,
  BuildOptionsSchema,
  HttpServerConfigSchema,
  StdioServerConfigSchema,
  StdioServerConfigAltSchema,
  ServerConfigSchema,
  McpServersConfigSchema,
  VsCodeConfigSchema,
  GooseServerConfigSchema,
  GooseConfigSchema,
} from './schemas.js';

export type Platform = z.infer<typeof PlatformSchema>;
export type ClientId = z.infer<typeof ClientIdSchema>;
export type SupportedTransports = z.infer<typeof SupportedTransportsSchema>;
export type ServerType = z.infer<typeof ServerTypeSchema>;
export type LocalConfigSupport = z.infer<typeof LocalConfigSupportSchema>;
export type Transport = z.infer<typeof TransportSchema>;
export type HttpConfigStructure = z.infer<typeof HttpConfigStructureSchema>;
export type StdioConfigStructure = z.infer<typeof StdioConfigStructureSchema>;
export type ConfigStructure = z.infer<typeof ConfigStructureSchema>;
export type PlatformPaths = z.infer<typeof PlatformPathsSchema>;
export type MCPClientConfig = z.infer<typeof MCPClientConfigSchema>;
export type GleanServerConfig = z.infer<typeof GleanServerConfigSchema>;
export type BuildOptions = z.infer<typeof BuildOptionsSchema>;
export type HttpServerConfig = z.infer<typeof HttpServerConfigSchema>;
export type StdioServerConfig = z.infer<typeof StdioServerConfigSchema>;
export type StdioServerConfigAlt = z.infer<typeof StdioServerConfigAltSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type McpServersConfig = z.infer<typeof McpServersConfigSchema>;
export type VsCodeConfig = z.infer<typeof VsCodeConfigSchema>;
export type GooseServerConfig = z.infer<typeof GooseServerConfigSchema>;
export type GooseConfig = z.infer<typeof GooseConfigSchema>;
export interface ValidationResult {
  success: boolean;
  data?: unknown;
  error?: z.ZodError;
}

export {
  ClientIdSchema,
  PlatformSchema,
  SupportedTransportsSchema,
  ServerTypeSchema,
  LocalConfigSupportSchema,
  TransportSchema,
  MCPClientConfigSchema,
  PlatformPathsSchema,
  ConfigStructureSchema,
  HttpConfigStructureSchema,
  StdioConfigStructureSchema,
  GleanServerConfigSchema,
  BuildOptionsSchema,
  HttpServerConfigSchema,
  StdioServerConfigSchema,
  StdioServerConfigAltSchema,
  ServerConfigSchema,
  McpServersConfigSchema,
  VsCodeConfigSchema,
  GooseServerConfigSchema,
  GooseConfigSchema,
} from './schemas.js';

export {
  validateClientConfig,
  validateServerConfig,
  safeValidateClientConfig,
  safeValidateServerConfig,
  validateGeneratedConfig,
  validateMcpServersConfig,
  validateVsCodeConfig,
  validateGooseConfig,
  safeValidateMcpServersConfig,
  safeValidateVsCodeConfig,
  safeValidateGooseConfig,
} from './schemas.js';
