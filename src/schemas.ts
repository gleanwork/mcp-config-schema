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
  'codex',
  'junie',
  'jetbrains',
  'gemini',
]);

export const ServerTypeSchema = z.enum(['http', 'stdio']);

export const TransportSchema = z.enum(['stdio', 'http']);
export const SupportedTransportsSchema = z.array(TransportSchema).min(1);
export const HttpConfigStructureSchema = z.object({
  typeProperty: z.string().optional(),
  urlProperty: z.string(),
  headersProperty: z.string().optional(),
});

export const StdioConfigStructureSchema = z.object({
  typeProperty: z.string().optional(),
  commandProperty: z.string(),
  argsProperty: z.string(),
  envProperty: z.string().optional(),
});

export const ConfigStructureSchema = z.object({
  serversPropertyName: z.string(),
  httpPropertyMapping: HttpConfigStructureSchema.optional(),
  stdioPropertyMapping: StdioConfigStructureSchema.optional(),
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
  userConfigurable: z.boolean(),
  localConfigNotes: z.string().optional(),
  documentationUrl: z.string().url().optional(),
  transports: SupportedTransportsSchema,
  supportedPlatforms: z.array(PlatformSchema),
  configFormat: z.enum(['json', 'yaml', 'toml']),
  configPath: PlatformPathsSchema,
  protocolHandler: z
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
  includeRootObject: z.boolean().optional(),
  mcpRemoteVersion: z.string().optional(),
});

export const MCPConnectionOptionsSchema = z
  .object({
    transport: TransportSchema,
    // HTTP transport options
    serverUrl: z.string().optional(), // URL or URL template with {urlVariables}
    urlVariables: z.record(z.string(), z.string()).optional(), // Values for URL template variables
    headers: z.record(z.string(), z.string()).optional(), // HTTP headers (e.g., Authorization)
    // stdio transport options
    env: z.record(z.string(), z.string()).optional(), // Environment variables for stdio server
    // Common options
    serverName: z.string().optional(),
  })
  .merge(BuildOptionsSchema);

/** @deprecated Use MCPConnectionOptionsSchema instead */
export const MCPServerConfigSchema = MCPConnectionOptionsSchema;

export function validateClientConfig(data: unknown) {
  return MCPClientConfigSchema.parse(data);
}

export function validateConnectionOptions(data: unknown) {
  return MCPConnectionOptionsSchema.parse(data);
}

/** @deprecated Use validateConnectionOptions instead */
export function validateServerConfig(data: unknown) {
  return MCPConnectionOptionsSchema.parse(data);
}

export function safeValidateClientConfig(data: unknown) {
  return MCPClientConfigSchema.safeParse(data);
}

export function safeValidateConnectionOptions(data: unknown) {
  return MCPConnectionOptionsSchema.safeParse(data);
}

/** @deprecated Use safeValidateConnectionOptions instead */
export function safeValidateServerConfig(data: unknown) {
  return MCPConnectionOptionsSchema.safeParse(data);
}

export const HttpServerConfigSchema = z.object({
  type: z.literal('http'),
  url: z.string().url(),
});

export const HttpServerConfigAltSchema = z.object({
  serverUrl: z.string().url(), // Windsurf uses 'serverUrl' instead of 'url'
});

export const GeminiHttpServerConfigSchema = z.object({
  httpUrl: z.string().url(), // Gemini CLI uses 'httpUrl' for HTTP streaming (not 'url' which is for SSE)
  headers: z.record(z.string(), z.string()).optional(),
});

export const GeminiStdioServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string(), z.string()).optional(),
  // Gemini doesn't use 'type' property
});

export const StdioServerConfigSchema = z.object({
  type: z.literal('stdio').optional(), // Some clients don't include type property
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
  HttpServerConfigAltSchema,
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

const CodexStdioServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string(), z.string()).optional(),
});

const CodexHttpServerConfigSchema = z.object({
  url: z.string(),
  http_headers: z.record(z.string(), z.string()).optional(),
});

export const CodexServerConfigSchema = z.union([
  CodexStdioServerConfigSchema,
  CodexHttpServerConfigSchema,
]);

export const CodexConfigSchema = z.object({
  mcp_servers: z.record(z.string(), CodexServerConfigSchema),
});

export const GeminiServerConfigSchema = z.union([
  GeminiHttpServerConfigSchema,
  GeminiStdioServerConfigSchema,
]);

export const GeminiConfigSchema = z.object({
  mcpServers: z.record(z.string(), GeminiServerConfigSchema),
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
    case 'codex':
      schema = CodexConfigSchema;
      break;
    case 'gemini':
      schema = GeminiConfigSchema;
      break;
    case 'claude-code':
    case 'claude-desktop':
    case 'cursor':
    case 'windsurf':
    case 'junie':
    case 'jetbrains':
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
export const validateCodexConfig = CodexConfigSchema.parse;
export const validateGeminiConfig = GeminiConfigSchema.parse;
export const safeValidateMcpServersConfig = McpServersConfigSchema.safeParse;
export const safeValidateVsCodeConfig = VsCodeConfigSchema.safeParse;
export const safeValidateGooseConfig = GooseConfigSchema.safeParse;
export const safeValidateCodexConfig = CodexConfigSchema.safeParse;
export const safeValidateGeminiConfig = GeminiConfigSchema.safeParse;
