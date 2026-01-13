# mcp-config

Monorepo for MCP (Model Context Protocol) configuration packages.

## Packages

| Package | Description |
|---------|-------------|
| [@gleanwork/mcp-config-schema](./packages/mcp-config-schema) | Type-safe schemas and builders for MCP client configurations |
| [@gleanwork/mcp-config-glean](./packages/mcp-config-glean) | Glean-specific MCP configuration defaults and helpers |

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests across all packages
npm run test

# Run all checks (lint, typecheck, test)
npm run test:all
```

## Package Dependency

`@gleanwork/mcp-config-glean` depends on `@gleanwork/mcp-config-schema` and provides Glean-specific defaults on top of the base schema package.

## License

MIT
