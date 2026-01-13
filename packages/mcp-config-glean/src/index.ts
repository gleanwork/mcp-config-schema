import {
  MCPConfigRegistry,
  buildMcpServerName as buildMcpServerNameBase,
  type MCPConnectionOptions,
  type RegistryOptions,
} from '@gleanwork/mcp-config-schema';

// Re-export everything from the base package for convenience
export * from '@gleanwork/mcp-config-schema';

/**
 * Glean-specific registry options for stdio transport.
 */
export const GLEAN_REGISTRY_OPTIONS: RegistryOptions = {
  serverPackage: '@gleanwork/local-mcp-server',
  commandBuilder: {
    http: (clientId, options) => {
      if (!options.serverUrl) return null;

      let command = `npx -y @gleanwork/configure-mcp-server remote --url ${options.serverUrl} --client ${clientId}`;

      // Extract token from Authorization header if present
      const authHeader = options.headers?.['Authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        command += ` --token ${token}`;
      }

      return command;
    },
    stdio: (clientId, options) => {
      const envFlags = Object.entries(options.env || {})
        .map(([k, v]) => `--env ${k}=${v}`)
        .join(' ');
      return `npx -y @gleanwork/configure-mcp-server local --client ${clientId}${envFlags ? ` ${envFlags}` : ''}`;
    },
  },
  serverNameBuilder: (options) => {
    // Lazily call buildGleanServerName defined below
    return buildGleanServerName(options);
  },
};

/**
 * Glean environment variable names.
 */
export const GLEAN_ENV = {
  /** Environment variable for Glean instance name (e.g., 'my-company') */
  INSTANCE: 'GLEAN_INSTANCE',
  /** Environment variable for full Glean URL (e.g., 'https://my-company.glean.com') */
  URL: 'GLEAN_URL',
  /** Environment variable for Glean API token */
  API_TOKEN: 'GLEAN_API_TOKEN',
} as const;

/**
 * Helper to create Glean environment variables for stdio transport.
 *
 * @param instance - Glean instance name (e.g., 'my-company')
 * @param apiToken - Optional API token
 * @returns Environment variables object for use in MCPConnectionOptions.env
 *
 * @example
 * ```typescript
 * const config = builder.buildConfiguration({
 *   transport: 'stdio',
 *   env: createGleanEnv('my-company', 'my-api-token'),
 * });
 * ```
 */
export function createGleanEnv(instance: string, apiToken?: string): Record<string, string> {
  return {
    [GLEAN_ENV.INSTANCE]: instance,
    ...(apiToken && { [GLEAN_ENV.API_TOKEN]: apiToken }),
  };
}

/**
 * Helper to create Glean environment variables using a full URL.
 *
 * @param url - Full Glean URL (e.g., 'https://my-company.glean.com')
 * @param apiToken - Optional API token
 * @returns Environment variables object for use in MCPConnectionOptions.env
 *
 * @example
 * ```typescript
 * const config = builder.buildConfiguration({
 *   transport: 'stdio',
 *   env: createGleanUrlEnv('https://my-company.glean.com', 'my-api-token'),
 * });
 * ```
 */
export function createGleanUrlEnv(url: string, apiToken?: string): Record<string, string> {
  return {
    [GLEAN_ENV.URL]: url,
    ...(apiToken && { [GLEAN_ENV.API_TOKEN]: apiToken }),
  };
}

/**
 * Helper to create Glean authorization headers for HTTP transport.
 *
 * @param apiToken - Glean API token
 * @returns Headers object for use in MCPConnectionOptions.headers
 *
 * @example
 * ```typescript
 * const config = builder.buildConfiguration({
 *   transport: 'http',
 *   serverUrl: 'https://my-company-be.glean.com/mcp/default',
 *   headers: createGleanHeaders('my-api-token'),
 * });
 * ```
 */
export function createGleanHeaders(apiToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiToken}`,
  };
}

/**
 * Create an MCPConfigRegistry pre-configured with Glean defaults.
 *
 * @returns MCPConfigRegistry configured for Glean stdio transport
 *
 * @example
 * ```typescript
 * const registry = createGleanRegistry();
 * const builder = registry.createBuilder('cursor');
 *
 * // For stdio transport
 * const config = builder.buildConfiguration({
 *   transport: 'stdio',
 *   env: createGleanEnv('my-company', 'my-api-token'),
 * });
 *
 * // For HTTP transport
 * const httpConfig = builder.buildConfiguration({
 *   transport: 'http',
 *   serverUrl: 'https://my-company-be.glean.com/mcp/default',
 *   headers: createGleanHeaders('my-api-token'),
 * });
 * ```
 */
export function createGleanRegistry(): MCPConfigRegistry {
  return new MCPConfigRegistry(GLEAN_REGISTRY_OPTIONS);
}

/**
 * Build the Glean MCP server URL from an instance name.
 *
 * @param instance - Glean instance name (e.g., 'my-company')
 * @param endpoint - MCP endpoint (default: 'default')
 * @returns Full Glean MCP server URL
 *
 * @example
 * ```typescript
 * const url = buildGleanServerUrl('my-company');
 * // Returns: 'https://my-company-be.glean.com/mcp/default'
 *
 * const customUrl = buildGleanServerUrl('my-company', 'custom');
 * // Returns: 'https://my-company-be.glean.com/mcp/custom'
 * ```
 */
export function buildGleanServerUrl(instance: string, endpoint: string = 'default'): string {
  return `https://${instance}-be.glean.com/mcp/${endpoint}`;
}

// Type helpers for Glean-specific usage
export type GleanEnvVars = {
  [GLEAN_ENV.INSTANCE]?: string;
  [GLEAN_ENV.URL]?: string;
  [GLEAN_ENV.API_TOKEN]?: string;
};

/**
 * Options for Glean-specific connection configuration.
 * Extends MCPConnectionOptions with Glean-specific properties.
 */
export interface GleanConnectionOptions extends MCPConnectionOptions {
  /** Product name for white-label support (e.g., 'Glean', 'Acme Platform') */
  productName?: string;
  /** Use agents endpoint instead of default */
  agents?: boolean;
}

/**
 * Normalize a product name to a safe identifier.
 * Used for white-label support in Glean configurations.
 *
 * @param productName - Product name (e.g., 'Glean', 'Acme Platform')
 * @returns Normalized product name (e.g., 'glean', 'acme_platform')
 *
 * @example
 * ```typescript
 * normalizeGleanProductName('Glean'); // 'glean'
 * normalizeGleanProductName('Acme Platform'); // 'acme_platform'
 * normalizeGleanProductName('My-Product'); // 'my_product'
 * ```
 */
export function normalizeGleanProductName(productName?: string): string {
  if (!productName) {
    return 'glean';
  }
  const normalized = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return normalized || 'glean';
}

/**
 * Build a Glean-prefixed server name for MCP configurations.
 * Wraps the vendor-neutral buildMcpServerName with Glean-specific prefixing.
 *
 * Rules:
 * - If explicit serverName is provided and already has the product prefix, use it directly
 * - If explicit serverName is provided without prefix, add the product prefix
 * - If agents flag is set, return '{product}_agents'
 * - For stdio transport: '{product}_local'
 * - For http transport with URL: '{product}_{extracted-name}'
 * - Fallback: '{product}'
 *
 * @param options - Server name options
 * @returns Prefixed server name (e.g., 'glean_local', 'acme_analytics')
 *
 * @example
 * ```typescript
 * buildGleanServerName({ transport: 'stdio' }); // 'glean_local'
 * buildGleanServerName({ transport: 'http', serverUrl: '.../mcp/analytics' }); // 'glean_analytics'
 * buildGleanServerName({ transport: 'stdio', productName: 'Acme' }); // 'acme_local'
 * buildGleanServerName({ agents: true }); // 'glean_agents'
 * buildGleanServerName({ serverName: 'custom' }); // 'glean_custom'
 * ```
 */
export function buildGleanServerName(options: {
  transport?: 'stdio' | 'http';
  serverUrl?: string;
  serverName?: string;
  productName?: string;
  agents?: boolean;
}): string {
  const productPrefix = normalizeGleanProductName(options.productName);

  // Handle explicit serverName
  if (options.serverName) {
    // If it already has the correct prefix, use it directly
    if (
      options.serverName === productPrefix ||
      options.serverName.startsWith(`${productPrefix}_`)
    ) {
      return options.serverName;
    }
    return `${productPrefix}_${options.serverName}`;
  }

  // Handle agents mode
  if (options.agents) {
    return `${productPrefix}_agents`;
  }

  // Get base name from vendor-neutral function
  const baseName = buildMcpServerNameBase({
    transport: options.transport,
    serverUrl: options.serverUrl,
  });

  // If baseName is 'default' and we have no specific info, just return the product prefix
  if (baseName === 'default' && !options.transport && !options.serverUrl) {
    return productPrefix;
  }

  return `${productPrefix}_${baseName}`;
}

/**
 * Normalize a server name with Glean product prefix.
 * Ensures the server name has the correct product prefix and is safe for use as a configuration key.
 *
 * @param name - Server name to normalize
 * @param productName - Optional product name for white-label support
 * @returns Normalized server name with product prefix
 *
 * @example
 * ```typescript
 * normalizeGleanServerName('custom'); // 'glean_custom'
 * normalizeGleanServerName('glean_custom'); // 'glean_custom' (no double prefix)
 * normalizeGleanServerName('custom', 'acme'); // 'acme_custom'
 * ```
 */
export function normalizeGleanServerName(name: string, productName?: string): string {
  const productPrefix = normalizeGleanProductName(productName);

  if (!name) {
    return productPrefix;
  }

  const lowerName = name.toLowerCase();

  // If it already starts with the prefix, return as-is
  if (lowerName === productPrefix || lowerName.startsWith(`${productPrefix}_`)) {
    return lowerName;
  }

  // Handle case where name starts with just the product (e.g., 'gleancustom' -> 'glean_custom')
  if (lowerName.startsWith(productPrefix) && lowerName.length > productPrefix.length) {
    const rest = lowerName.slice(productPrefix.length);
    return `${productPrefix}_${rest}`;
  }

  return `${productPrefix}_${lowerName}`;
}
