# Changelog

Histórico de mudanças notáveis do `@chronokairo/ai`.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### 2026-09-27

#### Alterado
- **Núcleo Rust `ckc` extraído para o repo próprio `chronokairo/cli` (ADR-0027):**
  - `src-tauri/core/` (263 arquivos, crate `ckc`) foi extraído para [`chronokairo/cli`](https://gitlab.com/chronokairo/cli), onde vive como raiz do projeto Rust. O histórico dos 144 commits do antigo `chronokairo/cli` foi preservado como base.
  - A casca Tauri (`src-tauri/shell`) passou a consumir o núcleo por `git` + `tag = "v0.1.0"`: `ckc = { git = "https://gitlab.com/chronokairo/cli.git", tag = "v0.1.0" }`. O workspace `src-tauri` ficou com os membros `shell` e `intelligence`.
  - O binário foi renomeado de `ckc` para **`ck`**; o package/lib continuam `ckc` para não quebrar a git dependency. Uso/help, user-agent HTTP e `serverInfo` do MCP server passaram a usar `ck`.
  - O `ckc` deixa de ser só o coding agent do desktop e passa a ser a interface de linha de comando dos produtos Chronokairo.
  - **Impacto:** builds do desktop passam a exigir rede na primeira resolução da git dependency; toda evolução do agente, tools, runtime de LLM e testes `p0_*` passa a acontecer no repo `chronokairo/cli`, não neste.

#### Removido
- **`src-tauri/core/`** — movido para `chronokairo/cli` (sem perda de código; validado com `cargo metadata` e `cargo check -p ckc`).

### 2026-09-26

#### Adicionado
- **Menus Dropdown Estilo `microsoft/edit` e UX Interativa (ADR-0023):**
  - Appbar interativo com menus dropdown suspensos (`[File]`, `[Edit]`, `[AI Agent]`, `[Help]`) acionáveis por clique de mouse ou atalhos (`Ctrl+N`, `Ctrl+O`, `Ctrl+S`, `Ctrl+P`, `Alt+M`).
  - Renderização flutuante via `Paragraph` e bordas ciano com destaque para item selecionado e atalhos alinhados.
  - Sincronização automática do buffer do editor ao receber `AgentEvent::FileChanged`, refletindo edições do modelo instantaneamente.
  - Auto-abertura do primeiro arquivo relevante da pasta aberta ao iniciar a sessão.
- **Consciência de Workspace e Execução de Ferramentas no Agente (ADR-0023):**
  - Injeção das seções `### Current Workspace Directory` e `### Workspace Files` no `load_project_context`, permitindo que o modelo enxergue todos os arquivos do projeto aberto (Python, Rust, JavaScript, Markdown, etc.).
  - Injeção contextual do arquivo atualmente aberto no editor com conteúdo e cursor durante o envio de prompts ao agente.
  - Correção na permissão e classificação de ferramentas no loop autônomo (`symbol_search` em leitura, `list_skills`/`load_skill` em execução).
  - Formatação aprimorada de eventos no chat para padrão visual `[Tool: Read <file>]`, `[Tool: Apply Diff <file>]` e `[Run Tests] -> ✓/✗ <summary>`.
- **Detecção Robusta de GPU de Hardware via SMI (ADR-0023):**
  - Implementado leitor e parser estruturado de `nvidia-smi` e `nvidia-smi.exe` com `--query-gpu=gpu_name,memory.total`, sanando o bug de exibição de `GPU: Unknown` no WSL2 e ambientes virtualizados Linux.
- **Layout Completo de IDE "VS Code + Copilot" (ADR-0027):** Interface completa em 3 zonas ativada imediatamente ao iniciar `ckc`:
  - **Top AppBar / MenuBar:** `[File] [Edit] [AI Agent] [Help]` à esquerda e telemetria `Branch: <branch> | GPU: <gpu>` à direita (com detecção automática de GPU de hardware).
  - **Sidebar Esquerda (Explorer):** Painel de arquivos do workspace (`app.sidebar_items`) com cursor de seleção (`› `), ícones (`📁 `/`📄 `) e abertura direta de arquivos ao pressionar `Enter`.
  - **Painel Central/Direito (Editor & Copilot Agent):** Editor de código integrado com números de linha, realce de sintaxe multilinguagem (`syntax.rs`), e chat do Copilot Agent com histórico formatado e telemetria de geração (`tok/s`).
  - **Inline Ghost Text (Sugestões de IA):** Sugestões de código inline exibidas diretamente no editor (`·[GHOST]`), com inserção rápida ao pressionar `Tab` e descarte com `Esc`.
  - **Barra de Status VS Code / `microsoft/edit`:** `Ln <row>, Col <col> | UTF-8 | <Language> | Model: <model> (Local/Cloud) | Context: <used>k/<max>k` adaptável dinamicamente à largura do terminal.
  - **Interação Completa por Mouse (Estilo `microsoft/edit`):** Suporte nativo a cliques para focar painéis e abrir arquivos na Sidebar, clique no Editor para posicionar o cursor, clique no Chat para alternar foco/expandir ferramentas, e scroll wheel para rolar suavemente a Sidebar, o Editor ou o Chat.
  - **Refatoração Modular sem Duplicação:** Pipeline de renderização em `src/ui/mod.rs` deduplicado em funções puras (`render_appbar`, `render_statusbar`, `render_sidebar`, `render_editor`, `render_chat_panel`).
  - **Ciclo de Foco (`Ctrl+E` / `Ctrl+B`):** Alternância fluida de foco entre Composer Prompt, Sidebar de Arquivos e Editor de Código. Digitação na sidebar redireciona automaticamente para o prompt.
- **Suíte de Testes Automatizados TUI (510 testes aprovados):** Testes unitários para renderização de AppBar, StatusBar com linguagem e contexto de tokens, aceitação/descarte de Ghost Text, decodificador de mouse SGR 1006 e X10, e drenagem de sequências CSI sem vazamento de caracteres.
- **Validação dos P0s de Fundação de Mercado com Testes de Integração (ADR-0024):** 31 testes em `src-tauri/core/tests/p0_{agent,tools,llm,context,server,worktree}.rs` exercitando a API pública do `ckc` — um por capability: loop com tool calling via ToolRegistry, subagentes, matriz de approvals/interrupt, sessões persistentes com retomada, fs/find-replace/shell/exec_policy/sandbox/patch+rollback/git/picker, streaming contra LLM ollama em loopback (TCP local, zero rede externa), multi-providers (router/catálogo/store/fallback chain com circuit breaker), compressor em camadas, `AGENTS.md` como context pack, memória de curto/longo prazo, skills, cliente MCP (servidor fake embutido no binário), protocolo versionado `Op`/`EventMsg` com event log JSONL reproduzível, `runtime_api` (dry-run de patch e busca de arquivos) e o turno end-to-end `Op::UserTurn`→`Done` via `protocol::Session`.
- **Worktree por Task e Checkpoints Duráveis no `ckc` (P0 de mercado, ADR-0024):** `tools/worktree.rs` — `WorktreeManager` com worktree dedicado por task (`.chronokairo-worktrees/<id>`, branch `ck/task/<id>`), metadados fora do tracking via `.git/info/exclude`; `agent/checkpoint.rs` — `CheckpointStore` com snapshot git + manifest atômico `.chronokairo/checkpoints.json` (correlação sessão/turno/event-seq) que sobrevive a `git reset --hard` e restaura estado pós-crash; tools `worktree`/`checkpoint` no ToolRegistry e 6 métodos novos no `runtime_api` (`create/list/remove_task_worktree`, `create/restore/list_checkpoints`) consumíveis pelo desktop via `runtime_request`.
- **Tela Canônica de Task Supervision (gap D06/D07, P0 de mercado):** `src/modules/ai/components/TaskSupervisionScreen.tsx` sob a nav `tasks` — status derivado da task (`aguardando/executando/atenção/falhou/concluída`), timeline de eventos, árvore de subagentes (fan-out `[task i/N]`), approvals inline (permitir/permitir na sessão/negar), checks de verificação, arquivos alterados, tokens agregados, diff/patch embutido e worktrees/checkpoints por task; cliente estendido em `src/modules/dev/harness/agent.ts`.
- **Distribuição e Auto-Update do Desktop (P0 de mercado):** `plugins.updater` no `tauri.conf.json` com keypair real de assinatura (privada fora do repo, `~/.chronokairo/keys/`), `createUpdaterArtifacts`, targets nsis+appimage+deb; plugins `tauri-plugin-updater`/`tauri-plugin-process` na casca com comandos `check_for_updates`/`install_update` e permissão `updater:default`.
- **Roadmap de Paridade com o Mercado (ADR-0024):** corpus de 23 changelogs persistido em `docs/market/changelogs/`; digests mai–set/2026 por área e backlog de 36 itens P1–P3 em `docs/market/TODO.md` cruzado com desktop-gap D01–D22 e adr/0015; mapas de código do `ckc` e do dev harness em `docs/maps/` (agent/tools/repo, LLM/providers/MCP/memória/protocolo/app-server, frontend/casca Tauri); backlog P1 de 15 itens adicionado ao `TODO.md` raiz e registrado como débito de implementação com testes + validação live NVIDIA NIM (ADR-0026).
- **Modo Edit (Aider-Like) para LLMs Pequenos no `ckc` (ADR-0025):** registrado como débito — modo edit/autocomplete restrito ao arquivo aberto no editor (active file binding do ADR-0023), sem loop de agent, formato de edição por capacidade do modelo e backend para as bridges de IDE (ADR-0015).

#### Corrigido
- **Vazamento de Códigos de Mouse no Campo de Chat (SGR Mouse & CSI Escape Leak):** Implementado decodificador nativo de sequências SGR (`\x1b[<btn;col;rowM`/`m`) e X10 (`\x1b[M...`) no `InputDecoder`, e drenagem integral de sequências de escape CSI incompletas ou não mapeadas; corrigido o bug em que mexer ou clicar com o mouse inseria números e caracteres (`<0;35;12M`) no prompt do chat.
- **Digitação e Bug de Caractere Único no Terminal (Input & Raw Mode):** Implementação real de modo raw no Linux/Unix via `termios` (`libc::tcgetattr` / `libc::tcsetattr`), desativando o modo canônico (`ICANON`) e o eco local (`ECHO`) do driver do kernel tty; leitura imediata de teclas sem necessidade de bufferização por linha.
- **Detecção de Dimensões Reais do Terminal:** Substituição do fallback estático de `(120, 30)` pela consulta dinâmica via `libc::ioctl(1, libc::TIOCGWINSZ, ...)`, eliminando quebras de layout, truncamentos e artefatos de cursor em terminais de qualquer tamanho no WSL e Linux.
- **Decodificador de Entrada ANSI & UTF-8 (`event.rs`):** Suporte nativo a sequências de escape CSI/SS3 (setas, Home, End, PageUp, PageDown, Delete, Shift+Tab, F1-F4) e recomposição de caracteres acentuados UTF-8 de múltiplos bytes sem corrupção Latin-1.
- **Campo de Texto do Chat (Composer):** Correção do cálculo de posicionamento do cursor considerando `display_width` Unicode e quebras de linha visuais (soft-wrap); adição de suporte à tecla `Delete` e quebra de linha com `Shift+Enter`.
- **Congelamento na Inicialização da TUI:** Indexação de arquivos do workspace (`file_search::walk_files`) convertida para execução assíncrona em background; filtro para ignorar diretórios ocultos (`.cache`, `.local`, etc.) e limite de segurança de 5.000 arquivos.
- **Resiliência do Roteador de Modelos (ckc):** Fallback automático e transparente para a API HTTP do Ollama (`http://localhost:11434`) na ausência de arquivos GGUF manuais em disco; comandos de diagnóstico (`check`, `models`, `ps`) desacoplados da carga de modelos.
- Migração da UI do chat RAG (`/rag`) para o design system Chronokairo (ADR-0005, débito #3 parcial): `RagApp` consome `ThemeProvider`, `ThemeToggle` e `Button` de `@chronokairo/platform/ui`; tema claro/escuro alternável no header (persistido em `localStorage`).
- Sistema de tokens themáveis em `src/app/globals.css`: `@theme` Tailwind v4 apontando para CSS vars com paletas `.dark` (padrão, valores inalterados) e `.light`; `RagApp.css` reescrito com as mesmas vars (prose, scrollbar, focus, typing cursor) e sem diretivas `@tailwind` v3 vestigiais.
- Migração do backend RAG para Next API routes (ADR-0005, débito #2): 47 rotas em `src/app/api/*` (chat, search, conversas, mensagens, TOTVS, auth, admin, health, proxy catch-all) com adaptadores `_lib` (rag, http, rate-limit, auth, sse, totvs-proxy); clients SOAP/REST migrados de `shared/lib/http` (Express) para `http-core`; `resolve.extensionAlias` no webpack para imports ESM `.js`→`.ts` do legado.
- Migração hexagonal Fase 0/1 sem deleção de código (ADR-0022): `src/domain`, `src/application` (portas e caso de uso `send-message`), `src/infrastructure` (adapters), composição em `src/features/ai-chat` e rota `/api/ai/chat` reescrita como adapter HTTP fino; suíte de testes com Vitest (11 testes).
- Absorção e centralização das capacidades de IA satélites de projects, crm, bi, marketing, legal, nimbus, security, mastery, educacional e ecommerce (ADR-0021).

#### Corrigido
- Build do client quebrado pelo barrel `@/modules/governance` puxando `fs`/`fs-promises` (services server-only) para o client bundle via `SecurityPanel`; o painel agora importa `validateCommand` direto de `command-validator`.
- 67 erros de typecheck do legado thinkcoffee em `src/modules`:
  - imports dos 16 views do dashboard de governança apontados para `./types`;
  - imports do function-calling apontados para `../../harness/contracts` e `../../harness/shared`;
  - tipos ausentes criados em `dashboard/types.ts` (`Channel`, `DevicePairing`, `ChatMessage`, `ToolCall`, `CronJob`, `LogEntry`, `DreamEntry`) e estendidos (`Session`, `Agent`, `ToolDefinition`);
  - `governance/data/mockData.ts` criado para o ConfigView;
  - `default` adicionado ao `getRiskBadge` do ToolsView (erros de `possibly undefined`);
  - dependências de markdown instaladas (`remark-math`, `remark-gfm`, `rehype-katex`, `rehype-raw`).

#### Alterado
- `RagApp.tsx`: ~80 classes de cor hardcoded (`gray`, `indigo`, `amber`) substituídas por tokens semânticos (`surface-container`, `on-surface-variant`, `outline`, `primary`, `secondary`); branding Athena → Chronokairo AI (header, welcome, export PDF, IDs de chat); cores de status semânticas (verde/vermelho/azul etc.) preservadas; export PDF e gráficos Chart.js leem cores via `cssVar()` para acompanhar o tema.
- `.npmrc` com `allow-git=root` — npm >= 12 bloqueia dependências git por padrão (EALLOWGIT).

### 2026-09-25

#### Adicionado
- Absorção dos módulos de IA do Research: `nvidia-llm-ranking` e `research-rag` (ADR-0013).
- Absorção do Clamp — scaffolding de tool calling e confiabilidade para SLMs (ADR-0014).
- Absorção do Anamnesic Bridges — bridges de IDE (VS Code/Antigravity) e `llm-server` (ADR-0015).
- Absorção do AegisOS/Anamnesic Sandbox — execução segura em containers (ADR-0016).
- Absorção do Anamnesic Context — memória de agentes, context engine e MCP server (ADR-0017).
- Absorção do Agent Control Center/Dashboard — visões operacionais de governança e runtime (ADR-0018).
- Absorção do CKI-Lite — terminal agent NVIDIA NIM (Python) e client WinForms (ADR-0019).
- Consolidação do Kairos-Dev — coding agent, prompts de sistema e ferramentas ripgrep (ADR-0011).
- Absorção dos módulos Sala e Core — capacidades de IA, multiagente, catálogo MCP e agent planner (ADR-0010).
- Absorção do ToolSectorHarness e motor de agentes Kairos (ADR-0009).
- OCR: absorção de modelo OCR e LLM proxy servers do operations.

#### Removido
- `por.traineddata` vestigial em `src/modules/ocr` (ADR-0020).

### 2026-09-24

#### Adicionado
- Absorção do harness de OSINT, due diligence, busca web em Rust e bancada de investigação (ADR-0008).
- Absorção de SafetyNet, guardrails, dry-run, snapshots e roteamento de custos do ThinkCoffee (ADR-0007).
- Rapunzel — chat de criação de conteúdo via ChatPanel compartilhado (ADR-0006).
- Formalização da absorção do ThinkCoffee e da consolidação cli/desktop (docs).

### 2026-09-23

#### Adicionado
- Rotas `ia/*` (`src/app/(ia)/ia`) consumindo data-screens local — a IA sai do app data (ADR-0002/0003).
- MCP de vendas e telas do agent Kairos como referência de port (`legacy-kairos-screens`).
- ADR-0005 — registro dos débitos técnicos pós-centralização.

#### Alterado
- Pacote renomeado de `chronokairo-desktop` para `@chronokairo/ai` (ADR-0004).

### Consolidação inicial

#### Adicionado
- ADR-0001 — unificação do monorepo `ai`: núcleo Rust zero-lib (`ckc`), casca Tauri e frontend Next; histórico dos repositórios originais preservado nas branches `cli` e `desktop`.
