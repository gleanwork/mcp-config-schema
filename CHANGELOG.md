# Changelog

All notable changes to this project will be documented in this file.

> **Note:** This monorepo was created by consolidating `@gleanwork/mcp-config-schema` and `@gleanwork/mcp-config` (now `@gleanwork/mcp-config-glean`). Historical entries below v4.0.0 refer to `@gleanwork/mcp-config-schema` only.


## v4.0.0 (2026-01-14)

#### :house: Internal
* `mcp-config-glean`, `mcp-config-schema`
  * [#83](https://github.com/gleanwork/mcp-config/pull/83) refactor: consolidate tooling configuration at monorepo root ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
  * [#82](https://github.com/gleanwork/mcp-config/pull/82) feat: convert to npm workspaces monorepo ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1
- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))


## v3.1.1 (2026-01-10)

#### :bug: Bug Fix
* [#81](https://github.com/gleanwork/mcp-config/pull/81) fix: return null from buildCommand for clients without configPath ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1
- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))


## v3.1.0 (2026-01-08)

#### :rocket: Enhancement
* [#79](https://github.com/gleanwork/mcp-config/pull/79) feat(jetbrains): add native HTTP transport support (2025.2+) ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
* [#76](https://github.com/gleanwork/mcp-config/pull/76) deprecate: mark getNormalizedServersConfig for removal in v4.0.0 ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### :bug: Bug Fix
* [#78](https://github.com/gleanwork/mcp-config/pull/78) fix(junie): correct config path from ~/.junie/mcp.json to ~/.junie/mcp/mcp.json ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
* [#77](https://github.com/gleanwork/mcp-config/pull/77) docs: fix outdated documentation URLs ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### :house: Internal
* [#80](https://github.com/gleanwork/mcp-config/pull/80) feat: add config validation Claude Code commands ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1
- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))


## v3.0.0 (2026-01-06)

#### :boom: Breaking Change

- [#74](https://github.com/gleanwork/mcp-config/pull/74) refactor: make server naming vendor-neutral with serverNameBuilder callback ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
- [#73](https://github.com/gleanwork/mcp-config/pull/73) feat: replace cliPackage with commandBuilder callback for vendor neutrality ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
- [#69](https://github.com/gleanwork/mcp-config/pull/69) refactor: update scripts to use stdio/http terminology and add markdown helpers ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
- [#67](https://github.com/gleanwork/mcp-config/pull/67) feat: make package vendor-neutral with generic API ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### :rocket: Enhancement

- [#68](https://github.com/gleanwork/mcp-config/pull/68) feat: add comprehensive type safety for config builders ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
- [#66](https://github.com/gleanwork/mcp-config/pull/66) feat: add Gemini CLI support ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### :memo: Documentation

- [#75](https://github.com/gleanwork/mcp-config/pull/75) docs: update documentation for vendor-neutral API changes ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v2.0.1 (2025-12-09)

#### :bug: Bug Fix

- [#64](https://github.com/gleanwork/mcp-config/pull/64) fix: windsurf manual configuration ([@david-hamilton-glean](https://github.com/david-hamilton-glean))

#### Committers: 2

- David J. Hamilton ([@david-hamilton-glean](https://github.com/david-hamilton-glean))
- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v2.0.0 (2025-11-18)

#### :boom: Breaking Change

- [#57](https://github.com/gleanwork/mcp-config/pull/57) breaking: Renaming for better semantic meaning ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### :rocket: Enhancement

- [#55](https://github.com/gleanwork/mcp-config/pull/55) feat: Adds support for Jetbrains IDEs (+Junie) ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
- [#56](https://github.com/gleanwork/mcp-config/pull/56) feat: Adds support for Codex ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### :memo: Documentation

- [#59](https://github.com/gleanwork/mcp-config/pull/59) internal: Updates README.md and CLAUDE.md based on recent semantic changes ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 2

- Nathaniel Furniss ([@nathaniel-furniss-glean](https://github.com/nathaniel-furniss-glean))
- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v1.0.0 (2025-11-05)

#### :boom: Breaking Change

- [#54](https://github.com/gleanwork/mcp-config/pull/54) chore: Updates Windsurf configuration to support native HTTP ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### :rocket: Enhancement

- [#54](https://github.com/gleanwork/mcp-config/pull/54) chore: Updates Windsurf configuration to support native HTTP ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.14.0 (2025-10-25)

#### :boom: Breaking Change

- [#41](https://github.com/gleanwork/mcp-config/pull/41) refactor: Move zod to peerDependencies to support v3 and v4 ([@rwjblue-glean](https://github.com/rwjblue-glean))

#### :memo: Documentation

- [#52](https://github.com/gleanwork/mcp-config/pull/52) docs: Updates documentation links for supported hosts ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 3

- David J. Hamilton ([@david-hamilton-glean](https://github.com/david-hamilton-glean))
- Robert Jackson ([@rwjblue-glean](https://github.com/rwjblue-glean))
- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.13.1 (2025-09-18)

#### :bug: Bug Fix

- [#26](https://github.com/gleanwork/mcp-config/pull/26) Fix ChatGPT/Claude Enterprise "requires mcp-remote" ([@david-hamilton-glean](https://github.com/david-hamilton-glean))

#### :house: Internal

- [#23](https://github.com/gleanwork/mcp-config/pull/23) chore: upgrade to ESLint 9 with flat config ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 2

- David J. Hamilton ([@david-hamilton-glean](https://github.com/david-hamilton-glean))
- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.13.0 (2025-09-12)

#### :rocket: Enhancement

- [#22](https://github.com/gleanwork/mcp-config/pull/22) feat: Support white labeling for product names ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.12.2 (2025-09-10)

#### :bug: Bug Fix

- [#21](https://github.com/gleanwork/mcp-config/pull/21) fix: Updates our one click url generator to not rely on Buffer for browser envs ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.12.1 (2025-09-02)

#### :bug: Bug Fix

- [#20](https://github.com/gleanwork/mcp-config/pull/20) fix: Exports server name utils as part of browser bundle ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.12.0 (2025-09-02)

#### :rocket: Enhancement

- [#19](https://github.com/gleanwork/mcp-config/pull/19) feat: Adds optional version param to buildCommand (for pre-release packages) ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
- [#18](https://github.com/gleanwork/mcp-config/pull/18) feat: Adds buildCommand function to centralize CLI configuration command building ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### :bug: Bug Fix

- [#17](https://github.com/gleanwork/mcp-config/pull/17) fix: Fixes vscode protocol to exclude double slashes (as per their docs) ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.11.0 (2025-08-29)

#### :rocket: Enhancement

- [#16](https://github.com/gleanwork/mcp-config/pull/16) fix: Updates to support more expansive config support coverage ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.10.0 (2025-08-29)

#### :rocket: Enhancement

- [#15](https://github.com/gleanwork/mcp-config/pull/15) internal: Refactors to use a builder pattern. Adds additional functionality to standardize config generation ([@steve-calvert-glean](https://github.com/steve-calvert-glean))
- [#14](https://github.com/gleanwork/mcp-config/pull/14) feat: Adds oneclick support for vscode (as per their docs) ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### :house: Internal

- [#15](https://github.com/gleanwork/mcp-config/pull/15) internal: Refactors to use a builder pattern. Adds additional functionality to standardize config generation ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.9.0 (2025-08-26)

#### :rocket: Enhancement

- [#13](https://github.com/gleanwork/mcp-config/pull/13) Export CLIENT and CLIENT_DISPLAY_NAME constants in browser bundle ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.8.0 (2025-08-26)

#### :rocket: Enhancement

- [#11](https://github.com/gleanwork/mcp-config/pull/11) feat: Update Goose to support native HTTP ([@chris-freeman-glean](https://github.com/chris-freeman-glean))

#### :house: Internal

- [#12](https://github.com/gleanwork/mcp-config/pull/12) internal: Updates CLIENTS.md following config changes ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 2

- Chris Freeman ([@chris-freeman-glean](https://github.com/chris-freeman-glean))
- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.7.0 (2025-08-23)

#### :rocket: Enhancement

- [#10](https://github.com/gleanwork/mcp-config/pull/10) feat: Adds claude desktop linux support ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.6.0 (2025-08-23)

#### :rocket: Enhancement

- [#9](https://github.com/gleanwork/mcp-config/pull/9) feat: Adds the ability to build glean MCP server names ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.5.0 (2025-08-22)

## v0.4.4 (2025-08-21)

#### :bug: Bug Fix

- [#7](https://github.com/gleanwork/mcp-config/pull/7) fix: Updates Claude to use Teams/Enterprise for org connectors ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.4.3 (2025-08-21)

#### :bug: Bug Fix

- [#6](https://github.com/gleanwork/mcp-config/pull/6) fix: Fixes broken package exports ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.4.2 (2025-08-21)

#### :bug: Bug Fix

- [#3](https://github.com/gleanwork/mcp-config/pull/3) feat: update cursor to HTTP native ([@david-hamilton-glean](https://github.com/david-hamilton-glean))

#### :house: Internal

- [#5](https://github.com/gleanwork/mcp-config/pull/5) chore: add CODEOWNERS ([@david-hamilton-glean](https://github.com/david-hamilton-glean))
- [#4](https://github.com/gleanwork/mcp-config/pull/4) chore: update generate-clients script ([@david-hamilton-glean](https://github.com/david-hamilton-glean))
- [#2](https://github.com/gleanwork/mcp-config/pull/2) chore: Add CLAUDE.md ([@david-hamilton-glean](https://github.com/david-hamilton-glean))

#### Committers: 1

- David J. Hamilton ([@david-hamilton-glean](https://github.com/david-hamilton-glean))

## v0.4.0 (2025-08-21)

#### :rocket: Enhancement

- [#1](https://github.com/gleanwork/mcp-config/pull/1) Adds partial output of configs ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

#### Committers: 1

- Steve Calvert ([@steve-calvert-glean](https://github.com/steve-calvert-glean))

## v0.3.0 (2025-08-19)

## v0.2.0 (2025-08-19)
