/**
 * Centralized server name logic for MCP configurations
 */

/**
 * Normalizes a product name to be safe for use in server identifiers
 * - Converts to lowercase
 * - Replaces spaces and special characters with underscores
 * - Removes consecutive underscores
 * - Trims underscores from start/end
 *
 * Examples:
 * - "Glean" -> "glean"
 * - "Acme Saleschat" -> "acme_saleschat"
 * - "My Product Name" -> "my_product_name"
 */
export function normalizeProductName(productName: string): string {
  if (!productName) {
    return 'glean';
  }

  const normalized = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Trim underscores from start/end

  // If the result is empty (e.g., from whitespace-only input), return default
  return normalized || 'glean';
}

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
 * - stdio transport (local): '<productName>_local'
 * - Agents mode: '<productName>_agents'
 * - http transport with URL ending in /mcp/default: '<productName>_default' (for consistency)
 * - http transport with other URLs: '<productName>_<extracted-name>'
 * - Fallback: '<productName>'
 */
export function buildMcpServerName(options: {
  transport?: 'stdio' | 'http';
  serverUrl?: string;
  serverName?: string;
  agents?: boolean;
  productName?: string;
}): string {
  const productName = normalizeProductName(options.productName || 'glean');

  // If explicit server name is provided, use it with prefix
  if (options.serverName) {
    // If it already starts with productName or productName_, don't double-prefix
    if (options.serverName === productName || options.serverName.startsWith(`${productName}_`)) {
      return options.serverName;
    }
    return `${productName}_${options.serverName}`;
  }

  // stdio transport (local)
  if (options.transport === 'stdio') {
    return `${productName}_local`;
  }

  // Agents mode
  if (options.agents) {
    return `${productName}_agents`;
  }

  // http transport with URL
  if (options.transport === 'http' && options.serverUrl) {
    const extracted = extractServerNameFromUrl(options.serverUrl);
    if (extracted) {
      // Consistent behavior: always prefix with productName_
      return `${productName}_${extracted}`;
    }
  }

  // Default fallback
  return productName;
}

/**
 * Normalizes a server name to ensure consistency
 * This is useful when accepting user input that might not follow conventions
 */
export function normalizeServerName(name: string, productName: string = 'glean'): string {
  const normalizedProductName = normalizeProductName(productName);

  // Create a regex pattern that matches the product name with optional underscore
  // Escape special regex characters in the product name
  const escapedProductName = normalizedProductName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefixPattern = new RegExp(`^${escapedProductName}_?`, 'i');

  // Remove any existing product prefix to avoid duplication
  const withoutPrefix = name.replace(prefixPattern, '');

  // If it's empty after removing prefix, return normalized product name
  if (!withoutPrefix) {
    return normalizedProductName;
  }

  // Apply consistent formatting
  return `${normalizedProductName}_${withoutPrefix.toLowerCase()}`;
}
