# @anamnesic/mcp-server

MCP (Model Context Protocol) server for Anamnesic. Allows AI assistants to query and manage project context directly.

## Setup

Build:

```bash
cd packages/mcp-server
pnpm build
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "anamnesic": {
      "command": "node",
      "args": ["/absolute/path/to/packages/mcp-server/dist/index.js"]
    }
  }
}
```

### VS Code (GitHub Copilot / Copilot Chat)

Add to `.vscode/settings.json` or user settings:

```json
{
  "mcp": {
    "servers": {
      "anamnesic": {
        "command": "node",
        "args": ["./packages/mcp-server/dist/index.js"]
      }
    }
  }
}
```

### Cursor

Add to Cursor's MCP settings with the same `command` + `args` pattern.

## Available Tools

### Projects

- `list_projects` - List all projects
- `create_project` - Create project (name, description?)
- `get_project` - Get full project by ID or name
- `delete_project` - Delete a project

### Context Entries

- `add_context` - Add entry (projectId, key, value, category?, priority?)
- `update_context` - Update entry (id, key?, value?, category?, priority?)
- `remove_context` - Delete entry (id)
- `list_context` - List entries (projectId, category?)
- `search_context` - Search entries (projectId, query)

### Decisions

- `add_decision` - Record decision (projectId, title, description, rationale?, alternatives?)
- `update_decision` - Update decision (id, title?, description?, status?)
- `remove_decision` - Delete decision (id)
- `list_decisions` - List decisions (projectId)

### Export

- `export_context` - Export project (projectId, format: json|markdown|plain|copilot|claude|cursor)

## Resources

- `anamnesic://projects` - JSON list of all projects
- `anamnesic://projects/{projectId}/context` - Full project context as markdown

## Prompts

- `project_context` - Full project context for AI consumption
- `architecture_summary` - Architecture-specific context and decisions

## Example Conversation

After connecting, ask your AI:

> "List my Anamnesic projects"

> "Add architecture context to project X: We use a microservices architecture with gRPC communication"

> "Export project X context in copilot format"

> "What architectural decisions have been made for project X?"
