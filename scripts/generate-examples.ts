#!/usr/bin/env node
/**
 * Generate example configurations using the library's own ConfigBuilder
 * This ensures our examples are always in sync with what the library actually generates
 */

import { MCPConfigRegistry } from '../src/registry.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const registry = new MCPConfigRegistry();
const examplesDir = join(__dirname, '..', 'examples', 'configs');

// Ensure directories exist
mkdirSync(join(examplesDir, 'remote'), { recursive: true });
mkdirSync(join(examplesDir, 'local'), { recursive: true });

// Generate examples for each client
const clients = registry.getAllConfigs();

for (const client of clients) {
  // Skip clients that don't support local configuration
  if (client.localConfigSupport !== 'full') {
    console.log(`Skipping ${client.displayName} - no local config support`);
    continue;
  }

  console.log(`Generating examples for ${client.displayName}...`);

  const builder = registry.createBuilder(client.id);

  // Generate HTTP configuration (for remote servers)
  const remoteConfig = builder.buildConfiguration({
    mode: 'remote',
    serverUrl: 'https://glean-dev-be.glean.com/mcp/default',
    serverName: 'glean',
  });

  const remoteExtension = client.configFormat === 'yaml' ? 'yaml' : 'json';
  const remoteFile = join(examplesDir, 'remote', `${client.id}.${remoteExtension}`);
  writeFileSync(remoteFile, remoteConfig);
  console.log(`  ✓ HTTP config: ${remoteFile}`);

  // Generate Standard I/O configuration (for local processes)
  const localConfig = builder.buildConfiguration({
    mode: 'local',
    instance: 'your-instance',
    apiToken: 'your-api-token',
    serverName: 'glean',
  });

  const localExtension = client.configFormat === 'yaml' ? 'yaml' : 'json';
  const localFile = join(examplesDir, 'local', `${client.id}.${localExtension}`);
  writeFileSync(localFile, localConfig);
  console.log(`  ✓ Standard I/O config: ${localFile}`);
}

console.log('\n✨ Example configurations generated successfully!');
