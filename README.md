# claude-mem-copilot

VS Code Copilot MCP server and hook bridge for [Claude-Mem](https://github.com/thedotmack/claude-mem) project memory.

This package lets Copilot query Claude-Mem through MCP tools and, when VS Code Copilot hooks are enabled, capture useful session/tool events back into Claude-Mem.

> VS Code Copilot hooks are currently preview functionality. Keep this package on `0.x` until the hook contract is stable.

## Requirements

- Node.js 20 or newer.
- Claude-Mem installed and its worker running locally.
- Claude-Mem worker reachable at `http://127.0.0.1:37777` or configured with environment variables.

## Quickstart

```bash
npx claude-mem-copilot setup --adapter vscode-copilot
```

Then restart or reload VS Code and check the MCP server/tools in Copilot Chat.

Run diagnostics:

```bash
npx claude-mem-copilot doctor
```

## Manual MCP Setup

Add this to `.vscode/mcp.json`:

```json
{
  "servers": {
    "claude-mem-copilot": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "claude-mem-copilot"]
    }
  }
}
```

## Manual Hook Setup

Add `.github/hooks/claude-mem-copilot.json`:

```json
{
  "hooks": {
    "SessionStart": [
      { "type": "command", "command": "npx -y claude-mem-copilot hook vscode-copilot sessionstart" }
    ],
    "PreToolUse": [
      { "type": "command", "command": "npx -y claude-mem-copilot hook vscode-copilot pretooluse" }
    ],
    "PostToolUse": [
      { "type": "command", "command": "npx -y claude-mem-copilot hook vscode-copilot posttooluse" }
    ],
    "PreCompact": [
      { "type": "command", "command": "npx -y claude-mem-copilot hook vscode-copilot precompact" }
    ]
  }
}
```

## MCP Tools

- `cmem_status`
- `cmem_projects`
- `cmem_search`
- `cmem_timeline`
- `cmem_get_observations`
- `cmem_recent_context`
- `cmem_start_project_session`
- `cmem_remember`
- `cmem_remember_decision`
- `cmem_remember_change`
- `cmem_summarize_project_session`
- `cmem_complete_project_session`

## Configuration

Environment variables:

- `CLAUDE_MEM_WORKER_HOST`, default `127.0.0.1`
- `CLAUDE_MEM_WORKER_PORT`, default `37777`
- `CLAUDE_MEM_WORKER_URL`, overrides host/port
- `CLAUDE_MEM_TIMEOUT_MS`, default `10000`

## Development

```bash
npm install
npm run build
npm test
npm run dev -- doctor
```

## Privacy

This bridge sends selected Copilot tool activity and explicit memory notes to the local Claude-Mem worker. Do not store secrets, tokens, credentials, or private personal data in memory.

## License

MIT
