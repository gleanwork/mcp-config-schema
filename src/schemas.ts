import { z } from 'zod';
export const PlatformSchema = z.enum(['darwin', 'linux', 'win32']);
export const ClientIdSchema = z.enum([
  'claude-code',
  'vscode',
  'claude-desktop',
  'claude-teams-enterprise',
  'cursor',
  'goose',
  'windsurf',
  'chatgpt',
]);

export const ServerTypeSchema = z.enum(['http', 'stdio']);

export const LocalConfigSupportSchema = z.enum(['full', 'none']);

export const TransportSchema = z.enum(['stdio', 'http']);
export const SupportedTransportsSchema = z.array(TransportSchema).min(1);
export const HttpConfigStructureSchema = z.object({
  typeField: z.string().optional(),
  urlField: z.string(),
  headersField: z.string().optional(),
});

export const StdioConfigStructureSchema = z.object({
  typeField: z.string().optional(),
  commandField: z.string(),
  argsField: z.string(),
  envField: z.string().optional(),
});

export const ConfigStructureSchema = z.object({
  serverKey: z.string(),
  httpConfig: HttpConfigStructureSchema.optional(),
  stdioConfig: StdioConfigStructureSchema.optional(),
});

export const PlatformPathsSchema = z.object({
  darwin: z.string().optional(),
  linux: z.string().optional(),
  win32: z.string().optional(),
});

export const MCPClientConfigSchema = z.object({
  id: ClientIdSchema,
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  localConfigSupport: LocalConfigSupportSchema,
  localConfigNotes: z.string().optional(),
  documentationUrl: z.string().url().optional(),
  transports: SupportedTransportsSchema,
  supportedPlatforms: z.array(PlatformSchema),
  configFormat: z.enum(['json', 'yaml']),
  configPath: PlatformPathsSchema,
  oneClick: z
    .object({
      protocol: z.string(),
      urlTemplate: z.string(),
      configFormat: z.enum(['base64-json', 'url-encoded-json']),
    })
    .optional(),
  configStructure: ConfigStructureSchema,
  securityNotes: z.string().optional(),
});

export const BuildOptionsSchema = z.object({
  includeWrapper: z.boolean().optional(),
  mcpRemoteVersion: z.string().optional(),
  configureMcpServerVersion: z.string().optional(),
});

export const GleanServerConfigSchema = z
  .object({
    transport: TransportSchema,
    serverUrl: z.string().optional(), // Accept any string, not just valid URLs
    serverName: z.string().optional(),
    instance: z.string().optional(),
    apiToken: z.string().optional(),
  })
  .merge(BuildOptionsSchema);

export function validateClientConfig(data: unknown) {
  return MCPClientConfigSchema.parse(data);
}

export function validateServerConfig(data: unknown) {
  return GleanServerConfigSchema.parse(data);
}

export function safeValidateClientConfig(data: unknown) {
  return MCPClientConfigSchema.safeParse(data);
}

export function safeValidateServerConfig(data: unknown) {
  return GleanServerConfigSchema.safeParse(data);
}

export const HttpServerConfigSchema = z.object({
  type: z.literal('http'),
  url: z.string().url(),
});

export const StdioServerConfigSchema = z.object({
  type: z.literal('stdio').optional(), // Some clients don't include type field
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string(), z.string()).optional(),
});

export const StdioServerConfigAltSchema = z.object({
  type: z.literal('stdio').optional(),
  cmd: z.string(), // Goose uses 'cmd' instead of 'command'
  args: z.array(z.string()),
  env: z.record(z.string(), z.string()).optional(),
});

export const ServerConfigSchema = z.union([
  HttpServerConfigSchema,
  StdioServerConfigSchema,
  StdioServerConfigAltSchema,
]);

export const McpServersConfigSchema = z.object({
  mcpServers: z.record(z.string(), ServerConfigSchema),
});

export const VsCodeConfigSchema = z.object({
  servers: z.record(z.string(), ServerConfigSchema),
});

const GooseStdioServerConfigSchema = z.object({
  name: z.string(),
  cmd: z.string(),
  args: z.array(z.union([z.string(), z.number()])),
  type: z.literal('stdio'),
  timeout: z.number(),
  enabled: z.boolean(),
  bundled: z.null(),
  description: z.null(),
  env_keys: z.array(z.string()),
  envs: z.record(z.string(), z.string()),
});

const GooseHttpServerConfigSchema = z.object({
  enabled: z.boolean(),
  type: z.literal('streamable_http'),
  name: z.string(),
  uri: z.string(),
  envs: z.record(z.string(), z.string()),
  env_keys: z.array(z.string()),
  headers: z.record(z.string(), z.string()),
  description: z.string(),
  timeout: z.number(),
  bundled: z.null(),
  available_tools: z.array(z.string()),
});

export const GooseServerConfigSchema = z.union([
  GooseStdioServerConfigSchema,
  GooseHttpServerConfigSchema,
]);

export const GooseConfigSchema = z.object({
  extensions: z.record(z.string(), GooseServerConfigSchema),
});

export function validateGeneratedConfig(
  config: unknown,
  clientId: string
): { success: boolean; data?: unknown; error?: z.ZodError } {
  let schema: z.ZodSchema;

  switch (clientId) {
    case 'vscode':
      schema = VsCodeConfigSchema;
      break;
    case 'goose':
      schema = GooseConfigSchema;
      break;
    case 'claude-code':
    case 'claude-desktop':
    case 'cursor':
    case 'windsurf':
      schema = McpServersConfigSchema;
      break;
    default:
      return {
        success: false,
        error: new z.ZodError([
          {
            code: 'custom',
            message: `Unknown client ID: ${clientId}`,
            path: [],
          },
        ]),
      };
  }

  const result = schema.safeParse(config);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

export const validateMcpServersConfig = McpServersConfigSchema.parse;
export const validateVsCodeConfig = VsCodeConfigSchema.parse;
export const validateGooseConfig = GooseConfigSchema.parse;
export const safeValidateMcpServersConfig = McpServersConfigSchema.safeParse;
export const safeValidateVsCodeConfig = VsCodeConfigSchema.safeParse;
export const safeValidateGooseConfig = GooseConfigSchema.safeParse;
