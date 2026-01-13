#!/usr/bin/env node
/**
 * Generate CLIENTS.md documentation from configuration templates
 * This ensures all documentation is derived from the single source of truth
 */

import { MCPConfigRegistry } from '../src/registry.js';
import { MCPClientConfig } from '../src/types.js';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const registry = new MCPConfigRegistry();
const clients = registry.getAllConfigs().sort((a, b) => a.displayName.localeCompare(b.displayName));

// =============================================================================
// Markdown Helpers
// =============================================================================

/**
 * Create a collapsible details block with a code snippet inside.
 * The snippetPath creates a reference that markdown-code uses to keep content in sync.
 */
function detailsWithCode(
  summary: string,
  lang: string,
  snippetPath: string,
  content: string
): string {
  return [
    '<details>',
    `<summary><strong>${summary}</strong></summary>`,
    '',
    `\`\`\`${lang} snippet=${snippetPath}`,
    content,
    '```',
    '',
    '</details>',
  ].join('\n');
}

/**
 * Create a markdown table from headers and rows.
 */
function table(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `|${headers.map(() => '---').join('|')}|`;
  const bodyRows = rows.map((row) => `| ${row.join(' | ')} |`);
  return [headerRow, separator, ...bodyRows].join('\n');
}

/**
 * Create a bullet list from items.
 */
function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

/**
 * Create a markdown section with heading and content.
 */
function section(level: number, title: string, content: string): string {
  const heading = '#'.repeat(level);
  return [`${heading} ${title}`, '', content].join('\n');
}

// =============================================================================
// Data Helpers
// =============================================================================

const PLATFORM_NAMES: Record<string, string> = {
  darwin: 'macOS',
  linux: 'Linux',
  win32: 'Windows',
};

function getFileExtension(client: MCPClientConfig): string {
  return client.configFormat === 'yaml' ? 'yaml' : client.configFormat === 'toml' ? 'toml' : 'json';
}

function readExampleConfig(dir: string, clientId: string, ext: string): string {
  const filePath = join(__dirname, '..', 'examples', 'configs', dir, `${clientId}.${ext}`);
  return readFileSync(filePath, 'utf-8').trim();
}

function readClientConfig(clientId: string): string {
  const configPath = join(__dirname, '..', 'configs', `${clientId}.json`);
  return readFileSync(configPath, 'utf-8').trim();
}

function formatConfigPaths(configPath: Record<string, string>): string {
  // Group paths that are the same
  const pathGroups = new Map<string, string[]>();
  for (const [platform, path] of Object.entries(configPath)) {
    if (!pathGroups.has(path)) {
      pathGroups.set(path, []);
    }
    pathGroups.get(path)!.push(PLATFORM_NAMES[platform] || platform);
  }

  // Format grouped paths
  const paths: string[] = [];
  for (const [path, platformList] of pathGroups) {
    const label = platformList.length === 1 ? platformList[0] : platformList.join('/');
    paths.push(`  - **${label}**: \`${path}\``);
  }

  return paths.join('\n');
}

function formatPlatforms(platforms: string[]): string {
  return platforms.map((p) => PLATFORM_NAMES[p] || p).join(', ');
}

function getConnectionType(client: MCPClientConfig): string {
  const hasHttp = client.transports?.includes('http');
  const hasStdio = client.transports?.includes('stdio');

  if (hasHttp && hasStdio) return 'HTTP native';
  if (hasStdio && !hasHttp) return 'stdio only';
  if (hasHttp && !hasStdio) return 'HTTP only';
  return 'Unknown';
}

function getPlatformsDisplay(client: MCPClientConfig): string {
  if (client.supportedPlatforms.length > 0) {
    return formatPlatforms(client.supportedPlatforms);
  }
  if (client.localConfigNotes?.toLowerCase().includes('web')) {
    return 'Web-based';
  }
  if (
    client.localConfigNotes?.toLowerCase().includes('organization') ||
    client.localConfigNotes?.toLowerCase().includes('centrally managed')
  ) {
    return 'Organization-managed';
  }
  return 'All platforms';
}

// =============================================================================
// Document Generators
// =============================================================================

function generateQuickReference(): string {
  const headers = [
    'Client',
    'Configuration',
    'Connection Type',
    'Requires mcp-remote?',
    'Platforms',
  ];

  const rows = clients.map((client) => {
    const configuration = client.userConfigurable ? 'User-configurable' : 'Managed';
    const connectionType = getConnectionType(client);
    const requiresRemote = client.userConfigurable
      ? !client.transports?.includes('http')
        ? 'Yes (for HTTP)'
        : 'No'
      : 'No';
    const platforms = getPlatformsDisplay(client);

    return [`**${client.displayName}**`, configuration, connectionType, requiresRemote, platforms];
  });

  return table(headers, rows);
}

function generateClientSection(client: MCPClientConfig): string {
  const parts: string[] = [];

  // Header
  parts.push(`### ${client.displayName}`);
  parts.push('');

  // Basic info as bullet list
  const info: string[] = [];
  info.push(
    `**Configuration**: ${client.userConfigurable ? 'User-configurable' : 'Centrally managed'}`
  );

  // Connection type
  const hasHttp = client.transports?.includes('http');
  const hasStdio = client.transports?.includes('stdio');

  if (hasHttp && hasStdio) {
    info.push('**Connection Type**: Native HTTP support');
  } else if (hasStdio && !hasHttp) {
    const suffix = client.userConfigurable
      ? ' (requires mcp-remote for HTTP servers)'
      : ' (managed)';
    info.push(`**Connection Type**: stdio only${suffix}`);
  } else if (!client.userConfigurable) {
    if (hasHttp && !hasStdio) {
      info.push('**Connection Type**: HTTP only (managed)');
    } else if (hasHttp && hasStdio) {
      info.push('**Connection Type**: HTTP and stdio (managed)');
    }
  }

  if (client.documentationUrl) {
    info.push(`**Documentation**: [Link](${client.documentationUrl})`);
  }

  if (client.supportedPlatforms.length > 0) {
    info.push(`**Supported Platforms**: ${formatPlatforms(client.supportedPlatforms)}`);
  }

  if (client.protocolHandler?.protocol) {
    info.push(`**One-Click Protocol**: \`${client.protocolHandler.protocol}\``);
  }

  if (client.configFormat === 'yaml') {
    info.push('**Configuration Format**: YAML');
  }

  if (client.securityNotes) {
    info.push(`**⚠️ Security Note**: ${client.securityNotes}`);
  }

  if (client.localConfigNotes && client.userConfigurable) {
    if (client.localConfigNotes.includes('mcp-remote')) {
      info.push('**Notes**: Requires mcp-remote bridge for remote servers');
    }
  } else if (client.localConfigNotes && !client.userConfigurable) {
    info.push(`**Notes**: ${client.localConfigNotes}`);
  }

  if (client.userConfigurable && Object.keys(client.configPath).length > 0) {
    info.push('**Configuration Paths**:');
  }

  parts.push(bulletList(info));

  if (client.userConfigurable && Object.keys(client.configPath).length > 0) {
    parts.push(formatConfigPaths(client.configPath));
  }

  const ext = getFileExtension(client);

  // Configuration examples
  if (client.userConfigurable) {
    parts.push('');
    parts.push(
      detailsWithCode(
        'Internal Configuration Schema',
        'json',
        `configs/${client.id}.json`,
        readClientConfig(client.id)
      )
    );

    const httpSummary = !client.transports?.includes('http')
      ? 'HTTP Configuration (via mcp-remote bridge)'
      : 'HTTP Configuration';
    parts.push('');
    parts.push(
      detailsWithCode(
        httpSummary,
        ext,
        `examples/configs/http/${client.id}.${ext}`,
        readExampleConfig('http', client.id, ext)
      )
    );

    parts.push('');
    parts.push(
      detailsWithCode(
        'stdio Configuration',
        ext,
        `examples/configs/stdio/${client.id}.${ext}`,
        readExampleConfig('stdio', client.id, ext)
      )
    );
  } else {
    parts.push('');
    parts.push(
      detailsWithCode(
        'Internal Configuration Schema',
        'json',
        `configs/${client.id}.json`,
        readClientConfig(client.id)
      )
    );
  }

  return parts.join('\n');
}

function generateDocument(): string {
  const parts: string[] = [];

  // Header
  parts.push('# MCP Client Compatibility Matrix');
  parts.push('');
  parts.push(
    'This document provides a comprehensive overview of all supported MCP clients, their capabilities, and configuration requirements.'
  );
  parts.push('');

  // Quick reference
  parts.push(section(2, 'Quick Reference', generateQuickReference()));
  parts.push('');

  // Detailed client information
  parts.push('## Detailed Client Information');
  parts.push('');

  for (const client of clients) {
    parts.push(generateClientSection(client));
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  // Connection Types Explained
  const nativeHttpClients = clients.filter(
    (c) => c.transports?.includes('http') && c.userConfigurable
  );
  const stdioOnlyClients = clients.filter(
    (c) => c.transports?.includes('stdio') && !c.transports?.includes('http') && c.userConfigurable
  );
  const managedClients = clients.filter((c) => !c.userConfigurable);

  parts.push('## Connection Types Explained');
  parts.push('');
  parts.push('### Native HTTP Clients');
  parts.push('Clients that can connect directly to HTTP MCP servers without additional tooling:');
  parts.push(bulletList(nativeHttpClients.map((c) => c.displayName)));
  parts.push('');
  parts.push('### stdio-only Clients');
  parts.push(
    'Clients that communicate via stdio and require `mcp-remote` as a bridge for HTTP servers:'
  );
  parts.push(bulletList(stdioOnlyClients.map((c) => c.displayName)));
  parts.push('');
  parts.push('### Web-based/Managed Clients');
  parts.push("Clients that don't support local configuration files:");
  parts.push(
    bulletList(
      managedClients.map(
        (c) => `${c.displayName} (${c.localConfigNotes?.toLowerCase() || 'centrally managed'})`
      )
    )
  );
  parts.push('');

  // Security considerations
  const securityClients = clients.filter((c) => c.securityNotes);
  if (securityClients.length > 0) {
    parts.push('## Security Considerations');
    parts.push('');
    for (const client of securityClients) {
      parts.push(`### ${client.displayName} OAuth Vulnerability`);
      parts.push(client.securityNotes!);
      parts.push('');
    }
  }

  // Configuration File Formats
  parts.push('## Configuration File Formats');
  parts.push('');
  parts.push('### JSON Format');
  parts.push('Used by: Claude Code, VS Code, Claude Desktop, Cursor, Windsurf');
  parts.push('');
  parts.push('### YAML Format');
  parts.push('Used by: Goose');
  parts.push('');

  // Platform Support
  parts.push('## Platform Support');
  parts.push('');
  parts.push('### Full Cross-Platform Support');
  parts.push(bulletList(['Visual Studio Code', 'Cursor', 'Goose', 'Windsurf']));
  parts.push('');
  parts.push('### macOS and Windows Only');
  parts.push(bulletList(['Claude for Desktop']));
  parts.push('');
  parts.push('### macOS, Linux, and Windows');
  parts.push(bulletList(['Claude Code']));
  parts.push('');

  // One-Click Protocol Support
  const oneClickClients = clients.filter((c) => c.protocolHandler?.protocol);
  parts.push('## One-Click Protocol Support');
  parts.push('');
  parts.push('Some clients support one-click installation via custom protocols:');
  parts.push(
    bulletList(
      oneClickClients.map((c) => `**${c.displayName}**: \`${c.protocolHandler!.protocol}\``)
    )
  );
  parts.push('');

  // Additional Resources
  parts.push('## Additional Resources');
  parts.push('');
  parts.push(
    bulletList([
      '[MCP Documentation](https://modelcontextprotocol.io)',
      '[mcp-remote Bridge](https://www.npmjs.com/package/mcp-remote)',
      '[@gleanwork/local-mcp-server](https://www.npmjs.com/package/@gleanwork/local-mcp-server)',
    ])
  );
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push(
    '*This document is automatically generated from the configuration files in the `configs/` directory. To update, run `npm run generate:docs`.*'
  );

  return parts.join('\n');
}

// Main execution
const outputPath = join(__dirname, '..', 'CLIENTS.md');
const content = generateDocument();
writeFileSync(outputPath, content);

console.log('✨ CLIENTS.md generated successfully!');
