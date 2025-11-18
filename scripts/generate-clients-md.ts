#!/usr/bin/env node
/**
 * Generate CLIENTS.md documentation from configuration templates
 * This ensures all documentation is derived from the single source of truth
 */

import { MCPConfigRegistry } from '../src/registry.js';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const registry = new MCPConfigRegistry();
const clients = registry.getAllConfigs();

// Helper to format platform paths
function formatConfigPaths(configPath: Record<string, string>): string {
  const platforms = {
    darwin: 'macOS',
    linux: 'Linux',
    win32: 'Windows',
  };

  const paths: string[] = [];

  // Group paths that are the same
  const pathGroups = new Map<string, string[]>();
  for (const [platform, path] of Object.entries(configPath)) {
    if (!pathGroups.has(path)) {
      pathGroups.set(path, []);
    }
    pathGroups.get(path)!.push(platforms[platform as keyof typeof platforms] || platform);
  }

  // Format grouped paths
  for (const [path, platformList] of pathGroups) {
    if (platformList.length === 1) {
      paths.push(`  - **${platformList[0]}**: \`${path}\``);
    } else {
      paths.push(`  - **${platformList.join('/')}: \`${path}\``);
    }
  }

  return paths.join('\n');
}

// Helper to format supported platforms
function formatPlatforms(platforms: string[]): string {
  const platformNames = {
    darwin: 'macOS',
    linux: 'Linux',
    win32: 'Windows',
  };

  return platforms.map((p) => platformNames[p as keyof typeof platformNames] || p).join(', ');
}

// Generate the quick reference table
function generateQuickReference(): string {
  const rows = clients.map((client) => {
    const configuration = client.userConfigurable ? 'User-configurable' : 'Managed';

    // Determine connection type based on transports array
    let connectionType = 'Unknown';
    if (client.transports?.includes('http') && client.transports?.includes('stdio')) {
      connectionType = 'HTTP native';
    } else if (client.transports?.includes('stdio') && !client.transports?.includes('http')) {
      connectionType = 'stdio only';
    } else if (client.transports?.includes('http') && !client.transports?.includes('stdio')) {
      connectionType = 'HTTP only';
    }

    // Determine if mcp-remote is needed
    const requiresRemote =
      client.userConfigurable
        ? !client.transports?.includes('http')
          ? 'Yes (for HTTP)'
          : 'No'
        : 'No';

    // Determine platforms display
    let platforms = '';
    if (client.supportedPlatforms.length > 0) {
      platforms = formatPlatforms(client.supportedPlatforms);
    } else if (client.localConfigNotes?.toLowerCase().includes('web')) {
      platforms = 'Web-based';
    } else if (
      client.localConfigNotes?.toLowerCase().includes('organization') ||
      client.localConfigNotes?.toLowerCase().includes('centrally managed')
    ) {
      platforms = 'Organization-managed';
    } else {
      platforms = 'All platforms';
    }

    return `| **${client.displayName}** | ${configuration} | ${connectionType} | ${requiresRemote} | ${platforms} |`;
  });

  return `| Client | Configuration | Connection Type | Requires mcp-remote? | Platforms |
|--------|---------------|-----------------|---------------------|-----------|
${rows.join('\n')}`;
}

// Generate client section
function generateClientSection(client: any): string {
  const sections: string[] = [];

  // Header
  sections.push(`### ${client.displayName}`);
  sections.push('');

  // Basic info
  const info: string[] = [];
  info.push(
    `- **Configuration**: ${client.userConfigurable ? 'User-configurable' : 'Centrally managed'}`
  );

  // Connection type based on transports array
  if (client.transports?.includes('http') && client.transports?.includes('stdio')) {
    info.push('- **Connection Type**: Native HTTP support');
  } else if (client.transports?.includes('stdio') && !client.transports?.includes('http')) {
    const needsRemote = client.userConfigurable;
    info.push(
      `- **Connection Type**: stdio only${needsRemote ? ' (requires mcp-remote for HTTP servers)' : ''}`
    );
  } else if (!client.userConfigurable) {
    if (client.transports?.includes('http') && !client.transports?.includes('stdio')) {
      info.push('- **Connection Type**: HTTP only (managed)');
    } else if (client.transports?.includes('stdio') && !client.transports?.includes('http')) {
      info.push('- **Connection Type**: stdio only (managed)');
    } else if (client.transports?.includes('http') && client.transports?.includes('stdio')) {
      info.push('- **Connection Type**: HTTP and stdio (managed)');
    }
  }

  // Documentation
  if (client.documentationUrl) {
    info.push(`- **Documentation**: [Link](${client.documentationUrl})`);
  }

  // Platforms
  if (client.supportedPlatforms.length > 0) {
    info.push(`- **Supported Platforms**: ${formatPlatforms(client.supportedPlatforms)}`);
  }

  // Special properties
  if (client.protocolHandler?.protocol) {
    info.push(`- **One-Click Protocol**: \`${client.protocolHandler.protocol}\``);
  }

  if (client.configFormat === 'yaml') {
    info.push('- **Configuration Format**: YAML');
  }

  // Security notes
  if (client.securityNotes) {
    info.push(`- **⚠️ Security Note**: ${client.securityNotes}`);
  }

  // Other notes
  if (client.localConfigNotes && client.userConfigurable) {
    if (client.localConfigNotes.includes('mcp-remote')) {
      info.push('- **Notes**: Requires mcp-remote bridge for remote servers');
    }
  } else if (client.localConfigNotes && !client.userConfigurable) {
    info.push(`- **Notes**: ${client.localConfigNotes}`);
  }

  // Configuration paths (only for clients with local config support)
  if (client.userConfigurable && Object.keys(client.configPath).length > 0) {
    info.push('- **Configuration Paths**:');
    info.push(formatConfigPaths(client.configPath));
  }

  sections.push(info.join('\n'));

  // Only add configuration examples for clients with full support
  if (client.userConfigurable) {
    // Internal configuration schema
    sections.push('');
    sections.push('<details>');
    sections.push('<summary><strong>Internal Configuration Schema</strong></summary>');
    sections.push('');
    sections.push(`\`\`\`json snippet=configs/${client.id}.json`);

    // Read and include the actual config content
    const configPath = join(__dirname, '..', 'configs', `${client.id}.json`);
    const configContent = readFileSync(configPath, 'utf-8');
    sections.push(configContent.trim());
    sections.push('```');
    sections.push('');
    sections.push('</details>');

    // HTTP configuration (remote servers)
    sections.push('');
    sections.push('<details>');
    const needsMcpRemote = !client.transports?.includes('http');
    if (needsMcpRemote) {
      sections.push(
        '<summary><strong>HTTP Configuration (via stdio with mcp-remote bridge)</strong></summary>'
      );
    } else {
      sections.push('<summary><strong>HTTP Configuration (native)</strong></summary>');
    }
    sections.push('');

    const remoteExt = client.configFormat === 'yaml' ? 'yaml' : client.configFormat === 'toml' ? 'toml' : 'json';
    sections.push(`\`\`\`${remoteExt} snippet=examples/configs/remote/${client.id}.${remoteExt}`);

    // Read and include remote config
    const remotePath = join(
      __dirname,
      '..',
      'examples',
      'configs',
      'remote',
      `${client.id}.${remoteExt}`
    );
    const remoteContent = readFileSync(remotePath, 'utf-8');
    sections.push(remoteContent.trim());
    sections.push('```');
    sections.push('');
    sections.push('</details>');

    // Standard I/O configuration (local servers)
    sections.push('');
    sections.push('<details>');
    sections.push('<summary><strong>Standard I/O Configuration (local process)</strong></summary>');
    sections.push('');

    const localExt = client.configFormat === 'yaml' ? 'yaml' : client.configFormat === 'toml' ? 'toml' : 'json';
    sections.push(`\`\`\`${localExt} snippet=examples/configs/local/${client.id}.${localExt}`);

    // Read and include local config
    const localPath = join(
      __dirname,
      '..',
      'examples',
      'configs',
      'local',
      `${client.id}.${localExt}`
    );
    const localContent = readFileSync(localPath, 'utf-8');
    sections.push(localContent.trim());
    sections.push('```');
    sections.push('');
    sections.push('</details>');
  } else {
    // For clients without local config support, just show the internal schema
    sections.push('');
    sections.push('<details>');
    sections.push('<summary><strong>Internal Configuration Schema</strong></summary>');
    sections.push('');
    sections.push(`\`\`\`json snippet=configs/${client.id}.json`);

    const configPath = join(__dirname, '..', 'configs', `${client.id}.json`);
    const configContent = readFileSync(configPath, 'utf-8');
    sections.push(configContent.trim());
    sections.push('```');
    sections.push('');
    sections.push('</details>');
  }

  return sections.join('\n');
}

// Generate the full document
function generateDocument(): string {
  const sections: string[] = [];

  // Header
  sections.push('# MCP Client Compatibility Matrix');
  sections.push('');
  sections.push(
    'This document provides a comprehensive overview of all supported MCP clients, their capabilities, and configuration requirements.'
  );
  sections.push('');

  // Quick reference
  sections.push('## Quick Reference');
  sections.push('');
  sections.push(generateQuickReference());
  sections.push('');

  // Detailed client information
  sections.push('## Detailed Client Information');
  sections.push('');

  // Generate section for each client
  for (const client of clients) {
    sections.push(generateClientSection(client));
    sections.push('');
    sections.push('---');
    sections.push('');
  }

  // Additional sections
  sections.push('## Connection Types Explained');
  sections.push('');

  // Generate dynamic client lists based on actual configuration
  const nativeHttpClients = clients.filter(
    (c) => c.transports?.includes('http') && c.userConfigurable
  );
  const stdioOnlyClients = clients.filter(
    (c) =>
      c.transports?.includes('stdio') &&
      !c.transports?.includes('http') &&
      c.userConfigurable
  );
  const managedClients = clients.filter((c) => !c.userConfigurable);

  sections.push('### Native HTTP Clients');
  sections.push(
    'Clients that can connect directly to HTTP MCP servers without additional tooling:'
  );
  nativeHttpClients.forEach((c) => sections.push(`- ${c.displayName}`));
  sections.push('');

  sections.push('### stdio-only Clients');
  sections.push(
    'Clients that communicate via stdio and require `mcp-remote` as a bridge for HTTP servers:'
  );
  stdioOnlyClients.forEach((c) => sections.push(`- ${c.displayName}`));
  sections.push('');

  sections.push('### Web-based/Managed Clients');
  sections.push("Clients that don't support local configuration files:");
  managedClients.forEach((c) =>
    sections.push(
      `- ${c.displayName} (${c.localConfigNotes?.toLowerCase() || 'centrally managed'})`
    )
  );
  sections.push('');

  // Security considerations
  const securityClients = clients.filter((c) => c.securityNotes);
  if (securityClients.length > 0) {
    sections.push('## Security Considerations');
    sections.push('');
    for (const client of securityClients) {
      sections.push(`### ${client.displayName} OAuth Vulnerability`);
      sections.push(client.securityNotes);
      sections.push('');
    }
  }

  sections.push('## Configuration File Formats');
  sections.push('');
  sections.push('### JSON Format');
  sections.push('Used by: Claude Code, VS Code, Claude Desktop, Cursor, Windsurf');
  sections.push('');
  sections.push('### YAML Format');
  sections.push('Used by: Goose');
  sections.push('');

  sections.push('## Platform Support');
  sections.push('');
  sections.push('### Full Cross-Platform Support');
  sections.push('- Visual Studio Code');
  sections.push('- Cursor');
  sections.push('- Goose');
  sections.push('- Windsurf');
  sections.push('');
  sections.push('### macOS and Windows Only');
  sections.push('- Claude for Desktop');
  sections.push('');
  sections.push('### macOS, Linux, and Windows');
  sections.push('- Claude Code');
  sections.push('');

  sections.push('## One-Click Protocol Support');
  sections.push('');
  sections.push('Some clients support one-click installation via custom protocols:');
  const oneClickClients = clients.filter((c) => c.protocolHandler?.protocol);
  for (const client of oneClickClients) {
    sections.push(`- **${client.displayName}**: \`${client.protocolHandler.protocol}\``);
  }
  sections.push('');

  sections.push('## Additional Resources');
  sections.push('');
  sections.push('- [MCP Documentation](https://modelcontextprotocol.io)');
  sections.push('- [mcp-remote Bridge](https://www.npmjs.com/package/mcp-remote)');
  sections.push(
    '- [@gleanwork/local-mcp-server](https://www.npmjs.com/package/@gleanwork/local-mcp-server)'
  );
  sections.push('');
  sections.push('---');
  sections.push('');
  sections.push(
    '*This document is automatically generated from the configuration files in the `configs/` directory. To update, run `npm run generate:docs`.*'
  );

  return sections.join('\n');
}

// Main execution
const outputPath = join(__dirname, '..', 'CLIENTS.md');
const content = generateDocument();
writeFileSync(outputPath, content);

console.log('✨ CLIENTS.md generated successfully!');
