# Athena - AI Assistant for TOTVS APIs

This codebase implements a full-stack RAG (Retrieval Augmented Generation) system that provides intelligent chat and search capabilities over TOTVS educational APIs. The system uses local LLM (Ollama) for privacy and includes MCP server integration for AI assistants.

## Architecture Overview

**Feature-Sliced Design Architecture:**
- `server/features/` - Business logic modules (rag, chat, totvs, auth, documents)
- `server/entities/` - Domain models (atendente)
- `server/shared/` - Cross-cutting concerns (config, lib)
- `client/` - React frontend with Vite

**Data Flow:**
1. Client sends queries to Express server
2. Server uses RAG engine to retrieve from TOTVS APIs + vector search
3. Local Ollama LLM generates responses
4. MCP server provides AI assistant integration

**Key Components:**
- **RAG Engine** (`server/features/rag/engine.ts`) - Combines API retrieval with LLM generation
- **Vector Store** (`server/features/documents/vector-store.ts`) - Persistent embeddings for semantic search
- **API Client** (`server/features/api-client/client.ts`) - Cached TOTVS API proxy
- **Chat Service** (`server/features/chat/service.ts`) - Streaming chat with sources
- **MCP Server** (`server/features/mcp/server.ts`) - AI assistant tools

## Development Workflows

**Local Development:**
```bash
# Start both frontend and backend concurrently
pnpm dev

# Or separately:
cd server && pnpm dev    # Backend with hot reload
cd client && pnpm dev    # Frontend dev server
```

**Building:**
```bash
# Build both client and server
pnpm build

# Production start (serves built client)
pnpm start
```

**MCP Server:**
```bash
# Run MCP server for AI integration
pnpm mcp
```

**Environment Setup:**
- Copy `.env` to `server/.env` with TOTVS credentials
- Start Ollama: `ollama serve && ollama pull gemma3:1b`
- Configure Claude Desktop with MCP server path

## Project Conventions

**Package Management:**
- Use `pnpm` exclusively (not npm/yarn)
- Scripts in root `package.json` handle both client/server

**TypeScript:**
- Strict mode enabled
- Import paths use `.js` extensions (ES modules)
- Layer comments: `/** @layer features/rag */`

**API Patterns:**
- REST endpoints under `/api/` prefix
- TOTVS proxy under `/api/totvs/`
- Streaming responses use Server-Sent Events
- Rate limiting and CORS configured

**Error Handling:**
- API results include `success: boolean` and `error` fields
- Cache fallback when APIs are offline
- Graceful degradation with cached data

**Caching Strategy:**
- API responses cached for 1 hour (`server/shared/lib/data-cache.ts`)
- Vector store persists to disk (`chroma_db/`)
- Cache refresh via `forcar_atualizacao` tool

## Common Patterns

**Adding New TOTVS API:**
1. Create client in `server/features/totvs/api/`
2. Add to `TOTVSClient` in `server/features/api-client/client.ts`
3. Update search logic in `searchAll()` method
4. Add route in `server/features/totvs/routes.ts`

**Extending RAG:**
- Add data sources to `retrieve()` in `RAGEngine`
- Format context in `formatContext()` method
- Update prompts in `server/features/rag/prompt.ts`

**Chart Generation:**
- Use `chartjs-node-canvas` for server-side rendering
- Charts saved as base64 for embedding in responses
- Dashboard data from `server/features/rag/kpi-processor.ts`

**MCP Tools:**
- Tools defined in `ListToolsRequestSchema` handler
- Use RAG for efficient queries vs direct API calls
- Chart tools generate images inline in chat

## Key Files Reference

- `server/main.ts` - Application entry point
- `server/app/create-app.ts` - Express setup with security
- `server/features/rag/engine.ts` - Core RAG pipeline
- `server/features/chat/service.ts` - Chat processing logic
- `server/features/mcp/server.ts` - MCP tool definitions
- `client/src/App.tsx` - Main React component
- `package.json` - Build and dev scripts

## Debugging Tips

- Check API connectivity: `GET /api/status`
- View cached data: `GET /api/stats`
- Force re-index: Use `forcar_atualizacao` MCP tool
- Monitor logs: Server outputs to stderr, MCP to stdout
- Ollama issues: Verify `ollama list` shows models

## Integration Points

- **TOTVS APIs**: External SOAP/REST endpoints (configured in env)
- **Ollama**: Local LLM for generation (port 11434)
- **MCP**: Stdio protocol for AI assistants
- **Vector DB**: Chroma-like persistence for embeddings
- **Chart.js**: Server-side chart rendering

Follow Feature-Sliced Design: keep features independent, use shared libs for common code, avoid tight coupling between business modules.
