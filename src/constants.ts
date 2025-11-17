/**
 * Canonical client IDs for MCP clients
 */
export const CLIENT = {
  CLAUDE_CODE: 'claude-code',
  CLAUDE_DESKTOP: 'claude-desktop',
  CLAUDE_TEAMS_ENTERPRISE: 'claude-teams-enterprise',
  CODEX: 'codex',
  CURSOR: 'cursor',
  VSCODE: 'vscode',
  WINDSURF: 'windsurf',
  GOOSE: 'goose',
  CHATGPT: 'chatgpt',
  JUNIE: 'junie',
  JETBRAINS: 'jetbrains',
} as const;

/**
 * Display names for MCP clients
 */
export const CLIENT_DISPLAY_NAME = {
  CLAUDE_CODE: 'Claude Code',
  CLAUDE_DESKTOP: 'Claude for Desktop',
  CLAUDE_TEAMS_ENTERPRISE: 'Claude for Teams/Enterprise',
  CODEX: 'Codex',
  CURSOR: 'Cursor',
  VSCODE: 'VS Code',
  WINDSURF: 'Windsurf',
  GOOSE: 'Goose',
  CHATGPT: 'ChatGPT',
  JUNIE: 'Junie (JetBrains)',
  JETBRAINS: 'JetBrains AI Assistant',
} as const;

/**
 * Type-safe client ID type derived from the constants
 */
export type ClientIdConstant = (typeof CLIENT)[keyof typeof CLIENT];

/**
 * Type-safe display name type derived from the constants
 */
export type ClientDisplayName = (typeof CLIENT_DISPLAY_NAME)[keyof typeof CLIENT_DISPLAY_NAME];

/**
 * Helper to get display name from client ID
 */
export function getDisplayName(clientId: ClientIdConstant): ClientDisplayName {
  const mapping: Record<ClientIdConstant, ClientDisplayName> = {
    [CLIENT.CLAUDE_CODE]: CLIENT_DISPLAY_NAME.CLAUDE_CODE,
    [CLIENT.CLAUDE_DESKTOP]: CLIENT_DISPLAY_NAME.CLAUDE_DESKTOP,
    [CLIENT.CLAUDE_TEAMS_ENTERPRISE]: CLIENT_DISPLAY_NAME.CLAUDE_TEAMS_ENTERPRISE,
    [CLIENT.CODEX]: CLIENT_DISPLAY_NAME.CODEX,
    [CLIENT.CURSOR]: CLIENT_DISPLAY_NAME.CURSOR,
    [CLIENT.VSCODE]: CLIENT_DISPLAY_NAME.VSCODE,
    [CLIENT.WINDSURF]: CLIENT_DISPLAY_NAME.WINDSURF,
    [CLIENT.GOOSE]: CLIENT_DISPLAY_NAME.GOOSE,
    [CLIENT.CHATGPT]: CLIENT_DISPLAY_NAME.CHATGPT,
    [CLIENT.JUNIE]: CLIENT_DISPLAY_NAME.JUNIE,
    [CLIENT.JETBRAINS]: CLIENT_DISPLAY_NAME.JETBRAINS,
  };
  return mapping[clientId];
}
