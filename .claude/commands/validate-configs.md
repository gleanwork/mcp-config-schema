# Validate MCP Client Configurations

## Purpose
Perform field-by-field validation of all client configuration files in `/configs/` against their official documentation.

## Instructions

For each configuration file in `/configs/`:

1. **Read the config file** and extract:
   - `documentationUrl` - the official documentation link
   - `displayName` - the client display name
   - `transports` - supported transport types
   - `configPath` - platform-specific config file paths
   - `configStructure` - property mappings

2. **Fetch the official documentation** using WebFetch or WebSearch to verify:
   - The documentation URL is correct and accessible
   - Transport support matches (stdio, HTTP, SSE)
   - Config file paths are accurate
   - Property names match the client's actual schema

3. **Document findings** for each client:
   - Mark as VALID if all fields are accurate
   - Mark as ISSUE if any field needs correction
   - Provide specific details for any issues found

4. **Create a validation report** at `.claude/config-validation-report.md` with:
   - Summary table of all clients and their status
   - Detailed findings for each client
   - Recommended fixes for any issues

## Important Notes

- This repo is the **Single Source of Truth** for MCP client configurations
- Accuracy is critical - incorrect configs cause silent failures
- Pay special attention to:
  - `httpUrl` vs `url` (Streamable HTTP vs SSE)
  - Property name differences between clients
  - Platform-specific path variations
  - Version-specific feature availability

## Clients to Validate

All `*.json` configuration files in the `/configs/` directory. Use `ls configs/*.json` or glob pattern to discover them dynamically.
