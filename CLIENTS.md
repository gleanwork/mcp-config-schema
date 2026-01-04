# MCP Client Compatibility Matrix

This document provides a comprehensive overview of all supported MCP clients, their capabilities, and configuration requirements.

## Quick Reference

| Client | Configuration | Connection Type | Requires mcp-remote? | Platforms |
|---|---|---|---|---|
| **ChatGPT** | Managed | HTTP only | No | Web-based |
| **Claude Code** | User-configurable | HTTP native | No | macOS, Linux, Windows |
| **Claude for Desktop** | User-configurable | stdio only | Yes (for HTTP) | macOS, Windows, Linux |
| **Claude for Teams/Enterprise** | Managed | HTTP only | No | Organization-managed |
| **Codex** | User-configurable | HTTP native | No | macOS, Linux, Windows |
| **Cursor** | User-configurable | HTTP native | No | macOS, Linux, Windows |
| **Goose** | User-configurable | HTTP native | No | macOS, Linux, Windows |
| **Visual Studio Code** | User-configurable | HTTP native | No | macOS, Linux, Windows |
| **Windsurf** | User-configurable | HTTP native | No | macOS, Linux, Windows |
| **Junie (JetBrains)** | User-configurable | stdio only | Yes (for HTTP) | macOS, Linux, Windows |
| **JetBrains AI Assistant** | User-configurable | stdio only | Yes (for HTTP) | macOS, Linux, Windows |
| **Gemini CLI** | User-configurable | HTTP native | No | macOS, Linux, Windows |

## Detailed Client Information

### ChatGPT

- **Configuration**: Centrally managed
- **Connection Type**: HTTP only (managed)
- **Documentation**: [Link](https://platform.openai.com/docs/mcp#test-and-connect-your-mcp-server)
- **Notes**: ChatGPT is web-based and requires configuring MCP servers through their web UI. No local configuration file support.

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/chatgpt.json
{
  "id": "chatgpt",
  "name": "chatgpt",
  "displayName": "ChatGPT",
  "description": "ChatGPT web interface - requires MCP configuration through web UI",
  "userConfigurable": false,
  "localConfigNotes": "ChatGPT is web-based and requires configuring MCP servers through their web UI. No local configuration file support.",
  "transports": ["http"],
  "supportedPlatforms": [],
  "configFormat": "json",
  "configPath": {},
  "documentationUrl": "https://platform.openai.com/docs/mcp#test-and-connect-your-mcp-server",
  "configStructure": {
    "serversPropertyName": ""
  }
}
```

</details>

---

### Claude Code

- **Configuration**: User-configurable
- **Connection Type**: Native HTTP support
- **Documentation**: [Link](https://docs.claude.com/en/docs/claude-code/mcp)
- **Supported Platforms**: macOS, Linux, Windows
- **Configuration Paths**:
  - **macOS/Linux**: `$HOME/.claude.json`
  - **Windows**: `%USERPROFILE%\.claude.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/claude-code.json
{
  "id": "claude-code",
  "name": "claude-code",
  "displayName": "Claude Code",
  "description": "Claude Code with native HTTP support",
  "userConfigurable": true,
  "documentationUrl": "https://docs.claude.com/en/docs/claude-code/mcp",
  "transports": ["stdio", "http"],
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/.claude.json",
    "linux": "$HOME/.claude.json",
    "win32": "%USERPROFILE%\\.claude.json"
  },
  "configStructure": {
    "serversPropertyName": "mcpServers",
    "httpPropertyMapping": {
      "typeProperty": "type",
      "urlProperty": "url",
      "headersProperty": "headers"
    },
    "stdioPropertyMapping": {
      "typeProperty": "type",
      "commandProperty": "command",
      "argsProperty": "args",
      "envProperty": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration</strong></summary>

```json snippet=examples/configs/http/claude-code.json
{
  "mcpServers": {
    "glean_example": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

</details>

<details>
<summary><strong>stdio Configuration</strong></summary>

```json snippet=examples/configs/stdio/claude-code.json
{
  "mcpServers": {
    "glean_example": {
      "command": "npx",
      "args": [
        "-y",
        "@example/mcp-server"
      ],
      "type": "stdio",
      "env": {
        "EXAMPLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

---

### Claude for Desktop

- **Configuration**: User-configurable
- **Connection Type**: stdio only (requires mcp-remote for HTTP servers)
- **Documentation**: [Link](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp)
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
  "userConfigurable": true,
  "localConfigNotes": "Requires mcp-remote for remote servers",
  "documentationUrl": "https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp",
  "transports": ["stdio"],
  "supportedPlatforms": ["darwin", "win32", "linux"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/Library/Application Support/Claude/claude_desktop_config.json",
    "win32": "%APPDATA%\\Claude\\claude_desktop_config.json",
    "linux": "$HOME/.config/Claude/claude_desktop_config.json"
  },
  "configStructure": {
    "serversPropertyName": "mcpServers",
    "stdioPropertyMapping": {
      "typeProperty": "type",
      "commandProperty": "command",
      "argsProperty": "args",
      "envProperty": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration (via mcp-remote bridge)</strong></summary>

```json snippet=examples/configs/http/claude-desktop.json
{
  "mcpServers": {
    "glean_example": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.example.com/mcp"
      ]
    }
  }
}
```

</details>

<details>
<summary><strong>stdio Configuration</strong></summary>

```json snippet=examples/configs/stdio/claude-desktop.json
{
  "mcpServers": {
    "glean_example": {
      "command": "npx",
      "args": [
        "-y",
        "@example/mcp-server"
      ],
      "type": "stdio",
      "env": {
        "EXAMPLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

---

### Claude for Teams/Enterprise

- **Configuration**: Centrally managed
- **Connection Type**: HTTP only (managed)
- **Documentation**: [Link](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp)
- **Notes**: MCP servers are centrally managed by admins. No local configuration support - servers must be configured at the organization level.

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/claude-teams-enterprise.json
{
  "id": "claude-teams-enterprise",
  "name": "claude-teams-enterprise",
  "displayName": "Claude for Teams/Enterprise",
  "description": "Claude for Teams and Enterprise",
  "userConfigurable": false,
  "localConfigNotes": "MCP servers are centrally managed by admins. No local configuration support - servers must be configured at the organization level.",
  "transports": ["http"],
  "supportedPlatforms": [],
  "configFormat": "json",
  "configPath": {},
  "documentationUrl": "https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp",
  "configStructure": {
    "serversPropertyName": ""
  }
}
```

</details>

---

### Codex

- **Configuration**: User-configurable
- **Connection Type**: Native HTTP support
- **Documentation**: [Link](https://developers.openai.com/codex/mcp)
- **Supported Platforms**: macOS, Linux, Windows
- **Configuration Paths**:
  - **macOS/Linux**: `$HOME/.codex/config.toml`
  - **Windows**: `%USERPROFILE%\.codex\config.toml`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/codex.json
{
  "id": "codex",
  "name": "codex",
  "displayName": "Codex",
  "description": "OpenAI Codex with native HTTP and stdio support",
  "userConfigurable": true,
  "documentationUrl": "https://developers.openai.com/codex/mcp",
  "transports": ["stdio", "http"],
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "toml",
  "configPath": {
    "darwin": "$HOME/.codex/config.toml",
    "linux": "$HOME/.codex/config.toml",
    "win32": "%USERPROFILE%\\.codex\\config.toml"
  },
  "configStructure": {
    "serversPropertyName": "mcp_servers",
    "httpPropertyMapping": {
      "urlProperty": "url",
      "headersProperty": "http_headers"
    },
    "stdioPropertyMapping": {
      "commandProperty": "command",
      "argsProperty": "args",
      "envProperty": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration</strong></summary>

```toml snippet=examples/configs/http/codex.toml
[mcp_servers.glean_example]
url = "https://api.example.com/mcp"
```

</details>

<details>
<summary><strong>stdio Configuration</strong></summary>

```toml snippet=examples/configs/stdio/codex.toml
[mcp_servers.glean_example]
command = "npx"
args = [ "-y", "@example/mcp-server" ]

[mcp_servers.glean_example.env]
EXAMPLE_API_KEY = "your-api-key"
```

</details>

---

### Cursor

- **Configuration**: User-configurable
- **Connection Type**: Native HTTP support
- **Documentation**: [Link](https://docs.cursor.com/context/model-context-protocol)
- **Supported Platforms**: macOS, Linux, Windows
- **One-Click Protocol**: `cursor://`
- **Configuration Paths**:
  - **macOS/Linux**: `$HOME/.cursor/mcp.json`
  - **Windows**: `%USERPROFILE%\.cursor\mcp.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/cursor.json
{
  "id": "cursor",
  "name": "cursor",
  "displayName": "Cursor",
  "description": "Cursor with native HTTP support",
  "userConfigurable": true,
  "documentationUrl": "https://docs.cursor.com/context/model-context-protocol",
  "transports": ["stdio", "http"],
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/.cursor/mcp.json",
    "linux": "$HOME/.cursor/mcp.json",
    "win32": "%USERPROFILE%\\.cursor\\mcp.json"
  },
  "protocolHandler": {
    "protocol": "cursor://",
    "urlTemplate": "cursor://anysphere.cursor-deeplink/mcp/install?name={{name}}&config={{config}}",
    "configFormat": "base64-json"
  },
  "configStructure": {
    "serversPropertyName": "mcpServers",
    "httpPropertyMapping": {
      "typeProperty": "type",
      "urlProperty": "url",
      "headersProperty": "headers"
    },
    "stdioPropertyMapping": {
      "typeProperty": "type",
      "commandProperty": "command",
      "argsProperty": "args",
      "envProperty": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration</strong></summary>

```json snippet=examples/configs/http/cursor.json
{
  "mcpServers": {
    "glean_example": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

</details>

<details>
<summary><strong>stdio Configuration</strong></summary>

```json snippet=examples/configs/stdio/cursor.json
{
  "mcpServers": {
    "glean_example": {
      "command": "npx",
      "args": [
        "-y",
        "@example/mcp-server"
      ],
      "type": "stdio",
      "env": {
        "EXAMPLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

---

### Goose

- **Configuration**: User-configurable
- **Connection Type**: Native HTTP support
- **Documentation**: [Link](https://github.com/block/goose)
- **Supported Platforms**: macOS, Linux, Windows
- **Configuration Format**: YAML
- **Configuration Paths**:
  - **macOS/Linux**: `$HOME/.config/goose/config.yaml`
  - **Windows**: `%USERPROFILE%\.config\goose\config.yaml`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/goose.json
{
  "id": "goose",
  "name": "goose",
  "displayName": "Goose",
  "description": "Goose with native HTTP support",
  "userConfigurable": true,
  "documentationUrl": "https://github.com/block/goose",
  "transports": ["stdio", "http"],
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "yaml",
  "configPath": {
    "darwin": "$HOME/.config/goose/config.yaml",
    "linux": "$HOME/.config/goose/config.yaml",
    "win32": "%USERPROFILE%\\.config\\goose\\config.yaml"
  },
  "configStructure": {
    "serversPropertyName": "extensions",
    "httpPropertyMapping": {
      "typeProperty": "type",
      "urlProperty": "uri"
    },
    "stdioPropertyMapping": {
      "typeProperty": "type",
      "commandProperty": "cmd",
      "argsProperty": "args",
      "envProperty": "envs"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration</strong></summary>

```yaml snippet=examples/configs/http/goose.yaml
extensions:
  glean_example:
    enabled: true
    name: glean_example
    type: streamable_http
    uri: https://api.example.com/mcp
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
<summary><strong>stdio Configuration</strong></summary>

```yaml snippet=examples/configs/stdio/goose.yaml
extensions:
  glean_example:
    name: glean_example
    cmd: npx
    args:
      - '-y'
      - '@example/mcp-server'
    type: stdio
    timeout: 300
    enabled: true
    bundled: null
    description: null
    env_keys: []
    envs:
      EXAMPLE_API_KEY: your-api-key
```

</details>

---

### Visual Studio Code

- **Configuration**: User-configurable
- **Connection Type**: Native HTTP support
- **Documentation**: [Link](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- **Supported Platforms**: macOS, Linux, Windows
- **One-Click Protocol**: `vscode:`
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
  "userConfigurable": true,
  "documentationUrl": "https://code.visualstudio.com/docs/copilot/customization/mcp-servers",
  "transports": ["stdio", "http"],
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/Library/Application Support/Code/User/mcp.json",
    "linux": "$HOME/.config/Code/User/mcp.json",
    "win32": "%APPDATA%\\Code\\User\\mcp.json"
  },
  "protocolHandler": {
    "protocol": "vscode:",
    "urlTemplate": "vscode:mcp/install?{{config}}",
    "configFormat": "url-encoded-json"
  },
  "configStructure": {
    "serversPropertyName": "servers",
    "httpPropertyMapping": {
      "typeProperty": "type",
      "urlProperty": "url",
      "headersProperty": "headers"
    },
    "stdioPropertyMapping": {
      "typeProperty": "type",
      "commandProperty": "command",
      "argsProperty": "args",
      "envProperty": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration</strong></summary>

```json snippet=examples/configs/http/vscode.json
{
  "servers": {
    "glean_example": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

</details>

<details>
<summary><strong>stdio Configuration</strong></summary>

```json snippet=examples/configs/stdio/vscode.json
{
  "servers": {
    "glean_example": {
      "command": "npx",
      "args": [
        "-y",
        "@example/mcp-server"
      ],
      "type": "stdio",
      "env": {
        "EXAMPLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

---

### Windsurf

- **Configuration**: User-configurable
- **Connection Type**: Native HTTP support
- **Documentation**: [Link](https://docs.windsurf.com/windsurf/cascade/mcp#model-context-protocol-mcp)
- **Supported Platforms**: macOS, Linux, Windows
- **Configuration Paths**:
  - **macOS/Linux**: `$HOME/.codeium/windsurf/mcp_config.json`
  - **Windows**: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/windsurf.json
{
  "id": "windsurf",
  "name": "windsurf",
  "displayName": "Windsurf",
  "description": "Windsurf supports both stdio and native HTTP connections",
  "userConfigurable": true,
  "localConfigNotes": "Supports both stdio and native HTTP connections",
  "documentationUrl": "https://docs.windsurf.com/windsurf/cascade/mcp#model-context-protocol-mcp",
  "transports": ["stdio", "http"],
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/.codeium/windsurf/mcp_config.json",
    "linux": "$HOME/.codeium/windsurf/mcp_config.json",
    "win32": "%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json"
  },
  "configStructure": {
    "serversPropertyName": "mcpServers",
    "httpPropertyMapping": {
      "urlProperty": "serverUrl",
      "headersProperty": "headers"
    },
    "stdioPropertyMapping": {
      "commandProperty": "command",
      "argsProperty": "args",
      "envProperty": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration</strong></summary>

```json snippet=examples/configs/http/windsurf.json
{
  "mcpServers": {
    "glean_example": {
      "serverUrl": "https://api.example.com/mcp"
    }
  }
}
```

</details>

<details>
<summary><strong>stdio Configuration</strong></summary>

```json snippet=examples/configs/stdio/windsurf.json
{
  "mcpServers": {
    "glean_example": {
      "command": "npx",
      "args": [
        "-y",
        "@example/mcp-server"
      ],
      "env": {
        "EXAMPLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

---

### Junie (JetBrains)

- **Configuration**: User-configurable
- **Connection Type**: stdio only (requires mcp-remote for HTTP servers)
- **Documentation**: [Link](https://www.jetbrains.com/help/junie/model-context-protocol-mcp.html)
- **Supported Platforms**: macOS, Linux, Windows
- **Notes**: Requires mcp-remote bridge for remote servers
- **Configuration Paths**:
  - **macOS/Linux**: `$HOME/.junie/mcp.json`
  - **Windows**: `%USERPROFILE%\.junie\mcp.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/junie.json
{
  "id": "junie",
  "name": "junie",
  "displayName": "Junie (JetBrains)",
  "description": "JetBrains Junie AI agent - stdio only, requires mcp-remote for HTTP",
  "userConfigurable": true,
  "localConfigNotes": "Requires mcp-remote for remote servers",
  "documentationUrl": "https://www.jetbrains.com/help/junie/model-context-protocol-mcp.html",
  "transports": ["stdio"],
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/.junie/mcp.json",
    "linux": "$HOME/.junie/mcp.json",
    "win32": "%USERPROFILE%\\.junie\\mcp.json"
  },
  "configStructure": {
    "serversPropertyName": "mcpServers",
    "stdioPropertyMapping": {
      "typeProperty": "type",
      "commandProperty": "command",
      "argsProperty": "args",
      "envProperty": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration (via mcp-remote bridge)</strong></summary>

```json snippet=examples/configs/http/junie.json
{
  "mcpServers": {
    "glean_example": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.example.com/mcp"
      ]
    }
  }
}
```

</details>

<details>
<summary><strong>stdio Configuration</strong></summary>

```json snippet=examples/configs/stdio/junie.json
{
  "mcpServers": {
    "glean_example": {
      "command": "npx",
      "args": [
        "-y",
        "@example/mcp-server"
      ],
      "type": "stdio",
      "env": {
        "EXAMPLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

---

### JetBrains AI Assistant

- **Configuration**: User-configurable
- **Connection Type**: stdio only (requires mcp-remote for HTTP servers)
- **Documentation**: [Link](https://www.jetbrains.com/help/ai-assistant/mcp.html)
- **Supported Platforms**: macOS, Linux, Windows

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/jetbrains.json
{
  "id": "jetbrains",
  "name": "jetbrains",
  "displayName": "JetBrains AI Assistant",
  "description": "JetBrains AI Assistant for all JetBrains IDEs - stdio only, configure via IDE UI",
  "userConfigurable": true,
  "localConfigNotes": "Configuration must be pasted into Settings → Tools → AI Assistant → Model Context Protocol → Add → As JSON. Direct file writing is not supported due to version-specific XML storage.",
  "documentationUrl": "https://www.jetbrains.com/help/ai-assistant/mcp.html",
  "transports": ["stdio"],
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {},
  "configStructure": {
    "serversPropertyName": "mcpServers",
    "stdioPropertyMapping": {
      "typeProperty": "type",
      "commandProperty": "command",
      "argsProperty": "args",
      "envProperty": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration (via mcp-remote bridge)</strong></summary>

```json snippet=examples/configs/http/jetbrains.json
{
  "mcpServers": {
    "glean_example": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.example.com/mcp"
      ]
    }
  }
}
```

</details>

<details>
<summary><strong>stdio Configuration</strong></summary>

```json snippet=examples/configs/stdio/jetbrains.json
{
  "mcpServers": {
    "glean_example": {
      "command": "npx",
      "args": [
        "-y",
        "@example/mcp-server"
      ],
      "type": "stdio",
      "env": {
        "EXAMPLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

---

### Gemini CLI

- **Configuration**: User-configurable
- **Connection Type**: Native HTTP support
- **Documentation**: [Link](https://geminicli.com/docs/tools/mcp-server/)
- **Supported Platforms**: macOS, Linux, Windows
- **Configuration Paths**:
  - **macOS/Linux**: `$HOME/.gemini/settings.json`
  - **Windows**: `%USERPROFILE%\.gemini\settings.json`

<details>
<summary><strong>Internal Configuration Schema</strong></summary>

```json snippet=configs/gemini.json
{
  "id": "gemini",
  "name": "gemini",
  "displayName": "Gemini CLI",
  "description": "Gemini CLI with native HTTP and stdio support",
  "userConfigurable": true,
  "documentationUrl": "https://geminicli.com/docs/tools/mcp-server/",
  "transports": ["stdio", "http"],
  "supportedPlatforms": ["darwin", "linux", "win32"],
  "configFormat": "json",
  "configPath": {
    "darwin": "$HOME/.gemini/settings.json",
    "linux": "$HOME/.gemini/settings.json",
    "win32": "%USERPROFILE%\\.gemini\\settings.json"
  },
  "configStructure": {
    "serversPropertyName": "mcpServers",
    "httpPropertyMapping": {
      "urlProperty": "httpUrl",
      "headersProperty": "headers"
    },
    "stdioPropertyMapping": {
      "commandProperty": "command",
      "argsProperty": "args",
      "envProperty": "env"
    }
  }
}
```

</details>

<details>
<summary><strong>HTTP Configuration</strong></summary>

```json snippet=examples/configs/http/gemini.json
{
  "mcpServers": {
    "glean_example": {
      "httpUrl": "https://api.example.com/mcp"
    }
  }
}
```

</details>

<details>
<summary><strong>stdio Configuration</strong></summary>

```json snippet=examples/configs/stdio/gemini.json
{
  "mcpServers": {
    "glean_example": {
      "command": "npx",
      "args": [
        "-y",
        "@example/mcp-server"
      ],
      "env": {
        "EXAMPLE_API_KEY": "your-api-key"
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
- Codex
- Cursor
- Goose
- Visual Studio Code
- Windsurf
- Gemini CLI

### stdio-only Clients
Clients that communicate via stdio and require `mcp-remote` as a bridge for HTTP servers:
- Claude for Desktop
- Junie (JetBrains)
- JetBrains AI Assistant

### Web-based/Managed Clients
Clients that don't support local configuration files:
- ChatGPT (chatgpt is web-based and requires configuring mcp servers through their web ui. no local configuration file support.)
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
- **Cursor**: `cursor://`
- **Visual Studio Code**: `vscode:`

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [mcp-remote Bridge](https://www.npmjs.com/package/mcp-remote)
- [@gleanwork/local-mcp-server](https://www.npmjs.com/package/@gleanwork/local-mcp-server)

---

*This document is automatically generated from the configuration files in the `configs/` directory. To update, run `npm run generate:docs`.*