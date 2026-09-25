# @anamnesic/core

Shared library with entities, services, database, validation, and export logic. Used by all other packages.

## Entities

- **Project** - A software project with name, description, status, metadata
- **ContextEntry** - Key-value context with category (architecture, requirements, dependencies, standards, general) and priority (1-4)
- **Decision** - Architectural decision record with title, description, rationale, alternatives, status
- **ApiKey** - API key for external integrations (hashed with SHA-256)

## Services

```typescript
import {
  getDatabase,
  ProjectService,
  ContextService,
  DecisionService,
  ApiKeyService,
} from "@anamnesic/core";

const db = await getDatabase();
const projects = new ProjectService(db);
const contexts = new ContextService(db);
const decisions = new DecisionService(db);
const apiKeys = new ApiKeyService(db);

// CRUD operations
const project = await projects.create({ name: "My App" });
await contexts.create({
  projectId: project.id,
  key: "stack",
  value: "React + Node",
  category: "architecture",
});
await decisions.create({
  projectId: project.id,
  title: "Use TypeORM",
  description: "Chose TypeORM for SQLite support",
});

// Search
const results = await contexts.search(project.id, "react");

// Export
import { exportProject } from "@anamnesic/core";
const markdown = exportProject(project, "copilot"); // -> .github/copilot-instructions.md content
```

## Database

SQLite stored at `~/.anamnesic/data.sqlite` by default. Configurable:

```typescript
const db = await getDatabase({
  dbPath: "/custom/path/data.sqlite",
  logging: true,
});
```

## Export Formats

`json` | `markdown` | `plain` | `copilot` | `claude` | `cursor`

## Validation

Zod schemas for all inputs: `createProjectSchema`, `createContextEntrySchema`, `createDecisionSchema`, etc.
