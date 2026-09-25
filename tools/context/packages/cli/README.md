# @anamnesic/cli

Command-line interface for managing Anamnesic context. Binary: `anamnesic`.

## Install

```bash
cd packages/cli
pnpm build
npm link  # makes `anamnesic` available globally
```

## Commands

### Initialize

```bash
anamnesic init                          # Init Anamnesic in current directory
anamnesic init -n "My Project"          # With custom name
anamnesic init -d "Description here"    # With description
```

Creates a `.anamnesic` marker file with the project ID.

### Projects

```bash
anamnesic project list                  # List all projects
anamnesic project create "My App"       # Create a project
anamnesic project create "My App" -d "A web app"
anamnesic project show <id>             # Show project details (accepts ID or name)
anamnesic project delete <id>           # Delete a project
```

### Context Entries

```bash
anamnesic context list <projectId>                    # List all context
anamnesic context list <projectId> -c architecture    # Filter by category
anamnesic context add <projectId> "stack" "React 18 + TypeScript"
anamnesic context add <projectId> "db" "PostgreSQL 16" -c dependencies -p 3
anamnesic context update <id> -v "React 19 + TypeScript"
anamnesic context remove <id>
anamnesic context search <projectId> "react"
```

Categories: `architecture`, `requirements`, `dependencies`, `standards`, `general`

Priority: 1 (low) to 4 (critical)

### Decisions

```bash
anamnesic decision list <projectId>
anamnesic decision add <projectId> "Use PostgreSQL" "Chose PostgreSQL for relational integrity"
anamnesic decision add <projectId> "Use PostgreSQL" "..." -r "ACID compliance needed" -a "MongoDB, DynamoDB"
anamnesic decision update <id> -s deprecated
anamnesic decision remove <id>
```

Status: `active`, `deprecated`, `superseded`

### Export

```bash
anamnesic export <projectId>                     # Export as markdown (default)
anamnesic export <projectId> -f copilot          # Export as .github/copilot-instructions.md
anamnesic export <projectId> -f claude           # Export as CLAUDE.md
anamnesic export <projectId> -f cursor           # Export as .cursorrules
anamnesic export <projectId> -f json             # Export as JSON
anamnesic export <projectId> --stdout            # Print to stdout
anamnesic export <projectId> -o custom-path.md   # Custom output path
```

### Sync

```bash
anamnesic sync <projectId>    # Export to copilot + claude + cursor configs at once
```

This writes:

- `.github/copilot-instructions.md`
- `CLAUDE.md`
- `.cursorrules`

## Data

Stored in `~/.anamnesic/data.sqlite`. Shared with MCP server and VS Code extension.
