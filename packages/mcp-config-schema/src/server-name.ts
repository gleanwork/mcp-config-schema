/**
 * Centralized server name logic for MCP configurations
 */

/**
 * Extracts the server name from a full MCP URL
 * e.g., https://example.com/mcp/analytics -> analytics
 */
export function extractServerNameFromUrl(url: string): string | null {
  const match = url.match(/\/mcp\/([^/]+)(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * Builds a server name for MCP configurations
 *
 * Rules:
 * - If explicit serverName is provided, use it directly
 * - stdio transport: 'local'
 * - http transport with URL ending in /mcp/<name>: extract <name>
 * - Fallback: 'default'
 */
export function buildMcpServerName(options: {
  transport?: 'stdio' | 'http';
  serverUrl?: string;
  serverName?: string;
}): string {
  // If explicit server name is provided, use it directly
  if (options.serverName) {
    return options.serverName;
  }

  // stdio transport
  if (options.transport === 'stdio') {
    return 'local';
  }

  // http transport with URL - extract from path
  if (options.transport === 'http' && options.serverUrl) {
    const extracted = extractServerNameFromUrl(options.serverUrl);
    if (extracted) {
      return extracted;
    }
  }

  // Default fallback
  return 'default';
}

/**
 * Normalizes a server name to ensure it's safe for use as a configuration key.
 * - Converts to lowercase
 * - Replaces special characters with underscores
 * - Removes consecutive underscores
 * - Trims underscores from start/end
 */
export function normalizeServerName(name: string): string {
  if (!name) {
    return 'default';
  }

  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return normalized || 'default';
}
