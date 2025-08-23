/**
 * Centralized server name logic for MCP configurations
 */

/**
 * Extracts the server name from a full MCP URL
 * e.g., https://my-be.glean.com/mcp/analytics -> analytics
 */
export function extractServerNameFromUrl(url: string): string | null {
  const match = url.match(/\/mcp\/([^/]+)(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * Builds a consistent server name for MCP configurations
 * 
 * Rules:
 * - Local mode: 'glean_local'
 * - Agents mode: 'glean_agents'
 * - Remote with URL ending in /mcp/default: 'glean_default' (for consistency)
 * - Remote with other URLs: 'glean_<extracted-name>'
 * - Fallback: 'glean'
 */
export function buildMcpServerName(options: {
  mode?: 'local' | 'remote';
  serverUrl?: string;
  serverName?: string;
  agents?: boolean;
}): string {
  // If explicit server name is provided, use it with prefix
  if (options.serverName) {
    // If it already starts with glean or glean_, don't double-prefix
    if (options.serverName === 'glean' || options.serverName.startsWith('glean_')) {
      return options.serverName;
    }
    return `glean_${options.serverName}`;
  }

  // Local mode
  if (options.mode === 'local') {
    return 'glean_local';
  }

  // Agents mode
  if (options.agents) {
    return 'glean_agents';
  }

  // Remote mode with URL
  if (options.mode === 'remote' && options.serverUrl) {
    const extracted = extractServerNameFromUrl(options.serverUrl);
    if (extracted) {
      // Consistent behavior: always prefix with glean_
      return `glean_${extracted}`;
    }
  }

  // Default fallback
  return 'glean';
}

/**
 * Normalizes a server name to ensure consistency
 * This is useful when accepting user input that might not follow conventions
 */
export function normalizeServerName(name: string): string {
  // Remove any existing glean prefix to avoid duplication
  const withoutPrefix = name.replace(/^glean_?/i, '');
  
  // If it's empty after removing prefix, return default
  if (!withoutPrefix) {
    return 'glean';
  }
  
  // Apply consistent formatting
  return `glean_${withoutPrefix.toLowerCase()}`;
}
