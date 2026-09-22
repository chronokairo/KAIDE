# Implementação da TUI (baseada em OpenCode 2.0)

Este documento reúne o mapeamento das funcionalidades do OpenCode que precisamos considerar, o subconjunto recomendado para implementação inicial, um roadmap em sprints e próximos passos práticos para começar a implementar no repositório.

---

## 1. Mapeamento — funcionalidades principais do OpenCode (2.0)

- Agents: trocar entre agentes (`build`, `plan`), subagents, permissões (edição/execução).
- Sessions: lista/gerenciamento de sessões, salvar/carregar sessão, histórico de conversas.
- Editor: editor integrado com edição, salvar, múltiplos buffers, undo/redo, syntax highlighting (LSP-backed).
- File explorer / Sidebar: árvore/lista de arquivos do workspace, abrir/preview, criação/remoção/renomear.
- Command Palette: comando rápido (fuzzy) para ações (open, run, search, git, switch agent).
- Chat / Assistant pane: painel de mensagens/chat com LLM, streaming, markdown render, message actions (explain, apply patch).
- Run / Task runner: executar comandos, mostrar saída, interromper processos, status/progress.
- Model selector / Runtime: escolher modelo (local/remote), mostrar uso e loading status.
- Git integration: status, diff, stage/commit, branches, undo/unstage, quick blame.
- Search & Navigation: fuzzy search, goto definition, project-wide text search.
- LSP & diagnostics: diagnostics panel, jump to error, code actions.
- Plugins / Extensions: slots para extras, prompt traits, provider plugins.
- Settings & Profiles: multi-account, config panels, persistent prefs.
- UI niceties: keybindings, tabs/panes, focus management, mouse support, themes, accessibility.
- Telemetry / Logs: activity logs, action history, undo stack, runtime diagnostics.

## 2. Subconjunto recomendado (priorizado)

1. Core Chat + Agent run (High)
   - Painel de chat integrado com `llm::client`.
   - Comando/painel para executar `agent::r#loop` a partir da UI.
2. Sidebar — File explorer + preview (High)
   - Lista de arquivos do workspace, navegar com teclado, abrir preview (já iniciado em `src/ui.rs`).
3. Editor básico (Medium)
   - Abrir arquivo em buffer, editar, salvar via `FileTools::read_file`/`write_file`.
4. Sessions list (Medium)
   - Mostrar e restaurar `AgentState.session` (short-term memory).
5. Agent Switch / Model Selector (Medium)
   - Alternar modos/agents e selecionar entre clientes `local`/`ollama`.
6. Command Palette (Low→Medium)
   - Lançador fuzzy para ações (posterior).
7. Git basics (Low)
   - Status, quick commit via `tools::git::GitTools`.
8. Run/Stop & Logs (Low)
   - Executar shell comandos e mostrar saída/estado.

## 3. Roadmap curto (sprints)

- Sprint A (1–2 dias): chat estável + sidebar preview + abrir em editor (read-only) e salvar.
- Sprint B (3–7 dias): editor básico (edição + salvar), sessions list, agent switch/model selector.
- Sprint C (1–2 semanas): command palette, git integration, run/stop, logs.
- Stretch: LSP, plugins, streaming de respostas e maior paridade com OpenCode.

## 4. Arquitetura UI (resumo técnico)

- UI central (`src/ui.rs`): gerencia estado local `App` (mensagens, input, sidebar, editor buffers, foco).
- Integração com `AgentState` para acesso a arquivos (`FileTools`), git (`GitTools`) e sessão (`ShortTermMemory`).
- Chamadas ao LLM via `llm::client::LlmClient` (já presente) — usar `chat`/`generate` assíncronos em threads separadas.
- Comunicação: eventos de teclado via `crossterm`, render via `ratatui`.
- Persistência: `FileTools::write_file` para salvar buffers; sessões curtas em `ShortTermMemory`.

## 5. Próximos passos práticos (tarefas imediatas)

1. Implementar editor básico em `src/ui.rs`:
   - Abrir arquivo (Enter no sidebar) em modo editável.
   - Permitir editar texto, salvar com tecla de atalho (ex: `Ctrl-S`).
2. Adicionar sessions sidebar (pegar de `AgentState.session`).
3. Model selector: pequeno menu em `Tui` para alternar entre `local` e `ollama`.
4. Command palette mínima: atalho (`Ctrl-P`) para abrir input de comando.

## 6. Comandos para desenvolvimento e teste

```bash
# Build (localmente, este ambiente pode não ter cargo instalado)
cargo build

# Rodar TUI apontando para workspace
    cargo run -- --dir . Tui
```

## 7. Referências rápidas dentro do repositório

- Arquivo principal da UI: `src/ui.rs`
- Entrypoint CLI: `src/main.rs` (subcomando `Tui`)
- Agent state: `src/agent/state.rs`
- FileTools: `src/tools/fs.rs`
- LLM client: `src/llm/client.rs`

---

Se preferir, eu já implemento o editor básico agora (criar buffer, atalhos para salvar), ou eu gero um conjunto de PRs por sprint. Indique qual opção prefere: "implementar" ou "prs".