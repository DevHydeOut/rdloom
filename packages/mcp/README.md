# @rdloom/mcp

An MCP server that gives AI coding agents the real [rdloom](https://www.npmjs.com/package/rdloom) component APIs — props, usage rules, accessibility requirements, tokens and source — so they stop inventing props that don't exist.

## Setup

```bash
npx rdloom init
```

That registers this server in your project's `.mcp.json` (and `.cursor/` or `.vscode/` when present). To add it by hand:

```json
{
  "mcpServers": {
    "rdloom": { "command": "npx", "args": ["-y", "@rdloom/mcp"] }
  }
}
```

Works with Claude Code, Cursor, Copilot, Codex and any other MCP client.

## Tools

All read-only; nothing is written to your project.

| Tool | What it answers |
|---|---|
| `list_components` | What exists, ranked by a search |
| `get_component` | Props, types, usage, anti-patterns, accessibility |
| `get_component_source` | The actual source of a component's files |
| `get_example` | A tested example, ready to adapt |
| `get_tokens` | Design tokens and their CSS variables, light and dark |
| `validate_props` | Checks props against the spec before the agent writes them |
| `get_setup` | How to install and wire rdloom into a project |

`validate_props` is the one that matters most in practice. It catches the mistakes agents actually make:

```
"outline" isn't allowed for `variant`
`disabled` isn't in the spec — did you mean `isDisabled`?
Missing required prop `children`
```

## Why it exists

Component APIs change, and a model's training data doesn't. This server reads from the same specs that generate the components, the documentation and the Figma library — so what the agent is told always matches what the code does.

---

[github.com/DevHydeOut/rdloom](https://github.com/DevHydeOut/rdloom) · MIT
