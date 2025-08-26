# MCP Client Compatibility Matrix

This document provides a comprehensive overview of all supported MCP clients, their capabilities, and configuration requirements.

## Quick Reference

| Client | Compatibility | Connection Type | Requires mcp-remote? | Platforms |
|--------|--------------|-----------------|---------------------|-----------|
| **ChatGPT** | None | stdio only | Yes (for HTTP) | Web only |
| **Claude Code** | Full | HTTP native | No | macOS, Linux, Windows |
| **Claude for Desktop** | Full | stdio only | Yes (for HTTP) | macOS, Windows, Linux |
| **Claude for Teams/Enterprise** | None | stdio only | Yes (for HTTP) | Organization-managed |
| **Cursor** | Full | HTTP native | No | macOS, Linux, Windows |
| **Goose** | Full | HTTP native | No | macOS, Linux, Windows |
| **Visual Studio Code** | Full | HTTP native | No | macOS, Linux, Windows |
| **Windsurf** | Full | stdio only | Yes (for HTTP) | macOS, Linux, Windows |

## Detailed Client Information

### ChatGPT

- **Compatibility**: No local configuration support
- **Connection Type**: stdio only (requires mcp-remote for HTTP servers)
- **Documentation**: [OpenAI Platform Docs](https://platform.openai.com/docs)
- **Notes**: ChatGPT is web-based and requires creating custom GPTs through their web UI. No local configuration file support.

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/chatgpt.json
{
  "id": "chatgpt",
  "name": "chatgpt",
  "displayName": "ChatGPT",
  "description": "ChatGPT web interface - requires GPT configuration through web UI",
  "localConfigSupport": "none",
  "localConfigNotes": "ChatGPT is web-based and requires creating custom GPTs through their web UI. No local configuration file support.",
  "clientSupports": "stdio-only",
  "requiresMcpRemoteForHttp": true,
  "supportedPlatforms": [],
  "configFormat": "json",
  "configPath": {},
  "documentationUrl": "https://platform.openai.com/docs",
  "configStructure": {
    "serverKey": ""
  }
}
```

</details>

---

### Claude Code

- **Compatibility**: Full local configuration support
- **Connection Type**: Native HTTP support
- **Documentation**: [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)
- **Supported Platforms**: macOS, Linux, Windows
- **Configuration Paths**:
  - **macOS/Linux: `$HOME/.claude.json`
  - **Windows**: `%USERPROFILE%\.claude.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/claude-code.json
{
  "id": "claude-code",
  "name": "claude-code",
  "displayName": "Claude Code",
  "description": "Claude Code with native HTTP support",
  "localConfigSupport": "full",
  "documentationUrl": "https://docs.anthropic.com/en/docs/claude-code",
  "clientSupports": "http",
  "requiresMcpRemoteForHttp": false,
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/.claude.json",
    "linux": "$HOME/.claude.json",
    "win32": "%USERPROFILE%\\.claude.json"
  },
  "configStructure": {
    "serverKey": "mcpServers",
    "httpConfig": {
      "typeField": "type",
      "urlField": "url"
    },
    "stdioConfig": {
      "typeField": "type",
      "commandField": "command",
      "argsField": "args",
      "envField": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration (native)</strong></summary>

```json snippet=examples/configs/remote/claude-code.json
{
  "mcpServers": {
    "glean": {
      "type": "http",
      "url": "https://glean-dev-be.glean.com/mcp/default"
    }
  }
}
```

</details>

<details>
<summary><strong>Standard I/O Configuration (local process)</strong></summary>

```json snippet=examples/configs/local/claude-code.json
{
  "mcpServers": {
    "glean": {
      "command": "npx",
      "args": [
        "-y",
        "@gleanwork/local-mcp-server"
      ],
      "type": "stdio",
      "env": {
        "GLEAN_INSTANCE": "your-instance",
        "GLEAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

</details>

---

### Claude for Desktop

- **Compatibility**: Full local configuration support
- **Connection Type**: stdio only (requires mcp-remote for HTTP servers)
- **Documentation**: [Documentation](https://docs.anthropic.com/en/docs/claude-desktop)
- **Supported Platforms**: macOS, Windows, Linux
- **Notes**: Requires mcp-remote bridge for remote servers
- **Configuration Paths**:
  - **macOS**: `$HOME/Library/Application Support/Claude/claude_desktop_config.json`
  - **Linux**: `$HOME/.config/Claude/claude_desktop_config.json`
  - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/claude-desktop.json
{
  "id": "claude-desktop",
  "name": "claude-desktop",
  "displayName": "Claude for Desktop",
  "description": "Claude Desktop only supports stdio, requires mcp-remote for HTTP servers",
  "localConfigSupport": "full",
  "localConfigNotes": "Requires mcp-remote for remote servers",
  "documentationUrl": "https://docs.anthropic.com/en/docs/claude-desktop",
  "clientSupports": "stdio-only",
  "requiresMcpRemoteForHttp": true,
  "supportedPlatforms": ["darwin", "win32", "linux"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/Library/Application Support/Claude/claude_desktop_config.json",
    "win32": "%APPDATA%\\Claude\\claude_desktop_config.json",
    "linux": "$HOME/.config/Claude/claude_desktop_config.json"
  },
  "configStructure": {
    "serverKey": "mcpServers",
    "stdioConfig": {
      "typeField": "type",
      "commandField": "command",
      "argsField": "args",
      "envField": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration (via stdio with mcp-remote bridge)</strong></summary>

```json snippet=examples/configs/remote/claude-desktop.json
{
  "mcpServers": {
    "glean": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://glean-dev-be.glean.com/mcp/default"
      ]
    }
  }
}
```

</details>

<details>
<summary><strong>Standard I/O Configuration (local process)</strong></summary>

```json snippet=examples/configs/local/claude-desktop.json
{
  "mcpServers": {
    "glean": {
      "command": "npx",
      "args": [
        "-y",
        "@gleanwork/local-mcp-server"
      ],
      "type": "stdio",
      "env": {
        "GLEAN_INSTANCE": "your-instance",
        "GLEAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

</details>

---

### Claude for Teams/Enterprise

- **Compatibility**: No local configuration support
- **Connection Type**: stdio only (requires mcp-remote for HTTP servers)
- **Documentation**: [Documentation](https://docs.anthropic.com/en/docs/claude-desktop)
- **Notes**: MCP servers are centrally managed by admins. No local configuration support - servers must be configured at the organization level.

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/claude-teams-enterprise.json
{
  "id": "claude-teams-enterprise",
  "name": "claude-teams-enterprise",
  "displayName": "Claude for Teams/Enterprise",
  "description": "Claude for Teams and Enterprise",
  "localConfigSupport": "none",
  "localConfigNotes": "MCP servers are centrally managed by admins. No local configuration support - servers must be configured at the organization level.",
  "clientSupports": "stdio-only",
  "requiresMcpRemoteForHttp": true,
  "supportedPlatforms": [],
  "configFormat": "json",
  "configPath": {},
  "documentationUrl": "https://docs.anthropic.com/en/docs/claude-desktop",
  "configStructure": {
    "serverKey": ""
  }
}
```

</details>

---

### Cursor

- **Compatibility**: Full local configuration support
- **Connection Type**: Native HTTP support
- **Documentation**: [Cursor MCP Docs](https://docs.cursor.com/context/model-context-protocol)
- **Supported Platforms**: macOS, Linux, Windows
- **Configuration Paths**:
  - **macOS/Linux: `$HOME/.cursor/mcp.json`
  - **Windows**: `%USERPROFILE%\.cursor\mcp.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/cursor.json
{
  "id": "cursor",
  "name": "cursor",
  "displayName": "Cursor",
  "description": "Cursor with native HTTP support",
  "localConfigSupport": "full",
  "documentationUrl": "https://docs.cursor.com/context/model-context-protocol",
  "clientSupports": "http",
  "requiresMcpRemoteForHttp": false,
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/.cursor/mcp.json",
    "linux": "$HOME/.cursor/mcp.json",
    "win32": "%USERPROFILE%\\.cursor\\mcp.json"
  },
  "oneClick": {
    "protocol": "cursor://",
    "urlTemplate": "cursor://anysphere.cursor-deeplink/mcp/install?name={{name}}&config={{config}}",
    "configFormat": "base64-json"
  },
  "configStructure": {
    "serverKey": "mcpServers",
    "httpConfig": {
      "typeField": "type",
      "urlField": "url"
    },
    "stdioConfig": {
      "typeField": "type",
      "commandField": "command",
      "argsField": "args",
      "envField": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration (native)</strong></summary>

```json snippet=examples/configs/remote/cursor.json
{
  "mcpServers": {
    "glean": {
      "type": "http",
      "url": "https://glean-dev-be.glean.com/mcp/default"
    }
  }
}
```

</details>

<details>
<summary><strong>Standard I/O Configuration (local process)</strong></summary>

```json snippet=examples/configs/local/cursor.json
{
  "mcpServers": {
    "glean": {
      "command": "npx",
      "args": [
        "-y",
        "@gleanwork/local-mcp-server"
      ],
      "type": "stdio",
      "env": {
        "GLEAN_INSTANCE": "your-instance",
        "GLEAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

</details>

---

### Goose

- **Compatibility**: Full local configuration support
- **Connection Type**: Native HTTP support
- **Documentation**: [Goose GitHub](https://github.com/block/goose)
- **Supported Platforms**: macOS, Linux, Windows
- **Configuration Format**: YAML
- **Configuration Paths**:
  - **macOS/Linux: `$HOME/.config/goose/config.yaml`
  - **Windows**: `%USERPROFILE%\.config\goose\config.yaml`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/goose.json
{
  "id": "goose",
  "name": "goose",
  "displayName": "Goose",
  "description": "Goose with native HTTP support",
  "localConfigSupport": "full",
  "documentationUrl": "https://github.com/block/goose",
  "clientSupports": "http",
  "requiresMcpRemoteForHttp": false,
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "yaml",
  "configPath": {
    "darwin": "$HOME/.config/goose/config.yaml",
    "linux": "$HOME/.config/goose/config.yaml",
    "win32": "%USERPROFILE%\\.config\\goose\\config.yaml"
  },
  "configStructure": {
    "serverKey": "extensions",
    "httpConfig": {
      "typeField": "type",
      "urlField": "uri"
    },
    "stdioConfig": {
      "typeField": "type",
      "commandField": "cmd",
      "argsField": "args",
      "envField": "envs"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration (native)</strong></summary>

```yaml snippet=examples/configs/remote/goose.yaml
extensions:
  glean:
    enabled: true
    name: glean
    type: streamable_http
    uri: https://glean-dev-be.glean.com/mcp/default
    envs: {}
    env_keys: []
    headers: {}
    description: ''
    timeout: 300
    bundled: null
    available_tools: []
```

</details>

<details>
<summary><strong>Standard I/O Configuration (local process)</strong></summary>

```yaml snippet=examples/configs/local/goose.yaml
extensions:
  glean:
    name: glean
    cmd: npx
    args:
      - '-y'
      - '@gleanwork/local-mcp-server'
    type: stdio
    envs:
      GLEAN_INSTANCE: your-instance
      GLEAN_API_TOKEN: your-api-token
    timeout: 300
    enabled: true
    bundled: null
    description: null
    env_keys: []
```

</details>

---

### Visual Studio Code

- **Compatibility**: Full local configuration support
- **Connection Type**: Native HTTP support
- **Documentation**: [Visual Studio Code Docs](https://code.visualstudio.com/docs)
- **Supported Platforms**: macOS, Linux, Windows
- **Configuration Paths**:
  - **macOS**: `$HOME/Library/Application Support/Code/User/mcp.json`
  - **Linux**: `$HOME/.config/Code/User/mcp.json`
  - **Windows**: `%APPDATA%\Code\User\mcp.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/vscode.json
{
  "id": "vscode",
  "name": "vscode",
  "displayName": "Visual Studio Code",
  "description": "VS Code with native HTTP support",
  "localConfigSupport": "full",
  "documentationUrl": "https://code.visualstudio.com/docs",
  "clientSupports": "http",
  "requiresMcpRemoteForHttp": false,
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/Library/Application Support/Code/User/mcp.json",
    "linux": "$HOME/.config/Code/User/mcp.json",
    "win32": "%APPDATA%\\Code\\User\\mcp.json"
  },
  "configStructure": {
    "serverKey": "servers",
    "httpConfig": {
      "typeField": "type",
      "urlField": "url"
    },
    "stdioConfig": {
      "typeField": "type",
      "commandField": "command",
      "argsField": "args",
      "envField": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration (native)</strong></summary>

```json snippet=examples/configs/remote/vscode.json
{
  "servers": {
    "glean": {
      "type": "http",
      "url": "https://glean-dev-be.glean.com/mcp/default"
    }
  }
}
```

</details>

<details>
<summary><strong>Standard I/O Configuration (local process)</strong></summary>

```json snippet=examples/configs/local/vscode.json
{
  "servers": {
    "glean": {
      "command": "npx",
      "args": [
        "-y",
        "@gleanwork/local-mcp-server"
      ],
      "type": "stdio",
      "env": {
        "GLEAN_INSTANCE": "your-instance",
        "GLEAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

</details>

---

### Windsurf

- **Compatibility**: Full local configuration support
- **Connection Type**: stdio only (requires mcp-remote for HTTP servers)
- **Documentation**: [Windsurf Docs](https://docs.codeium.com/windsurf)
- **Supported Platforms**: macOS, Linux, Windows
- **Notes**: Requires mcp-remote bridge for remote servers
- **Configuration Paths**:
  - **macOS/Linux: `$HOME/.codeium/windsurf/mcp_config.json`
  - **Windows**: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/windsurf.json
{
  "id": "windsurf",
  "name": "windsurf",
  "displayName": "Windsurf",
  "description": "Windsurf only supports stdio, requires mcp-remote for HTTP servers",
  "localConfigSupport": "full",
  "localConfigNotes": "Requires mcp-remote for remote servers",
  "documentationUrl": "https://docs.codeium.com/windsurf",
  "clientSupports": "stdio-only",
  "requiresMcpRemoteForHttp": true,
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/.codeium/windsurf/mcp_config.json",
    "linux": "$HOME/.codeium/windsurf/mcp_config.json",
    "win32": "%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json"
  },
  "configStructure": {
    "serverKey": "mcpServers",
    "stdioConfig": {
      "commandField": "command",
      "argsField": "args",
      "envField": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration (via stdio with mcp-remote bridge)</strong></summary>

```json snippet=examples/configs/remote/windsurf.json
{
  "mcpServers": {
    "glean": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://glean-dev-be.glean.com/mcp/default"
      ]
    }
  }
}
```

</details>

<details>
<summary><strong>Standard I/O Configuration (local process)</strong></summary>

```json snippet=examples/configs/local/windsurf.json
{
  "mcpServers": {
    "glean": {
      "command": "npx",
      "args": [
        "-y",
        "@gleanwork/local-mcp-server"
      ],
      "env": {
        "GLEAN_INSTANCE": "your-instance",
        "GLEAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

</details>

---

## Connection Types Explained

### Native HTTP Clients
Clients that can connect directly to HTTP MCP servers without additional tooling:
- Claude Code
- Cursor
- Goose
- Visual Studio Code

### stdio-only Clients
Clients that communicate via stdio and require `mcp-remote` as a bridge for HTTP servers:
- Claude for Desktop
- Windsurf

### Web-based/Managed Clients
Clients that don't support local configuration files:
- ChatGPT (chatgpt is web-based and requires creating custom gpts through their web ui. no local configuration file support.)
- Claude for Teams/Enterprise (mcp servers are centrally managed by admins. no local configuration support - servers must be configured at the organization level.)

## Configuration File Formats

### JSON Format
Used by: Claude Code, VS Code, Claude Desktop, Cursor, Windsurf

### YAML Format
Used by: Goose

## Platform Support

### Full Cross-Platform Support
- Visual Studio Code
- Cursor
- Goose
- Windsurf

### macOS and Windows Only
- Claude for Desktop

### macOS, Linux, and Windows
- Claude Code

## One-Click Protocol Support

Some clients support one-click installation via custom protocols:

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [mcp-remote Bridge](https://www.npmjs.com/package/mcp-remote)
- [@gleanwork/local-mcp-server](https://www.npmjs.com/package/@gleanwork/local-mcp-server)

---

*This document is automatically generated from the configuration files in the `configs/` directory. To update, run `npm run generate:docs`.*