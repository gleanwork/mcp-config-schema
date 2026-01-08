# Apply Config Fixes

## Purpose
Apply fixes identified in the validation report to the MCP client configuration files.

## Prerequisites
- Run `/validate-configs` first to generate the validation report
- Review `.claude/config-validation-report.md` for identified issues

## Instructions

1. **Read the validation report** at `.claude/config-validation-report.md`

2. **For each issue identified**, apply the fix:
   - Update the config file in `/configs/`
   - Update related documentation (CLAUDE.md, CLIENTS.md)
   - Update tests if behavior changes

3. **After applying fixes**:
   - Run `npm run generate:docs` to regenerate examples
   - Run `npm run test:all` to verify all tests pass

4. **Group changes logically for PRs**:
   - Documentation URL fixes together
   - Config path fixes together
   - Transport/feature additions as separate PRs
   - Each PR should be independently reviewable

## Commit Conventions

Use conventional commit format:
- `docs:` - Documentation URL updates
- `fix:` - Config path or property corrections
- `feat:` - New transport support or capabilities

## Quality Checklist

Before creating PRs:
- [ ] All tests pass (`npm run test:all`)
- [ ] Examples regenerated (`npm run generate:docs`)
- [ ] Changes verified against official documentation
- [ ] PR descriptions include verification source
