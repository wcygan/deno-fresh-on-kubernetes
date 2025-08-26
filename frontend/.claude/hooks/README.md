# Claude Code Hooks

This directory contains hooks that run automatically during Claude Code operations.

## Active Hooks

### test-on-edit
- **Trigger**: After any Edit, MultiEdit, or Write operation
- **Purpose**: Automatically runs the test suite to ensure code changes don't break existing functionality
- **Command**: `cd frontend && deno task test`
- **Behavior**: 
  - Runs all tests after any file modification
  - Blocks further operations if tests fail
  - Provides immediate feedback on code changes

## Hook Environment Variables

Hooks have access to:
- `CLAUDE_HOOK_TOOL_NAME`: The name of the tool that triggered the hook
- `CLAUDE_HOOK_PARAMS`: JSON string of the tool's parameters
- `CLAUDE_HOOK_RESULT`: The result of the tool execution

## Adding New Hooks

To add a new hook:
1. Create an executable bash script in this directory
2. Name it descriptively (e.g., `format-on-save`, `lint-before-commit`)
3. Make it executable: `chmod +x hook-name`
4. Test it manually before relying on it

## Disabling Hooks

To temporarily disable a hook, rename it with a `.disabled` extension or remove execute permissions.