import { z } from 'zod';
import {
  PlatformSchema,
  ClientIdSchema,
  SupportedTransportsSchema,
  ServerTypeSchema,
  TransportSchema,
  HttpConfigStructureSchema,
  StdioConfigStructureSchema,
  ConfigStructureSchema,
  PlatformPathsSchema,
  MCPClientConfigSchema,
  MCPConnectionOptionsSchema,
  BuildOptionsSchema,
  HttpServerConfigSchema,
  HttpServerConfigAltSchema,
  StdioServerConfigSchema,
  StdioServerConfigAltSchema,
  ServerConfigSchema,
  McpServersConfigSchema,
  VsCodeConfigSchema,
  GooseServerConfigSchema,
  GooseConfigSchema,
  GeminiHttpServerConfigSchema,
  GeminiStdioServerConfigSchema,
  GeminiServerConfigSchema,
  GeminiConfigSchema,
} from './schemas.js';

/**
 * Options for creating an MCPConfigRegistry.
 * These options configure how stdio transport configurations are generated.
 */
export interface RegistryOptions {
  /** NPM package for stdio server (e.g., '@my-org/mcp-server') */
  serverPackage?: string;
  /** NPM package for CLI tool (e.g., '@my-org/configure-mcp') */
  cliPackage?: string;
}

export type Platform = z.infer<typeof PlatformSchema>;
export type ClientId = z.infer<typeof ClientIdSchema>;
export type SupportedTransports = z.infer<typeof SupportedTransportsSchema>;
export type ServerType = z.infer<typeof ServerTypeSchema>;
export type Transport = z.infer<typeof TransportSchema>;
export type HttpConfigStructure = z.infer<typeof HttpConfigStructureSchema>;
export type StdioConfigStructure = z.infer<typeof StdioConfigStructureSchema>;
export type ConfigStructure = z.infer<typeof ConfigStructureSchema>;
export type PlatformPaths = z.infer<typeof PlatformPathsSchema>;
export type MCPClientConfig = z.infer<typeof MCPClientConfigSchema>;
export type MCPConnectionOptions = z.infer<typeof MCPConnectionOptionsSchema>;
/** @deprecated Use MCPConnectionOptions instead */
export type MCPServerConfig = MCPConnectionOptions;
export type BuildOptions = z.infer<typeof BuildOptionsSchema>;
export type HttpServerConfig = z.infer<typeof HttpServerConfigSchema>;
export type HttpServerConfigAlt = z.infer<typeof HttpServerConfigAltSchema>;
export type StdioServerConfig = z.infer<typeof StdioServerConfigSchema>;
export type StdioServerConfigAlt = z.infer<typeof StdioServerConfigAltSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type McpServersConfig = z.infer<typeof McpServersConfigSchema>;
export type VsCodeConfig = z.infer<typeof VsCodeConfigSchema>;
export type GooseServerConfig = z.infer<typeof GooseServerConfigSchema>;
export type GooseConfig = z.infer<typeof GooseConfigSchema>;
export type GeminiHttpServerConfig = z.infer<typeof GeminiHttpServerConfigSchema>;
export type GeminiStdioServerConfig = z.infer<typeof GeminiStdioServerConfigSchema>;
export type GeminiServerConfig = z.infer<typeof GeminiServerConfigSchema>;
export type GeminiConfig = z.infer<typeof GeminiConfigSchema>;
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
  TransportSchema,
  MCPClientConfigSchema,
  PlatformPathsSchema,
  ConfigStructureSchema,
  HttpConfigStructureSchema,
  StdioConfigStructureSchema,
  MCPConnectionOptionsSchema,
  MCPServerConfigSchema,
  BuildOptionsSchema,
  HttpServerConfigSchema,
  HttpServerConfigAltSchema,
  StdioServerConfigSchema,
  StdioServerConfigAltSchema,
  ServerConfigSchema,
  McpServersConfigSchema,
  VsCodeConfigSchema,
  GooseServerConfigSchema,
  GooseConfigSchema,
  GeminiHttpServerConfigSchema,
  GeminiStdioServerConfigSchema,
  GeminiServerConfigSchema,
  GeminiConfigSchema,
} from './schemas.js';

export {
  validateClientConfig,
  validateConnectionOptions,
  validateServerConfig,
  safeValidateClientConfig,
  safeValidateConnectionOptions,
  safeValidateServerConfig,
  validateGeneratedConfig,
  validateMcpServersConfig,
  validateVsCodeConfig,
  validateGooseConfig,
  validateGeminiConfig,
  safeValidateMcpServersConfig,
  safeValidateVsCodeConfig,
  safeValidateGooseConfig,
  safeValidateGeminiConfig,
} from './schemas.js';
