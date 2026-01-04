#!/usr/bin/env node
/**
 * Generate example configurations using the library's own ConfigBuilder
 * This ensures our examples are always in sync with what the library actually generates
 */

import { MCPConfigRegistry } from '../src/registry.js';
import { MCPClientConfig } from '../src/types.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const registry = new MCPConfigRegistry({
  serverPackage: '@example/mcp-server',
});
const examplesDir = join(__dirname, '..', 'examples', 'configs');

function getFileExtension(client: MCPClientConfig): string {
  return client.configFormat === 'yaml' ? 'yaml' : client.configFormat === 'toml' ? 'toml' : 'json';
}

function writeConfig(
  dir: string,
  clientId: string,
  ext: string,
  content: string,
  label: string
): void {
  const filePath = join(examplesDir, dir, `${clientId}.${ext}`);
  writeFileSync(filePath, content);
  console.log(`  ✓ ${label}: ${filePath}`);
}

// Ensure directories exist
mkdirSync(join(examplesDir, 'http'), { recursive: true });
mkdirSync(join(examplesDir, 'stdio'), { recursive: true });

// Generate examples for each client
const clients = registry.getAllConfigs();

for (const client of clients) {
  // Skip clients that don't support local configuration
  if (!client.userConfigurable) {
    console.log(`Skipping ${client.displayName} - no local config support`);
    continue;
  }

  console.log(`Generating examples for ${client.displayName}...`);

  const builder = registry.createBuilder(client.id);
  const ext = getFileExtension(client);

  // Generate HTTP configuration
  const httpConfig = builder.buildConfiguration({
    transport: 'http',
    serverUrl: 'https://api.example.com/mcp',
    serverName: 'example',
  });
  writeConfig('http', client.id, ext, builder.toString(httpConfig), 'HTTP config');

  // Generate stdio configuration
  const stdioConfig = builder.buildConfiguration({
    transport: 'stdio',
    serverName: 'example',
    env: {
      EXAMPLE_API_KEY: 'your-api-key',
    },
  });
  writeConfig('stdio', client.id, ext, builder.toString(stdioConfig), 'stdio config');
}

console.log('\n✨ Example configurations generated successfully!');
