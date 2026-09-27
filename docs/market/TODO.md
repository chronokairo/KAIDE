# TODO — Paridade com coding agents de mercado (CLI & desktop)

**Data:** 26 de setembro de 2026
**Corpus:** 23 changelogs baixados em [`docs/market/changelogs/`](changelogs/) — janela dominante mai–set/2026 (tabela de cobertura ao final).
**Método:** digests dos changelogs cruzados com o que o repo já rastreia em `docs/desktop-gap-analysis-2026.md` (D01–D22), `chronokairo/cli` → `docs/adr/0015-competitive-backlog.md` (C1–C9, R1–R3), `chronokairo/cli` → `docs/gap-analysis-*-2026-08.md` e `chronokairo/cli` → `TODO.md`. Itens já cobertos nesses documentos **não são duplicados** — este TODO registra apenas **deltas novos** e refinamentos com evidência de mercado.

**Prioridades:** P1 = paridade obrigatória em 2026 / risco competitivo; P2 = diferencial competitivo; P3 = acompanhamento.

## Panorama set/2026 — o que virou obrigatório

1. **Auto-approvals com classificador de risco**: approvals deixaram de ser só allowlist — viraram produto auditável com risco classificado por LLM (1 token), evidência que sobrevive a compaction e aprovações que expiram ao ampliar permissões (Claude Code auto mode; Codex Guardian V2).
2. **ACP como protocolo público de agente**: Zed, Goose, Windsurf, Kiro e OpenHands usam Agent Client Protocol para servir e consumir harnesses externos; o Kiro Crew orquestra Claude Code/Codex/OpenCode/goose como backends via ACP.
3. **MCP 2026-07-28**: negociação da nova spec, OAuth com refresh (RFC 9207/CIMD), tool search paginado/deferred, startup não bloqueante e budgets por tool são o piso em todos os líderes.
4. **Subagentes com governança**: per-spawn model override, limite de profundidade anti-nesting, allowlist de tools por subagente (least privilege), caps de concorrência e mensageria entre agentes/sessões.
5. **Context engineering econômico**: microcompactação/compaction preservando prompt-cache, checkpoints no compaction, resume por boundary de compaction e custo de contexto visível por arquivo.
6. **Execução remota e event-driven**: runners self-hosted/cloud (Claude self-hosted-runner, Amp Orbs, Cursor machines), filas duráveis que sobrevivem a restart (Kiro Crew), gatilhos por PR/Slack/cron e goals com orçamento.
7. **Workbench de supervisão**: o chat vira console — worktrees, PR com CI/auto-merge, terminal, browser, diffs e estados de sessão ("aguardando confirmação") num só lugar (Kilo, Windsurf, Factory Droid).
8. **Segurança em camadas fail-closed**: sandbox por SO, mascaramento de credenciais, scan de segredos em commits, managed settings que só apertam (nunca afrouxam) e supply-chain de plugins (pin sha256, `--ignore-scripts`).
9. **Custos/telemetria de primeira classe**: TTFT e tok/s por mensagem, cache hit-ratio com diagnóstico de miss, dashboards de uso e orçamento por org/goal/subagente.
10. **Dial de esforço/modelo substitui escolha manual**: low→ultra (Amp), tier Auto (Copilot), roteamento por turno (Kiro Jev), reasoning effort por chamada (Qwen/Crush/Aider).

## TODO — núcleo `ckc` (repo `chronokairo/cli`)

- [ ] **A1 (P1) Classificador de risco no approval gate**: risco de tool call avaliado por LLM de 1 token, evidência persistente que sobreviva a compaction, aprovação invalidada quando permissões forem ampliadas. [Codex Guardian V2, 0.150→0.157; Claude Code auto mode server-side, 2.1.257/2.1.278]
- [ ] **A2 (P1) Governança de subagentes**: limite de profundidade (subagentes não aninham subagentes por padrão), permissões próprias por subagente, allowlist explícita de tools por subagente, caps de concorrência/spawns/WebSearch por sessão. [OpenCode v1.18.2/v1.17.2; Qwen 0.23.4; Claude Code 2.1.232/2.1.212]
- [ ] **A3 (P1) Compaction econômica**: microcompactação por tamanho preservando o prompt-cache do provedor; resume por boundary de compaction; checkpoint salvo no compaction; modelo dedicado de compaction configurável. [Qwen 0.23.0; Codex 0.150/0.155; Copilot CLI 1.0.85; Zed `compaction_model`]
- [ ] **A4 (P1) Cliente MCP 2026-07-28**: OAuth com refresh token (RFC 9207/CIMD), tool search paginado + deferred loading, startup não bloqueante (budget de espera no 1º turno), `output_token_limit` por tool, resource templates, abort signals. [Claude Code 2.1.274/2.1.283; Codex 0.147/0.152; Copilot CLI 1.0.81/1.0.83; Gemini CLI v0.60; OpenCode v1.17.x]
- [ ] **A5 (P1) Sandbox fail-closed**: política de rede imposta em redirects e conexões HTTP/WS contínuas com cancelamento na revogação; mascaramento de credenciais no egress (JWT claims, SigV4/AWS pairs); regra "containment escape" (credenciais cloud, egress evasion, cross-tenant). [Codex 0.156/0.157; Claude Code 2.1.224/2.1.221]
- [ ] **A6 (P2) Tools semânticas LSP**: `lsp_rename`/`lsp_replace_symbol` com fallback seguro para `edit`; repo-map tree-sitter amplo e busca rápida p/ monorepos (tgrep/SWE-grep). Refina o item C2 do adr/0015 (hoje regex). [Crush v0.86; Aider v0.77; Windsurf Fast Context; Copilot CLI 1.0.79]
- [ ] **A7 (P2) Plan mode endurecido**: bloqueio de mutação do workspace em plan (inclusive subagentes herdando deny do pai), plan salvo em arquivo revisável com botão "Implement". [Copilot CLI 1.0.71; OpenCode v1.14.46; Windsurf 3.8.20; Kilo 7.7.6]
- [ ] **A8 (P2) Checkpoints robustos**: índice persistente por task (sem re-hash de untracked), restore recusa após commits novos, rewind de arquivos sem depender de git. [Cline 4.1.19/4.1.17; Copilot CLI 1.0.78; Factory `/rewind-conversation`]
- [ ] **A9 (P2) Contabilidade de contexto**: `/context` com custo por arquivo, medidor de janela de contexto no TUI, compactação manual; leitura só do tail pós-resumo. [Qwen 0.24.2; OpenHands 1.13.0; Crush v0.96.0]
- [ ] **A10 (P2) Sessões grandes rápidas**: resume de transcripts grandes em <1s (leitura paralela/índice por papel), startup até digitável e RSS como SLAs medidos. [Copilot CLI 1.0.78; Crush v0.96.0; Qwen 0.24.6]
- [ ] **A11 (P3) Question tool e voice como primeira classe**: formulários/escolha múltipla/yes-no estruturados via protocolo; dictation e voice mode no TUI. [Crush v0.85; Zed `ask_user`; Copilot 1.0.81 Ctrl+Space; Gemini CLI v0.41]
- [ ] **A12 (P3) Dial de esforço/modelo por turno**: níveis low→ultra e roteador por complexidade sobre o catálogo provider-native existente (ADR 0019). [Amp 2026-07-09; Kiro Jev 2026-09; Qwen 0.23.3; Crush v0.94.1]
- [ ] **A13 (P3) Formato de edição por modelo**: patch/udiff/editor-diff escolhidos automaticamente ao trocar de modelo. [Aider v0.80/0.82/0.85]

## TODO — protocolo e multi-superfície

- [ ] **B1 (P1) ACP como porta universal**: expor o `ckc` como ACP server e consumir harnesses externos (Claude Code, Codex, goose) como backends orquestráveis; elicitação/question via ACP. [Zed v1.12/v1.17; Goose serve/ACP; Windsurf 3.10.23; Kiro Crew 0.7.0 multi-backend; Qwen 0.23.3 delegação ACP]
- [ ] **B2 (P1) Daemon app-server compartilhado**: lifecycle de daemon com auto-start, updates geridos e sessões compartilhadas entre TUI/IDE/desktop. [Codex 0.154–0.157]
- [ ] **B3 (P2) Mensageria entre agentes/sessões**: SendMessage/ListAgents com @-mention entre sessões; message board persistido (SQLite). [Claude Code 2.1.232/2.1.273; Codex 0.157; Amp 2026-07-17]
- [ ] **B4 (P2) Headless resiliente**: import/export de sessão em JSONL semântico, queue manager (reordenar/editar fila de prompts), `/fork` de conversa ativa em outra superfície. [Copilot CLI 1.0.85/1.0.77/1.0.88; Qwen `sessions ps`]

## TODO — shell desktop (Tauri)

- [ ] **C1 (P1) Console de supervisão/fleet**: kanban de sessões com estados ("aguardando confirmação" em negrito), stop de subagente individual, indicador de subagentes ativos, modelo/reasoning por missão e milestones com validação. Refina D06/D07 do desktop-gap. [Windsurf Command Center 3.7–3.10; Factory Mission Control; Codex command center 0.156]
- [ ] **C2 (P1) UX de checkpoints/rewind**: verificação de backups antes de restaurar, navegação anterior/próximo entre checkpoints no chat, "view changes" ao concluir task. [Claude Code 2.1.265; Roo Code 3.53.0; Cline 4.1.7]
- [ ] **C3 (P2) Notificações acionáveis**: notificações de OS para atenção/idle e OSC 777 para terminais. [Copilot CLI 1.0.66/1.0.88; Gemini CLI v0.40]
- [ ] **C4 (P2) Diffs fullscreen** de mudanças não commitadas e diff contra a branch main no app. [Claude Code `/diff` 2.1.260; OpenCode v1.17.10]
- [ ] **C5 (P2) Keep-awake** durante turnos longos do agente. [Zed `prevent_idle_sleep` v1.21; Kilo `/caffeinate`]
- [ ] **C6 (P3) Preview de localhost** via browser streamado (HTTPS/CDN). [Kilo 7.8.0]

## TODO — autonomia, review e integrações

- [ ] **D1 (P1) Fila durável de tasks/workflows** que sobreviva a restarts (journal/wal de sessão). Refina D11 do desktop-gap. [Kiro Crew 0.7.0; Qwen Managed Runtime v2, 0.24.6]
- [ ] **D2 (P1) Gatilhos event-driven**: watch de PR (GitHub/GitLab/Bitbucket/Azure DevOps) com comentários de review alimentando o agente, agendamentos, comentários do time. [Cursor Subscriptions 2026-08-19; Kilo PR watches 7.5.16+; OpenHands automations; Factory incident response via Slack]
- [ ] **D3 (P2) Goals persistentes com orçamento**: estados Active/Complete/Blocked/Paused, `maxTurns`/minutos ativos, pausa automática sem progresso. [Kilo 7.6.0; Cursor `/goal`; Qwen 0.23.x]
- [ ] **D4 (P2) Autopilot com auto-verificação**: loop de PR até CI verde; pausa ao concluir a tarefa. [Copilot CLI 1.0.66/1.0.86; Kilo auto-merge com CI checks 7.5.16]
- [ ] **D5 (P3) Agendamento por sessão**: cron/wakeups gerenciados pelo agente. [Kilo 7.7.9]
- [ ] **D6 (P2) Agentic review de PRs**: classificação de risco por LLM com evidência; Security Review por PR com team rules; scan de segredos em commits/pushes antes do push. [Codex Guardian; Cursor Security Review 2026-09-23; Factory Droid Shield 2026-09-22]

## TODO — plataforma, segurança e governança

- [ ] **E1 (P1) Supply-chain de plugins/skills**: pin sha256 da origem, instalação npm com `--ignore-scripts` + verificação de integridade, validação de manifesto com `--json`, evals de plugin com relatório pontuado, marketplace com allowlist enterprise. [Claude Code 2.1.269–2.1.281; Codex 0.150; Cline 4.1.12]
- [ ] **E2 (P1) Managed settings fail-closed**: políticas geridas só apertam (nunca afrouxam); `availableModelsMatch: "exact"` + `deniedModels`; sandbox floor corporativo. [Claude Code 2.1.283/2.1.280; Copilot CLI 1.0.76/1.0.87]
- [ ] **E3 (P1) Segredos e arquivos sensíveis**: aprovação explícita para ler `.env`/chaves/certificados (`.augmentignore`-like), não carregar `.env` automaticamente, redaction em telemetria. Refina D01 do desktop-gap. [Augment 2026-09-14; Kiro CLI 2.24; Goose 1.49 redaction]
- [ ] **E4 (P2) Skills on-demand**: carregar skill somente quando usada (base de tokens enxuta), "skill doctor" com custo de contexto por skill, descoberta via `skill_search` em vez de injeção total; seguir a spec agentskills.io. [Claude Code 2.1.261/2.1.283; Kiro Jev; Roo Code 3.38.2]
- [ ] **E5 (P2) Telemetria/custos de produto**: TTFT e tok/s por mensagem, cache hit-ratio com causa provável de miss, dashboards `/usage` e orçamentos por org/agent. [Goose 1.46; Claude Code 2.1.282 `/cost`; Codex 0.156 `/usage`; OpenHands budgets; Augment Cost Analytics]
- [ ] **E6 (P2) Trust gating**: hooks de workspace só rodam em workspaces confiáveis; consentimento explícito para recipes/extensões alterarem env vars. [Augment 2026-08-17; Goose 1.52]
- [ ] **E7 (P3) Execução remota gerida**: self-hosted runner transformando máquinas próprias em ambiente de sessões desktop/web/mobile; attestation de runtime antes de adoção. [Claude Code 2.1.224; Amp Orbs/runner; Qwen 0.24.5/0.24.6; Cursor self-hosted machines 2026-09-02]

## Já rastreado em outros documentos (não duplicar aqui)

| Tema | Onde já está |
| --- | --- |
| Task canônica, timeline, approvals, PTY por task, sessões duráveis | desktop-gap D06/D10/D12 |
| Worktree por task com handoff/cleanup | desktop-gap D08 (refinar com C1/C2 e Copilot `worktreePathTemplate` 1.0.87, Kilo worktrees pre-warmed 7.7.0) |
| Árvore multiagente com steer/cancel/custo | desktop-gap D07 (refinar com A2/B3) |
| Vault de secrets sem devolver segredo ao IPC, CSP, IPC tipado | desktop-gap D01/D02/D03 |
| Core compartilhado CLI↔desktop via `Op`/`EventMsg` | desktop-gap D04 (refinar com B2) |
| Plugin manager governado com manifesto/assinatura | desktop-gap D13 (refinar com E1) |
| Browser agentivo isolado | desktop-gap D14 (refinar com C6) |
| Scheduler durável + review queue; review center; GitHub/PR; artifact viewer; remote/mobile E2EE; updater assinado; telemetria privada | desktop-gap D11/D09/D15/D17/D18/D16/D21 |
| Path-scoped permissions, symbol search, subagentes paralelos, skills, checksums, extended thinking, verificação adversarial, background tasks | adr/0015 C1–C9 |
| Context Engine (`repo/context.rs`), task classifier, `FallbackChain`, custo como sinal, memória categorizada | gap-analysis-vision top-5 |
| Custo US$/turno, MCP client stdio, compactação básica, tool `task` | ckc gap-ago G5/G6/G7 (fechados) |
| TUI parity (composer, paste, menções `@`/`$`, fila, IDs, approvals granulares) | ckc TODO UX1–UX10 (concluídos) |
| RAG/backend (auth, RBAC, validação, health checks, testes) | TODO.md raiz |

## Cobertura do corpus (download de 26/09/2026)

| Produto | Arquivo | Janela coberta | Última versão/data | Observação |
| --- | --- | --- | --- | --- |
| Claude Code | `claude-code.md` | 2.1.211 → 2.1.283 (~jun–set/2026) | 2.1.283 | changelog oficial completo |
| Codex (OpenAI) | `codex.md` | rust-v0.147.0 → v0.157.1 | v0.157.1 — 2026-09-26 | completo |
| Gemini CLI | `gemini-cli.md` | v0.37.0 → v0.61.0 (abr–set) | v0.61.0 — 2026-09-23 | completo |
| Copilot CLI | `copilot-cli.md` | 1.0.33 → 1.0.88 (abr–set) | 1.0.88 — 2026-09-22 | completo |
| Qwen Code | `qwen-code.md` | v0.23.1 → v0.24.6 | v0.24.6 — 2026-09-26 | completo (inclui desktop/SDK) |
| Crush (Charm) | `crush.md` | v0.77.0 → v0.96.1 (jun–set) | v0.96.1 — 2026-09-21 | completo |
| OpenCode | `opencode.md` | v1.14.42 → v1.18.32 (mai–set) | v1.18.32 — 2026-09-21 | completo |
| Goose (Block) | `goose.md` | v1.40.0 → v1.52.0 (jul–set) | v1.52.0 — 2026-09-23 | completo |
| OpenHands | `openhands.md` | 1.0.0 → 1.24.0 | 1.24.0 — 2026-09-25 | completo |
| Cline | `cline.md` | 3.38.3 → 4.1.21 | 4.1.21 | sem datas explícitas |
| Roo Code | `roo-code.md` | 3.26.2 → 3.53.0 (ago/25–fev/26) | 3.53.0 | handoff p/ comunidade |
| Kilo Code | `kilo-code.md` | v7.5.16 → v7.8.1 (set/2026) | v7.8.1 — 2026-09-25 | completo |
| Continue | `continue.md` | v1.2.14 → v2.0.0 (jan–jun/26) | v2.0.0 — 2026-06-19 | extensão encerrada; pivô CLI `cn` |
| Aider | `aider.md` | histórico até branch main | main | sem datas recentes |
| Plandex | `plandex.md` | v0.9.0 → v2.2.1 | v2.2.1 — 2025-07-16 | **defasado** desde 07/2025 |
| Void | `void.md` | v1.0.0 → v1.3.4 | v1.3.4 — 2025-04-15 | **defasado** (~17 meses) |
| Zed | `zed.md` | v1.7.2 → v1.21.0 (jun–set) | v1.21.0 — 2026-09-23 | completo |
| Cursor | `cursor.md` | 2026-08-19 → 2026-09-23 | — | scrape OK (páginas duplicadas) |
| Windsurf / Devin Desktop | `windsurf.md` | v1.6.1 → v3.10.35 | v3.10.35 — 2026-09-24 | scrape OK |
| Kiro | `kiro.md` | 2026-09-11 → 2026-09-24 | Crew 0.7.0 | **scrape incompleto** (1/13 páginas) — rebaixar |
| Amp | `amp.md` | 2025-03-06 → 2026-09-25 | — | scrape OK |
| Augment | `augment.md` | 2026-03-26 → 2026-09-26 | — | scrape parcial (9 updates) |
| Factory Droid | `factory-droid.md` | 2026-05-27 → 2026-09-26 | CLI v0.228 / Desktop v0.185 | scrape OK |

## Manutenção

- Rebaixar os changelogs periodicamente (pelo menos mensal); substituir `kiro.md` por fonte completa e reavaliar `plandex.md`/`void.md` (defasados) e `continue.md` (encerrado).
- Ao atualizar, regenerar os digests por produto e mover itens deste TODO: fechados → PR/referência; obsoletos → remoção.
- Itens marcados "refina X" devem ser executados em conjunto com o documento de origem (desktop-gap/adr-0015), não como esforço separado.
