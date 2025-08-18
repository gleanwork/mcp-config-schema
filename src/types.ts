import { z } from 'zod';
import {
  PlatformSchema,
  ClientIdSchema,
  ClientConnectionSupportSchema,
  ServerTypeSchema,
  LocalConfigSupportSchema,
  ServerModeSchema,
  HttpConfigStructureSchema,
  StdioConfigStructureSchema,
  ConfigStructureSchema,
  PlatformPathsSchema,
  MCPClientConfigSchema,
  GleanServerConfigSchema,
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
export type ClientConnectionSupport = z.infer<typeof ClientConnectionSupportSchema>;
export type ServerType = z.infer<typeof ServerTypeSchema>;
export type LocalConfigSupport = z.infer<typeof LocalConfigSupportSchema>;
export type ServerMode = z.infer<typeof ServerModeSchema>;
export type HttpConfigStructure = z.infer<typeof HttpConfigStructureSchema>;
export type StdioConfigStructure = z.infer<typeof StdioConfigStructureSchema>;
export type ConfigStructure = z.infer<typeof ConfigStructureSchema>;
export type PlatformPaths = z.infer<typeof PlatformPathsSchema>;
export type MCPClientConfig = z.infer<typeof MCPClientConfigSchema>;
export type GleanServerConfig = z.infer<typeof GleanServerConfigSchema>;
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
  ClientConnectionSupportSchema,
  ServerTypeSchema,
  LocalConfigSupportSchema,
  ServerModeSchema,
  MCPClientConfigSchema,
  PlatformPathsSchema,
  ConfigStructureSchema,
  HttpConfigStructureSchema,
  StdioConfigStructureSchema,
  GleanServerConfigSchema,
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
