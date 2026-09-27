# ADR Log — `chronokairo/ai`

Decisões arquiteturais do produto de IA (RAG, MCP, integrações, chat, desktop Tauri).

| ADR | Título | Data | Status |
| :--- | :--- | :---: | :---: |
| [ADR-0001](./adr/0001-unificacao-monorepo-ai.md) | Unificação do monorepo `ai` | — | Aceito |
| [ADR-0002](./adr/0002-centralizacao-ia-no-ai.md) | Centralização da IA do ecossistema no `ai` (recebe FroiaChat/proxy do froia; remove LLM providers p/ readição desacoplada) | 2026-09-23 | Aceito |
| [ADR-0003](./adr/0003-centralizacao-telas-ia-data.md) | Centralização das telas de IA do app data no `ai` (subpath `./data-screens`) | 2026-09-23 | Aceito |
| [ADR-0004](./adr/0004-rename-package-chronokairo-ai.md) | Renomear pacote `chronokairo-desktop` → `@chronokairo/ai` (escopo npm consistente com ecossistema) | 2026-09-23 | Aceito |
| [ADR-0005](./adr/0005-debitos-tecnicos-pos-centralizacao.md) | Registro dos débitos técnicos pós-centralização (providers, RAG, UI, wiring) | 2026-09-23 | Aceito (débitos abertos) |
| [ADR-0006](./adr/0006-rapunzel-chat-conteudo.md) | Rapunzel: variante de chat de criação de conteúdo (subpath `./rapunzel`) com `ChatPanel` compartilhado com o Froia | 2026-09-24 | Aceito |
| [ADR-0007](./adr/0007-absorcao-governanca-thinkcoffee.md) | Absorção dos ativos de governança e segurança do ThinkCoffee (`@chronokairo/ai/governance`) | 2026-09-24 | Aceito |
| [ADR-0008](./adr/0008-absorcao-osint-intelligence-harness.md) | Absorção do OSINT Intelligence Harness e ferramentas de investigação | 2026-09-24 | Aceito |
| [ADR-0009](./adr/0009-absorcao-tool-calling-kairos-harness.md) | Absorção de tool calling e harness do Kairos | 2026-09-25 | Aceito |
| [ADR-0010](./adr/0010-absorcao-sala-e-core-capacidades-ia.md) | Absorção da Sala e core de capacidades de IA | 2026-09-25 | Aceito |
| [ADR-0011](./adr/0011-consolidacao-kairos-dev-coding-agent.md) | Consolidação do coding agent nativo e runtime do Kairos | 2026-09-25 | Aceito |
| [ADR-0012](./adr/0012-absorcao-athena-rag-unificado.md) | Absorção do Athena (RAG Unificado e Ecossistema Legado) | 2026-09-25 | Aceito |
| [ADR-0013](./adr/0013-absorcao-rag-mcp-e-ranking-research.md) | Absorção dos Módulos de IA do Research (RAG/MCP e NVIDIA LLM Ranking) | 2026-09-25 | Aceito |
| [ADR-0014](./adr/0014-absorcao-clamp-tool-calling-slm.md) | Absorção do Clamp (Scaffolding de Tool Calling e Confiabilidade para SLMs) | 2026-09-25 | Aceito |
| [ADR-0015](./adr/0015-absorcao-anamnesic-bridges-ide.md) | Absorção do Anamnesic Bridges (Bridges de IDE: VS Code e Antigravity para Ollama API) | 2026-09-25 | Aceito |
| [ADR-0016](./adr/0016-absorcao-sandbox-aegisos.md) | Absorção do AegisOS / Anamnesic Sandbox (Execução Segura em Containers) | 2026-09-25 | Aceito |
| [ADR-0017](./adr/0017-absorcao-anamnesic-context-memory-mcp.md) | Absorção do Anamnesic Context (Memória de Agentes, Context Engine e MCP Server) | 2026-09-25 | Aceito |
| [ADR-0018](./adr/0018-absorcao-agent-dashboard-governance.md) | Absorção do Agent Control Center / Dashboard (Governância & Runtime) | 2026-09-25 | Aceito |
| [ADR-0019](./adr/0019-absorcao-cki-lite-terminal-agent-e-winforms.md) | Absorção do CKI-Lite (Terminal Agent NVIDIA NIM Python & Client WinForms) | 2026-09-25 | Aceito |
| [ADR-0020](./adr/0020-remocao-por-traineddata-vestigial.md) | Remoção do `por.traineddata` vestigial e saneamento do módulo OCR | 2026-09-25 | Aceito |
| [ADR-0021](./adr/0021-absorcao-ia-projetos-crm-e-satelites.md) | Absorção e Centralização das Capacidades de IA Satélites no `ai` | 2026-09-26 | Aceito |
| [ADR-0022](./adr/0022-migracao-hexagonal-sem-delecao.md) | Migração para arquitetura hexagonal sem deleção de código (strangler fig aditivo) | 2026-09-26 | Aceito |
| [ADR-0023](./adr/0023-tui-edit-ux-gpu-detection-e-workspace-context.md) | Paridade de UX/UI com microsoft/edit, detecção de GPU via SMI e contexto de workspace no agente | 2026-09-26 | Aceito |
| [ADR-0024](./adr/0024-roadmap-p0-mercado-validacao-e-implementacao.md) | Roadmap de paridade com o mercado: P0s validados com testes de integração e os 3 P0s restantes implementados | 2026-09-26 | Aceito (débitos abertos) |
| [ADR-0025](./adr/0025-ckc-modo-edit-aider-para-llms-pequenos.md) | Modo edit (aider-like) no `ckc` CLI para LLMs pequenos: editar/autocompletar apenas o arquivo aberto, em vez de agent | 2026-09-26 | Aceito (débito aberto) |
| [ADR-0026](./adr/0026-debito-implementacao-p1s-mercado.md) | Débito: implementação dos 15 P1s de mercado com testes e validação via NVIDIA NIM | 2026-09-26 | Proposto (débito) |
| [ADR-0027](./adr/0027-extracao-core-ckc-para-repo-cli.md) | Extração do núcleo `ckc` para o repo próprio `chronokairo/cli` (binário `ck`, consumo por git tag) | 2026-09-27 | Aceito |

## Débitos técnicos abertos
- **`mcp/` e telas legadas kairos** (2026-09-23): recebidos de vendas/crm; integrar como capacidade MCP e portar o design de chat das telas (`src/modules/ai/legacy-kairos-screens` → REPL/Doctor/ResumeConversation) sem reintroduzir código do fork Claude Code.
- **Readicionar LLM providers desacoplados** (ADR-0002/0005): 17 providers removidos por dependerem de `kairos/plugin-sdk` (não publicado). Padrão de desacoplamento validado no piloto `groq` (shim `_sdk/`). Providers pesados (google, github-copilot, ollama, deepinfra) exigem reimplementar runtime de image/video/speech/oauth/embeddings.
- **Backend RAG Express → Next API routes** (ADR-0005): `src/server/rag` segue excluído do typecheck; portar para `src/app/api/`.
- **UI shell/navegação para `@chronokairo/platform/ui`** (ADR-0005): AppBar, navegação e tokens ainda locais; não duplicar componentes compartilhados.
- **Wiring dos comandos Tauri ao núcleo `ckc`** (ADR-0005): casca `src-tauri/shell` deve chamar comandos do crate `ckc` (zero-lib) incrementalmente.
- **Rotas de IA vindas do platform** (ADR-0005): `src/app/api/ai/*` e `ai-credentials` recém-recebidos aguardam cobertura de testes de integração e validação de CORS/auth nos caminhos públicos.
- **Roadmap de features a partir dos changelogs do mercado** (2026-09-26): corpus, digests, suíte de validação dos P0s e os 3 P0s restantes registrados em [ADR-0024](./adr/0024-roadmap-p0-mercado-validacao-e-implementacao.md). Abertos: cargo check da casca no Linux (libdbus-1-dev), build estático Tauri × API routes, endpoint de releases do updater e histórico completo de changelogs (cursor/codex web/só-web).
- **Modo edit (aider-like) no `ckc` CLI para LLMs pequenos** (2026-09-26): sem loop de agent — editar/autocompletar apenas o arquivo aberto no editor (active file binding do ADR-0023), formato por capacidade do modelo, escopo mínimo de permissões e backend p/ bridges de IDE. Detalhe em [ADR-0025](./adr/0025-ckc-modo-edit-aider-para-llms-pequenos.md).
- **Implementação dos 15 P1s de mercado com testes e validação via NVIDIA NIM** (2026-09-26): A1–A5, B1–B2, C1–C2, D1–D2, E1–E3; cada item = código + testes determinísticos (padrão `p0_*`) + live NIM para os LLM-dependentes. Ordem sugerida e regra de fechamento (marcar TODO → mover p/ CHANGELOG) em [ADR-0026](./adr/0026-debito-implementacao-p1s-mercado.md).
- **Núcleo `ckc` extraído para `chronokairo/cli`** (2026-09-27): o crate zero-lib e o binário `ck` saíram de `src-tauri/core` para o repo próprio `https://gitlab.com/chronokairo/cli`; `src-tauri/shell` consome por `git` + `tag = "v0.1.0"`. Impactos a acompanhar: (a) toda evolução de `ckc` (incluindo os P1s do ADR-0026 e o modo edit do ADR-0025) acontece no repo `chronokairo/cli`, não aqui; (b) builds do desktop exigem rede na primeira resolução da git dependency; (c) o D04 do `docs/desktop-gap-analysis-2026.md` segue aberto — a casca ainda linka a crate em vez de consumir o `ck app-server`. Detalhe em [ADR-0027](./adr/0027-extracao-core-ckc-para-repo-cli.md).
