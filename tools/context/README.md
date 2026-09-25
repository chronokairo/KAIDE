<p align="center">
  <img src="logo.svg" alt="Anamnesic logo" width="160"/>
</p>

# Anamnesic

Sincronize conhecimento do projeto com suas ferramentas de IA.

### O Problema

Cada ferramenta de IA (Claude Code, Cursor, Copilot, Windsurf) usa um arquivo de configuração diferente — `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` — mas todos consomem a **mesma informação**: regras do projeto, decisões arquiteturais, contexto de código, convenções.

Manter esses arquivos manualmente é repetitivo e eles ficam desatualizados.

### A Solução

Anamnesic unifica a gestão de contexto e exporta automaticamente para os formatos que suas ferramentas entendem:

```
                   ┌────────────────┐
  ┌───────────┐    │                │────→ .cursorrules
  │ Contexto  │    │   Anamnesic    │────→ CLAUDE.md
  │ (SQLite)  │───→│   (export)     │────→ copilot-instructions.md
  │ Decisões  │    │                │────→ AGENTS.md
  │ Projetos  │    │                │────→ custom (json, markdown, plain)
  └───────────┘    └────────────────┘
```

### Componentes

| Pacote | Descrição | Bin |
|---|---|---|
| `@anamnesic/core` | Lógica de negócio (entidades, serviços, export, validação, pipeline, file tools) | — |
| `@anamnesic/mcp-server` | Servidor MCP stdio com 41 tools (context CRUD, file ops, chat, sync, export, pipeline) | `anamnesic-mcp` |
| `@anamnesic/cli` | CLI para gerenciar projetos, contexto, decisões e export | `think` |

### Comandos CLI

```
think init                          # Inicializa o Anamnesic no diretório
think project list                  # Lista projetos
think project create <nome>         # Cria um projeto
think context add <projeto> <cv>    # Adiciona contexto chave/valor
think context search <projeto> <q>  # Busca no contexto
think decision add <projeto> <cv>   # Registra uma decisão
think export <projeto>              # Exporta para todos os formatos
think export <projeto> --format claude|cursor|copilot|json|markdown|plain
```

### MCP Server

Conecte qualquer cliente MCP (Claude Desktop, Cursor, VS Code via extensão MCP) ao servidor stdio:

```json
{
  "mcpServers": {
    "anamnesic": {
      "command": "node",
      "args": ["packages/mcp-server/dist/index.js"]
    }
  }
}
```

Tools disponíveis: CRUD de projetos/contexto/decisões, file operations (read/write/edit/list/search), sync de arquivos de contexto, export, pipeline multi-agente, chat.

### Export (o core do valor)

Exporta contexto e decisões do projeto para arquivos que as ferramentas de IA leem nativamente:

| Formato | Arquivo | Ferramenta |
|---|---|---|
| `cursor` | `.cursorrules` | Cursor |
| `claude` | `CLAUDE.md` | Claude Code / Claude Desktop |
| `copilot` | `.github/copilot-instructions.md` | GitHub Copilot |
| `json` | `anamnesic-export.json` | Genérico |
| `markdown` | `anamnesic-export.md` | Leitura humana |
| `plain` | `anamnesic-export.txt` | Genérico |

### Stack

- **Linguagem:** TypeScript (monorepo PNPM)
- **Banco:** SQLite via TypeORM (17 entidades: Project, ContextEntry, Decision, User, Workspace, Agent, Task, Workflow, ChatHistory, ApiKey, SecurityAnalysis, ExecutionLog, OrchestratorPlan, OrchestratorRun, PolicyDecisionAudit, SyncConfig, WorkspaceMember)
- **MCP:** `@modelcontextprotocol/sdk` (protocolo padrão Anthropic)
- **Validação:** Zod
- **Pipeline:** State machine para orquestração multi-fase (11 papéis de agente)
- **File tools:** Sandboxing de path, snapshot/dry-run, ação com log

## Começando

```bash
# Pré-requisito: PNPM
npm install -g pnpm

# Instalar dependências
pnpm install

# Build de todos os pacotes
pnpm build

# Rodar testes
pnpm test
pnpm test:unit
```

---

## Licença

MIT &copy; 2026 Anamnesic Team
