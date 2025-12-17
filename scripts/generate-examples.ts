#!/usr/bin/env node
/**
 * Generate example configurations using the library's own ConfigBuilder
 * This ensures our examples are always in sync with what the library actually generates
 */

import { MCPConfigRegistry } from '../src/registry.js';
import { examplePreset } from '../src/presets/example.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const registry = new MCPConfigRegistry({ mcpConfig: examplePreset });
const examplesDir = join(__dirname, '..', 'examples', 'configs');

// Ensure directories exist
mkdirSync(join(examplesDir, 'remote'), { recursive: true });
mkdirSync(join(examplesDir, 'local'), { recursive: true });

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

  // Generate HTTP configuration (for remote servers)
  const remoteConfig = builder.buildConfiguration({
    transport: 'http',
    serverUrl: 'https://api.example.com/mcp/default',
    serverName: 'my-server',
  });

  const remoteExtension = client.configFormat === 'yaml' ? 'yaml' : client.configFormat === 'toml' ? 'toml' : 'json';
  const remoteFile = join(examplesDir, 'remote', `${client.id}.${remoteExtension}`);
  const remoteString = builder.toString(remoteConfig);
  writeFileSync(remoteFile, remoteString);
  console.log(`  ✓ HTTP config: ${remoteFile}`);

  // Generate Standard I/O configuration (for local processes)
  const localConfig = builder.buildConfiguration({
    transport: 'stdio',
    instance: 'your-instance',
    apiToken: 'your-api-token',
    serverName: 'my-server',
  });

  const localExtension = client.configFormat === 'yaml' ? 'yaml' : client.configFormat === 'toml' ? 'toml' : 'json';
  const localFile = join(examplesDir, 'local', `${client.id}.${localExtension}`);
  const localString = builder.toString(localConfig);
  writeFileSync(localFile, localString);
  console.log(`  ✓ Standard I/O config: ${localFile}`);
}

console.log('\n✨ Example configurations generated successfully!');
