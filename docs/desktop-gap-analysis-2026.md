# ChronoKairo Desktop — análise de gaps em 2026

**Data:** 29 de agosto de 2026  
**Escopo:** aplicação Tauri/Next.js comparada às superfícies desktop/IDE de Codex, Factory Droid, Hermes, Cline e aos recursos de supervisão oferecidos por Claude Code, OpenCode, Copilot CLI, Pi/Oh My Pi, DeepSeek Harness e Qwen Code.

> O documento do CLI cobre o runtime do coding harness. Este documento cobre o que o **produto desktop** precisa oferecer para dirigir, observar, revisar e recuperar o trabalho desse runtime. Recursos do core não devem ser duplicados dentro do app.

## Veredito

O repositório já contém uma superfície ampla: Tauri v2, React/Next, IPC, streaming do agente, approvals, terminal, painéis de skills, hooks, memória, providers, patches, browser, automações e diagnósticos. O frontend passa no typecheck.

Porém, a amplitude atual é maior que a integração comprovada. Há código do harness copiado para `src-tauri`, mais de cem comandos IPC registrados individualmente e vários painéis que expõem serviços isolados, mas ainda não existe uma experiência única de “task supervision” comparável ao Codex app ou Factory App. Segurança e build também possuem bloqueadores objetivos.

As cinco prioridades são:

1. corrigir secrets, CSP e fronteiras IPC;
2. eliminar a cópia do harness e consumir um protocolo/versionamento comum com o CLI;
3. tornar o build limpo e reproduzível;
4. criar uma tela canônica de task com timeline, árvore de agentes, approvals, terminal, checks e diff;
5. implementar worktrees/checkpoints e recuperação durável.

## Evidência de validação

| Verificação | Resultado em 2026-08-29 | Observação |
|---|---|---|
| `npm run typecheck` | ✅ passou | TypeScript sem erros |
| `cargo check` em checkout atual | ❌ falhou | build do Tauri tentou ler permissões em caminho antigo `C:\Users\luann\Documents\GitHub\erp\desktop\...`; o checkout não é reproduzível sem limpar estado/cache |
| Alterações locais | preservadas | esta análise não altera arquivos de produto existentes |

## Estado atual comprovado

| Área | Estado | Evidência / limitação |
|---|---|---|
| Shell desktop | ✅ | Tauri v2 + Next/React; `src-tauri/src/lib.rs`, `src/app/page.tsx` |
| Streaming do agente | ✅ básico | `useHarnessAgent.ts` recebe eventos, texto, tool deltas e approval |
| Interrupção e approval | ✅ básico | IPC `interrupt_agent`/`resolve_approval` e UI correspondente |
| Terminal integrado | ✅ básico | `TerminalBottomPanel.tsx` e runtime PTY/websocket no Rust |
| Preview/aplicação de patch | ✅ básico | comandos dry-run/commit/revert e `PatchPreviewPanel.tsx` |
| Skills/hooks/memory/providers | 🟡 | painéis e comandos existem, mas não formam ainda plugins versionados e governados |
| Browser agentivo | 🟡 | scripts e fetch existem; TODO ainda pede webview dedicada/headless engine |
| Automations | 🟡 | UI/hooks existem; falta comprovação de scheduler durável e review queue integrada |
| Supervisão multiagente | ❌ produto | não há árvore de filhos, live progress, orçamento/cancelamento por filho ou merge visual |
| Worktree por task | ❌ | UI menciona workspaces/worktrees, mas não há fluxo completo de criação/handoff/cleanup/review |
| Artifact viewer | ❌ | sem renderer unificado para PDF, docs, sheets, slides, imagens e sites |
| Distribuição/update | ❌ | TODO registra NSIS não validado e auto-updater ausente |

Legenda: ✅ utilizável; 🟡 parcial ou desconectado; ❌ ausente/não comprovado.

## Achados críticos da auditoria

### 1. Secrets não podem ser considerados concluídos

`src-tauri/src/harness/secrets.rs` contém o comentário `For now, store plaintext with a TODO for encryption`. Isso contradiz o TODO que marca AES-256-GCM como concluído. Além disso, comandos IPC como `get_secret` e `get_model_provider_api_key` devolvem o valor secreto ao frontend.

**Risco:** qualquer XSS, plugin ou código de webview com acesso ao IPC pode exfiltrar credenciais.

### 2. CSP enfraquecido

`src-tauri/tauri.conf.json` permite `'unsafe-inline'` e `'unsafe-eval'` em scripts. Para um app que manipula tokens, repositórios e execução shell, isso aumenta muito o impacto de uma injeção no frontend.

### 3. Erros IPC são mascarados

`invokeHarness` captura qualquer exceção e retorna `{ available: false }`. Falha de permissão, bug Rust, timeout, payload inválido e ausência do Tauri ficam indistinguíveis.

**Impacto:** a UI pode esconder regressões reais e orientar o usuário como se o runtime apenas estivesse indisponível.

### 4. Hardening não é observável

`get_hardening_status` devolve sempre `applied: false`; o próprio comentário diz que o estado não pode ser consultado. O painel, portanto, não comprova proteção ativa.

### 5. Hooks expostos podem não carregar configuração

`dispatch_hook_event` cria `Hooks::new()` antes de despachar, enquanto `load_hooks` carrega e descarta uma instância separada. O fluxo IPC não demonstra que hooks carregados persistem para o dispatch seguinte.

### 6. Core duplicado entre CLI e desktop

`src-tauri/src/agent`, `llm`, `tools`, `protocol`, `memory`, `mcp`, `ui` e outros repetem grande parte da árvore do CLI. Isso cria duas implementações do harness, duas superfícies de segurança e migrações divergentes.

### 7. Build depende de estado antigo

O `cargo check` falha buscando permissões geradas no checkout antigo `GitHub\erp\desktop`. Um clone/checkout limpo precisa compilar sem depender de artefatos absolutos anteriores.

## Tabela de gaps a implementar

| ID | Prioridade | Gap | Referência competitiva | Implementação recomendada | Critério de aceite |
|---|:---:|---|---|---|---|
| D01 | P0 | **Vault seguro de credenciais** | Apps modernos usam keychain e tokens escopados | Usar Windows Credential Manager/macOS Keychain/libsecret; manter chaves fora de SQLite/arquivos; API de “use secret” em vez de “get secret”; redaction central | Nenhum comando IPC devolve API key bruta; secrets em disco não são plaintext; testes de migração, redaction e acesso negado |
| D02 | P0 | **CSP e webview hardened** | Codex/Factory tratam o desktop como boundary privilegiada | Remover `unsafe-eval`; adotar nonce/hash para scripts; validar navigation/new-window/download; allowlist mínima de origins; separar browser agentivo da UI privilegiada | Build funciona com CSP estrito; tentativa de script inline/eval é bloqueada; web content não invoca comandos privilegiados |
| D03 | P0 | **IPC tipado, autorizado e observável** | Tauri capability model + app-server de Codex | Gerar bindings Rust↔TS; payload schemas; errors discriminados; timeout/cancel; capability por janela/comando; correlation ID e audit | Nenhum `catch { available:false }`; UI diferencia offline/denied/invalid/internal/timeout; comandos sensíveis exigem capability explícita |
| D04 | P0 | **Um core compartilhado com o CLI** | Codex e Factory usam o mesmo runtime em CLI/app/SDK | Extrair core Rust para crate versionado ou executar o `chronokairo app-server`; desktop vira consumidor de `Op/EventMsg`, sem cópia de `agent/tools/llm` | Teste de contrato roda contra CLI e desktop; zero fork de `agent_loop.rs`; versões incompatíveis mostram upgrade/handoff claro | **Parcial em [ADR-0027](./adr/0027-extracao-core-ckc-para-repo-cli.md):** o core Rust foi extraído para o repo versionado `chronokairo/cli` e a casca o consome por git tag; falta o desktop virar consumidor de `Op/EventMsg` via `ck app-server` em vez de linkar a crate.
| D05 | P0 | **Build limpo e release reproduzível** | Apps concorrentes distribuem Windows/macOS com update | Remover dependência de caminhos absolutos/cache; CI em clone limpo; lockfiles; bundles assinados; SBOM e provenance | `npm ci && npm run typecheck && cargo check && tauri build` passa em runner limpo; artefato instalado abre e executa smoke test |
| D06 | P0 | **Task workspace canônico** | Codex app é command center; Factory organiza reviewable sessions | Unificar chat, timeline, steps, tool calls, approvals, terminal, diagnostics, checks e diff numa task; estados claros: running/attention/failed/complete | Usuário entende status sem abrir painéis técnicos; reload preserva timeline; itens que exigem ação ganham fila própria |
| D07 | P0 | **Árvore e controle multiagente** | Codex supervisiona agentes paralelos; Factory/Droid expõe sessões; Hermes mostra subagents live | Visualizar pai/filhos, papel/modelo/workspace, progresso, custo e última ação; steer/cancel/retry por filho; agregação de approvals | Task com 8 filhos continua legível; usuário pode abrir cada trace; cancelamento não mata irmãos; custo total fecha com filhos |
| D08 | P1 | **Worktrees e checkpoints por task** | Codex app usa worktrees/handoff; Cline salva checkpoints | Criar task em local/worktree, snapshot antes de mutação, handoff local↔worktree, cleanup seguro e restore seletivo | Duas tasks paralelas não colidem; diff indica base; restore não apaga mudanças externas; cleanup pede confirmação quando necessário |
| D09 | P1 | **Review center de primeira classe** | Factory oferece diff inline e point-and-comment; Codex possui review/PR sidebar | Diff virtualizado, staged/unstaged/branch, comentários por linha, aceitar/rejeitar hunk, pedir correção ao agente, checks e PR context | Diff grande permanece fluido; comentário vira follow-up com contexto exato; merge/push nunca é implícito |
| D10 | P1 | **Durable sessions e crash recovery** | Codex/Factory sincronizam sessões; Hermes usa delivery durável | Event log local, resume após crash, reconnect de stream, dedupe por event ID, pending approvals persistentes e reconciliação de processo órfão | Fechar/matar o app durante tool call não perde timeline; reabrir informa estado real; resposta duplicada não aparece |
| D11 | P1 | **Automations + review queue** | Codex app agenda automações e envia resultados para review queue; Hermes agenda cron | Scheduler durável, timezone, run history, pause/edit/run-now, limits, notifications e vínculo a uma task/template | Reinício não perde agenda; missed run tem política; resultado aparece em Inbox com diff/checks e pode ser continuado |
| D12 | P1 | **Terminal nativo robusto** | Codex/Factory ligam terminal ao contexto da task | PTY por task, múltiplas abas, resize/copy/search, exit status, reconnect, shell profile/WSL, cwd/env explícitos e sandbox badge | Terminal sobrevive à troca de tela; processos órfãos são tratados; comandos do agente e do usuário têm atribuição visual |
| D13 | P1 | **Plugin manager governado** | Codex/Hermes/Qwen/Pi empacotam skills, apps, hooks e tools | Manifesto, permissões, assinatura/origem, install/update/remove, enable por workspace, compatibilidade e audit; UI mostra acesso pedido | Plugin não recebe IPC genérico; instalação mostra riscos; versão incompatível não carrega; safe mode desabilita terceiros |
| D14 | P1 | **Browser seguro e verificável** | Codex/Hermes/Cline oferecem browser/computer use | Webview isolada ou sidecar, accessibility snapshot, refs estáveis, profiles, login handoff, downloads, screenshots e network log | Conteúdo remoto não compartilha privilégios com UI; ação sensível é aprovada; task preserva screenshot/URL/ação para auditoria |
| D15 | P1 | **GitHub/PR e CI integrados** | Factory e Codex revisam PRs e conectam resultados ao trabalho | OAuth escopado, PR/issue context, checks/logs, inline comments draft, branch/push/PR com approvals separados | Leitura funciona sem permissão de escrita; comentário/push mostra preview; falha CI pode criar task reproduzível |
| D16 | P1 | **Updater assinado e rollback** | Distribuição desktop exige atualização segura | `tauri-plugin-updater`, ed25519, channels stable/beta, staged rollout, rollback e migrations transacionais | Pacote adulterado é rejeitado; app restaura versão anterior após falha; banco/config permanecem compatíveis |
| D17 | P2 | **Artifact viewer** | Factory renderiza docs, slides, PDFs, sheets, sites e diffs; Codex trata artifacts como outputs | Registry de renderers sandboxed, preview de imagem/PDF/office/HTML, metadata, download/reveal e version history | Artefato abre ao lado da task sem executar scripts arbitrários; formatos desconhecidos têm fallback seguro |
| D18 | P2 | **Remote/mobile handoff** | Codex e Factory mantêm estado entre desktop/web/mobile | Host agent autenticado, canal E2EE, device pairing, approvals remotos, presence e revogação | Telefone mostra estado ao vivo e aprova dentro do escopo; host revogado perde acesso; secrets nunca transitam em claro |
| D19 | P2 | **Notificações acionáveis** | Apps líderes avisam quando task precisa de atenção | Notificação de approval/failure/completion, deep link para task, quiet hours, grouping e configuração por automation | Clique abre exatamente a task/approval; nenhum conteúdo sensível aparece na lock screen por padrão |
| D20 | P2 | **Acessibilidade, performance e UX de escala** | Hermes virtualiza diffs/markdown; Codex/Factory gerenciam muitas tasks | Navegação completa por teclado, screen reader, focus management, virtualização, command palette real, busca global e multiwindow | Auditoria WCAG; 100 tasks/10k eventos continuam fluidos; nenhuma approval depende apenas de cor/ícone |
| D21 | P2 | **Telemetria privada e suporte** | Factory oferece analytics/governança; runtimes modernos expõem traces | Logs estruturados locais, export de diagnóstico com redaction, crash reporting opt-in, métricas por task e health screen | Bundle de suporte não contém prompts/secrets por padrão; usuário vê/apaga dados; correlação frontend↔IPC↔core |
| D22 | P2 | **Onboarding e compatibilidade de runtime** | Factory/Codex guiam conexão local/cloud; Hermes valida compatibilidade | Detectar CLI/core/Ollama/Git/shell, escolher workspace/modelo, testar sandbox, importar configs/skills e apresentar incompatibilidades | Primeira task funcional sem edição manual de config; falha oferece ação concreta; versões core/UI negociam capabilities |

## Produto-alvo recomendado

```text
ChronoKairo Desktop
├── Projects / Workspaces
│   ├── checkout local
│   └── worktrees gerenciadas
├── Tasks
│   ├── timeline canônica de EventMsg
│   ├── árvore de agentes
│   ├── terminal e browser isolados
│   ├── approvals / attention queue
│   ├── diff + checks + review comments
│   └── artifacts
├── Automations
│   ├── schedules e run history
│   └── review queue
└── Settings
    ├── models e providers
    ├── plugins / skills / MCP
    ├── permissions / sandbox / secrets
    └── diagnostics / updates
```

O ponto central é a **task**, não uma coleção de painéis de capacidades. Skills, memória, hooks, providers e tools são configurações ou detalhes inspecionáveis da task.

## Roadmap sugerido

### Fase 1 — segurança e convergência

- [ ] D01 Vault seguro
- [ ] D02 CSP/webview hardened
- [ ] D03 IPC tipado
- [ ] D04 core compartilhado
- [ ] D05 build reproduzível

### Fase 2 — command center

- [ ] D06 task workspace
- [ ] D07 multiagente
- [ ] D08 worktrees/checkpoints
- [ ] D09 review center
- [ ] D10 crash recovery
- [ ] D12 terminal robusto

### Fase 3 — operação e ecossistema

- [ ] D11 automations/review queue
- [ ] D13 plugins
- [ ] D14 browser
- [ ] D15 GitHub/PR/CI
- [ ] D16 updater

### Fase 4 — superfícies avançadas

- [ ] D17 artifacts
- [ ] D18 remote/mobile
- [ ] D19 notifications
- [ ] D20 accessibility/performance
- [ ] D21 telemetry/support
- [ ] D22 onboarding

## O que evitar

- Continuar copiando módulos do CLI para `src-tauri`.
- Adicionar mais comandos ao `generate_handler!` sem schema/binding/capability gerados.
- Tratar painel existente como feature concluída sem teste end-to-end.
- Expor secrets brutos ao React.
- Misturar conteúdo web não confiável na mesma webview privilegiada.
- Construir marketplace antes de trust, assinatura, capability e safe mode.
- Priorizar mobile antes de build desktop, updater, recovery e task supervision estarem sólidos.

## Fontes primárias

- [OpenAI — Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [OpenAI — Work with Codex from anywhere](https://openai.com/index/work-with-codex-from-anywhere/)
- [OpenAI — Plugins in ChatGPT and Codex](https://help.openai.com/en/articles/20001256-plugins-in-codexOpenAI)
- [Factory App — visão geral](https://docs.factory.ai/factory-app/overview)
- [Factory — documentação da plataforma](https://docs.factory.ai/)
- [Hermes Agent — features](https://hermes-agent.nousresearch.com/docs/user-guide/features/overview/)
- [Hermes Desktop — código oficial](https://github.com/NousResearch/hermes-agent/tree/main/apps/desktop)
- [Cline — IDE workflow e checkpoints](https://docs.cline.bot/usage/ide)
- [Cline — repositório oficial](https://github.com/cline/cline)
- [Cline SDK](https://docs.cline.bot/sdk/overview)
- [Qwen Code — computer use](https://qwenlm.github.io/qwen-code-docs/en/users/features/computer-use/)
- [Pi — extensions](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md)
- [DeepSeek Harness](https://www.deepseek.com/harness/en/)

## Manutenção

Esta é uma fotografia de 2026-08-29. Um gap só deve ser marcado como concluído quando houver fluxo end-to-end exercitável pela UI, teste do contrato IPC, teste Rust e evidência de build limpo. Checklists e painéis, isoladamente, não constituem aceite.
