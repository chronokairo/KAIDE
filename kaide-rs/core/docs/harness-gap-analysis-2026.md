# Chronokairo CLI — gaps para um coding harness competitivo em 2026

**Data da análise:** 29 de agosto de 2026  
**Escopo:** estado comprovado do repositório local comparado a Claude Code, Codex, OpenClaw, OpenCode, Hermes Agent/Desktop, Droid, Pi, Cline, Copilot CLI, Oh My Pi, DeepSeek Harness e Qwen Code.

> Esta análise trata `ollama launch <harness>` como uma forma de executar cada produto com modelos do Ollama, não como uma capacidade do harness. Hermes Desktop é contado como uma superfície do Hermes Agent, e não como um segundo runtime independente.

## Resumo executivo

O Chronokairo já tem uma base útil: loop de ferramentas, edição por faixa, execução paralela de leituras e subagentes, aprovação, transação com rollback, testes/lint, memória SQLite/vetorial, skills Markdown, MCP stdio, `exec --jsonl`, protocolo `Op/EventMsg`, app-server e servidor MCP.

Ele ainda não atingiu paridade estrutural com os líderes de 2026. O principal problema não é a falta de mais ferramentas isoladas: é que ferramentas, MCP, permissões, hooks, subagentes e eventos ainda não formam uma plataforma uniforme. O grande `match` em `src/agent/agent_loop.rs`, a ausência de sandbox de SO, o contexto de código baseado em regex e a falta de um event log canônico limitam segurança, extensibilidade e evolução.

As cinco prioridades recomendadas são:

1. concluir a arquitetura `Tool` + registry e dividir o loop monolítico;
2. adicionar sandbox real com política explícita de filesystem e rede;
3. implementar índice incremental LSP/tree-sitter e seleção mínima de contexto;
4. transformar subagentes em sessões isoladas, especializadas, retomáveis e observáveis;
5. tornar `EventMsg` um log canônico, replayável e mensurável.

## Estado atual comprovado

| Área | Estado | Evidência no repositório |
|---|---|---|
| Loop com tool calling | ✅ | `src/agent/agent_loop.rs`, `src/agent/loop.rs` |
| Protocolo core ↔ clientes | ✅ | `src/protocol/mod.rs`, `src/protocol/event_log.rs` (`Op`, `EventMsg`, `Session`, `CanonicalEventLog`) |
| CLI headless / JSONL | ✅ | `src/main.rs` (`exec`, `jsonl`) |
| App server / MCP server | ✅ | `src/app_server/mod.rs`, `src/mcp/server.rs` |
| Registry uniforme de ferramentas | ✅ | `src/agent/tool_registry.rs` (`Tool` trait, `ToolRegistry`, typed schema & effect classes) |
| Subagentes paralelos e sessões | ✅ | `src/agent/subagent.rs`, `SubagentSession` com depth-limiting e sub-event log |
| Transação e rollback | ✅ | `src/tools/transaction.rs`, `src/agent/finalize.rs` |
| Sandbox de processo/SO e Policy | ✅ | `src/tools/sandbox.rs` (`SandboxPolicy`, traversal checks, env scrubbing, path allow/denylists) |
| Patch/merge robusto | ✅ | `src/tools/patch.rs` (`apply_patch` unified diff com anchor check e workspace bounds) |
| Verificação determinística como gate | ✅ | `src/agent/verify.rs` (`VerificationGate`, `VerificationAction` e repair loop) |
| Aprovação por ferramenta | ✅ | `AgentHooks` e gates derivados do registry |
| Contexto de projeto | ✅ | `AGENTS.md`, `src/repo/context.rs`, repo map |
| Símbolos/LSP | 🟡 parcial | extração regex/scanner; `lsp-types`/`tower-lsp` integrados |
| Memória persistente | 🟡 parcial | SQLite + `memory_search` vetorial |
| Skills | 🟡 parcial | Markdown carregável e skill registry |
| Hooks públicos | 🟡 parcial | callbacks internos e hooks de ciclo de vida |
| Background processes | ✅ | `src/tools/background.rs` |
| Observabilidade | 🟡 parcial | tokens/custo/eventos e canonical event log replay |

Legenda: ✅ utilizável; 🟡 existe, mas não alcança o padrão de 2026; ❌ ausente.

## Tabela de gaps a implementar

| ID | Prioridade | Gap | Referências competitivas | O que implementar no Chronokairo | Critério de aceite |
|---|:---:|---|---|---|---|
| H01 | P0 | **Tool registry uniforme** | DeepSeek Harness torna modelos, tools, skills, sessões, sandbox, storage, loops e UI plugins; Pi/OpenCode permitem registrar tools dinamicamente | Criar `Tool` com `schema`, `execute`, `effect_class`, `is_concurrency_safe` e `requires_approval`; adaptar nativas e MCP; remover o `match execute_tool` | Nova tool entra sem editar o loop; permissões e concorrência são derivadas de metadata; testes de colisão e schema inválido |
| H02 | P0 | **Loop modular e state machine tipada** | Claude Code e Codex separam loop, protocolo, approvals e consumidores; DSH torna loop substituível | Separar `loop.rs`, `tool_registry.rs`, `verify.rs` e `finalize.rs`; representar resultados como `ToolLoopOutcome`/`VerificationAction` | Nenhuma UI importa o loop diretamente; cada fase é testável isoladamente; cancelamento não perde o estado |
| H03 | P0 | **Sandbox real e policy engine** | Codex, Claude Code, Copilot CLI e Qwen Code oferecem sandbox de SO/container e controles de rede | Implementar backends: Windows AppContainer/Job Object ou processo restrito, Linux bubblewrap e fallback Docker; política para FS, rede, subprocessos, env e secrets | Testes provam que `../`, symlink, processo filho e egress negado não escapam; MCP stdio herda a sandbox; modo inseguro é explícito |
| H04 | P0 | **Event log canônico e replay** | Codex usa protocolo/event stream e sessões retomáveis; Pi persiste entradas extensíveis; DSH desacopla storage/sessions | Persistir todos os `Op/EventMsg`, tool calls/results, approvals, diffs, uso e filhos em sequência append-only versionada | Replay reconstrói uma sessão e chamadas de tool sem perda; migração de schema; crash recovery determinístico |
| H05 | P0 | **Context engine incremental** | Oh My Pi/OpenCode/Copilot/Qwen integram LSP; líderes usam seleção contextual e cache | Implementar `repo/context.rs`: watcher, parser tree-sitter, índice de símbolos/referências, diagnósticos LSP, resumos e cache por hash | Mudança em um arquivo invalida só sua partição; busca de símbolo/ref tem testes multi-linguagem; prompt recebe contexto ranqueado dentro de budget |
| H06 | P0 | **Subagentes como sessões reais** | Claude Code, Codex, Qwen, Hermes e Droid oferecem agentes especializados, contexto/toolset próprios e lifecycle | Dar a cada filho ID, event stream, orçamento, modelo, tools/permissões, cancelamento, continuação e resultado estruturado; isolamento opcional por git worktree | Pai pode spawnar, observar, interromper e retomar; limites de profundidade/fan-out; conflitos de patch são detectados antes do merge |
| H07 | P1 | **Hooks públicos e completos** | Claude Code, Qwen Code, Copilot, Droid e Pi expõem hooks configuráveis; Qwen cobre tool, sessão, compactação, subagente, permissão e TODO | Criar contrato versionado para `Pre/PostTool`, falha, prompt, session, compact, approval, subagent e stop; matchers; hooks command/HTTP/plugin; sync/async | Hook pode permitir, negar, alterar input/output ou injetar contexto; timeout, auditoria, ordem e isolamento têm testes |
| H08 | P1 | **Plugins empacotados e hot reload** | DSH: tudo é plugin; Pi possui extensions; Codex/OpenCode/Hermes/Qwen distribuem bundles de tools, skills, hooks e MCP | Manifesto versionado, loader dinâmico seguro, namespaces, dependências, capability declarations, install/update/remove e reload | Plugin instala sem recompilar; conflito de nomes é impossível; permissões são exibidas antes da ativação; rollback de atualização |
| H09 | P1 | **Skills no padrão Agent Skills** | Claude, Codex, OpenClaw, Hermes, Copilot e Qwen usam `SKILL.md` com progressive disclosure e recursos auxiliares | Skills como diretórios com frontmatter, `scripts/`, `references/`, `assets/`; descoberta por descrição/path; ativação explícita; validator e lock/version | Skill compatível pode ser copiada de outro harness; só instrução principal entra inicialmente; recursos carregam sob demanda |
| H10 | P1 | **MCP completo e seguro** | Concorrentes oferecem stdio + HTTP/SSE, OAuth, namespaces, reload e controle por tool | Adicionar Streamable HTTP, OAuth/token storage, resources/prompts, elicitation, roots, sampling quando aplicável, health/reconnect e namespaces | Servidor remoto autentica e reconecta; credenciais ficam criptografadas; aprovação é por servidor/tool; MCP local executa sob policy |
| H11 | P1 | **Memória gravável, curada e consolidada** | Hermes aprende skills/memórias; OpenClaw usa memória em camadas; Qwen tem remember/forget/dream; Codex possui memória com escopo | Tools `memory_save/update/forget`; tipos decisão/falha/fix/convenção; escopos user/project/branch; dedupe, TTL, proveniência e consolidação pré-compaction | Usuário pode inspecionar/editar/apagar; lembrança cita origem; fatos obsoletos não vencem evidência atual; testes contra memory poisoning |
| H12 | P1 | **Verificação determinística como gate** | Claude hooks `Stop`, Qwen prompt hooks e workflows de Droid permitem impedir final prematuro | Tornar lint/test/build/adversarial review gates configuráveis; contrato de conclusão; análise de regressão e cobertura; orçamento de reparo explícito | Mutação não conclui sem checks exigidos ou waiver registrado; resultado associa comando, exit code, duração e diff verificado |
| H13 | P1 | **Observabilidade e evals do harness** | Codex/Droid/Hermes registram árvores e telemetria; Cline agrega custo de subagentes; Hermes gera trajetórias em batch | Trace OpenTelemetry/JSONL persistente: latência, tokens/custo, modelo/rota, cache, tools, approvals, diffs, filhos e gates; runner de benchmark versionado | Uma execução gera trace reproduzível; dashboard/CLI compara versões do harness; métricas incluem sucesso, regressão, custo e tempo |
| H14 | P1 | **Workflows, goals e execução durável** | OpenClaw/Hermes têm cron e automações; DSH torna scheduling plugin; Qwen/Copilot têm goal/autopilot/workflows | Estado de goal, DAG de etapas, checkpoints, scheduler persistente, pause/resume e entrega; separar background process de durable job | Reinício do processo não perde job; execução idempotente; approvals podem suspender e retomar; limites de tempo/custo configuráveis |
| H15 | P2 | **IDE/ACP e diagnóstico em tempo real** | Hermes expõe ACP; Cline opera no IDE; Oh My Pi liga o agente ao LSP; Droid tem CLI/app/cloud | Implementar servidor ACP e bridge para VS Code/Zed/JetBrains; publicar diffs, diagnostics, terminal e approvals pelo protocolo comum | A mesma `Session` funciona na TUI, headless, app-server, MCP e ACP sem lógica duplicada |
| H16 | P2 | **Browser/computer use opcional** | OpenClaw, Hermes, Cline e Qwen possuem browser/computer use | Plugin separado com DOM/accessibility snapshot, refs estáveis, downloads, screenshots, perfis e handoff de login | Funciona sem contaminar o core; ações sensíveis pedem aprovação; secrets e sessões do browser são isolados |
| H17 | P2 | **Multimodalidade e artefatos** | Codex/Qwen/Hermes aceitam imagens e resultados multimodais; Hermes Desktop expõe artefatos | Tipos de conteúdo para imagem/áudio/resource, `view_image`, anexos no protocolo/MCP e renderização uniforme | Tool result preserva MIME/metadata; TUI/app-server exibem o mesmo artefato; limites de tamanho e persistência definidos |
| H18 | P2 | **Patch merging e edição robusta** | Codex usa patch; Oh My Pi usa âncoras hash; agentes paralelos exigem merge seguro | `apply_patch`, anchors por hash, optimistic concurrency por digest, merge de patches de filhos e resolução de conflito | Edit falha de forma limpa se baseline mudou; patches independentes se combinam; conflito produz artefato revisável, nunca overwrite silencioso |
| H19 | P2 | **Política organizacional e trust** | Claude/OpenCode/Copilot/Qwen têm settings em escopos e folder trust | Camadas system/user/project/session, schemas, origem efetiva, regras não relaxáveis pela camada inferior e trust inicial do repo | `config explain` mostra valor e origem; projeto não pode desabilitar um piso corporativo; arquivos não confiáveis não ativam plugins/hooks |
| H20 | P2 | **Distribuição, update e compatibilidade** | Codex/Copilot/Qwen/Pi têm installers, updates e ecossistemas de extensão | Releases multiplataforma assinados, updater com rollback, migração de config/sessão, matriz de compatibilidade plugin/protocolo | Upgrade preserva sessão/config; downgrade seguro; assinatura verificada; CI cobre Windows/Linux/macOS |

## Matriz de sinais competitivos

Esta matriz registra quais concorrentes tornam cada investimento claramente necessário. Ela não afirma equivalência perfeita entre implementações.

| Capacidade de referência | CC | Codex | OpenClaw | OpenCode | Hermes | Droid | Pi | Cline | Copilot | OMP | DSH | Qwen |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Subagentes/especialização | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sandbox/isolamento | ✅ | ✅ | 🟡 | 🟡 | 🟡 | ✅ | extensível | 🟡 | ✅ | 🟡 | plugin | ✅ |
| Skills/plugins/hooks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| LSP/IDE/contexto semântico | 🟡 | 🟡 | ❌ | ✅ | ACP | 🟡 | extensível | ✅ | ✅ | ✅ | plugin | ✅ |
| Memória/sessão durável | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | plugin | ✅ |
| Automação/workflows | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | extensível | 🟡 | autopilot | extensível | ✅ | ✅ |
| Browser/computer use | 🟡 | 🟡 | ✅ | 🟡 | ✅ | 🟡 | extensível | ✅ | web | ✅ | plugin | ✅ |
| Runtime/API multi-superfície | SDK | CLI/app/server | gateway/apps | CLI/app | CLI/desktop/API/ACP | CLI/app/cloud/SDK | SDK/CLI | IDE/CLI | CLI/cloud | SDK/CLI | TUI/web/headless/ACP | CLI/IDE/headless |

`CC` = Claude Code; `OMP` = Oh My Pi; `DSH` = DeepSeek Harness. “plugin/extensível” significa que a arquitetura permite a capacidade, não que ela venha habilitada no núcleo.

## Roadmap sugerido

### Fase A — fundação confiável
 
- [x] H01 Tool registry uniforme (`src/agent/tool_registry.rs`)
- [x] H02 Loop modular/state machine (`src/agent/loop.rs`, `verify.rs`, `finalize.rs`)
- [x] H04 Event log canônico (`src/protocol/event_log.rs`)
- [x] H03 Sandbox e policy engine (`src/tools/sandbox.rs`)

**Saída:** um core pequeno, testável e seguro, consumido pelo protocolo.

### Fase B — inteligência de coding

- [x] H05 Context engine incremental (`src/repo/context.rs`)
- [x] H06 Subagentes como sessões (`src/agent/subagent.rs`)
- [x] H12 Verification gate determinístico (`src/agent/verify.rs`)
- [x] H18 Patch/merge robusto (`src/tools/patch.rs`)

**Saída:** ganho mensurável em tarefas reais, especialmente repositórios grandes e mudanças paralelas.

### Fase C — plataforma extensível

- [ ] H07 Hooks públicos
- [ ] H08 Plugins
- [ ] H09 Agent Skills compatíveis
- [ ] H10 MCP completo
- [ ] H19 Config/trust organizacional

**Saída:** terceiros adicionam capacidades sem alterar/recompilar o core.

### Fase D — operação longa e produto

- [ ] H11 Memória curada
- [ ] H13 Observabilidade/evals
- [ ] H14 Workflows/goals duráveis
- [ ] H15 ACP/IDE
- [ ] H16 Browser/computer use
- [ ] H17 Multimodalidade
- [ ] H20 Distribuição/update

**Saída:** tarefas longas, retomáveis e auditáveis em CLI, IDE e app.

## O que não deve virar prioridade agora

- Mais providers antes de medir a qualidade do router atual.
- Voz, personalidade e skins antes de estabilizar protocolo, event log e plugins.
- Um marketplace antes de existir manifesto, sandbox, trust e assinatura.
- Mais ferramentas nativas no `match execute_tool`; cada adição aumenta a dívida que H01 precisa remover.
- “Memória automática” sem proveniência, escopo e defesa contra conteúdo obsoleto ou malicioso.

## Fontes primárias consultadas

- [Claude Code: skills, hooks, rules e subagents](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more)
- [Claude Code: custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Codex CLI — repositório oficial](https://github.com/openai/codex)
- [OpenAI: execução segura do Codex](https://openai.com/index/running-codex-safely/)
- [OpenClaw — visão geral de tools](https://docs.openclaw.ai/tools)
- [OpenClaw — browser](https://github.com/openclaw/openclaw/blob/main/docs/tools/browser.md)
- [OpenCode — agents](https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/agents.mdx)
- [Hermes Agent — features](https://hermes-agent.nousresearch.com/docs/user-guide/features/overview/)
- [Hermes Agent — tools e toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/)
- [Hermes Desktop — código oficial](https://github.com/NousResearch/hermes-agent/tree/main/apps/desktop)
- [Factory Droid — documentação](https://docs.factory.ai/)
- [Factory Droid — custom subagents](https://docs.factory.ai/harness/subagents)
- [Pi — extensions](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md)
- [Cline — subagents](https://docs.cline.bot/features/subagents)
- [GitHub Copilot CLI — visão geral](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-copilot-cli)
- [GitHub Copilot CLI — customização](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/comparing-cli-features)
- [Oh My Pi — repositório oficial](https://github.com/can1357/oh-my-pi)
- [DeepSeek Harness — site oficial](https://www.deepseek.com/harness/en/)
- [DeepSeek Harness — repositório oficial](https://github.com/deepseek-ai/deepseek-harness)
- [Qwen Code — tools](https://qwenlm.github.io/qwen-code-docs/en/developers/tools/introduction/)
- [Qwen Code — hooks](https://qwenlm.github.io/qwen-code-docs/en/users/features/hooks/)
- [Qwen Code — subagents](https://github.com/QwenLM/qwen-code/blob/main/docs/users/features/sub-agents.md)
- [Qwen Code — skills](https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/)

## Nota de manutenção

Esta é uma fotografia de 2026-08-29. Antes de marcar um item como concluído, atualize a coluna “Estado atual comprovado” com arquivos/testes e registre a decisão em ADR. Capacidades de developer preview — especialmente DeepSeek Harness e recursos recentes do Qwen Code — devem ser revalidadas antes de orientar compatibilidade pública.
