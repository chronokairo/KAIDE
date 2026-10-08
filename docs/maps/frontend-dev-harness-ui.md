# Mapa — UI do Dev Harness (frontend) e casca Tauri

> Gerado em 2026-09-26 como subsídio para os P0s de mercado (`TODO.md`) e para a tela canônica de task supervision (`docs/desktop-gap-analysis-2026.md`, gaps D06/D07/D10).
> Regra de ouro do gap analysis: **"o ponto central é a task, não uma coleção de painéis"**.

## 0. Shell e providers

```
src/app/layout.tsx (root)
└── OrganizationProvider > HarnessModeProvider > TauriRuntimeProvider > LayoutPanelsProvider
    └── src/app/page.tsx  <DesktopHome>  (rota "/")
        ├── SideNavBar        (src/shared/components/dashboard/SideNavBar.tsx)
        ├── TopNavBar         (src/shared/components/dashboard/TopNavBar.tsx; em harness mode → HarnessTopBar)
        ├── <main> renderActiveView()  — switch(activeNavTab)
        ├── BottomNavBar
        ├── TerminalBottomPanel
        └── AiCommandPalette  (Ctrl+K)
```

- `HarnessModeProvider` (`apps/web/src/providers/HarnessModeProvider`) liga o "Dev Harness" (breadcrumb "Dev / Harness IA").
- `TauriRuntimeProvider` (`apps/web/src/modules/ai/components/TauriRuntimeProvider.tsx`) só ativa em harness mode ou `/dev*`.
- `useLayoutPanels` mantém `activeNavTab` (sincronizado com `?tab=` via `window.history.replaceState` + CustomEvents `dev:tab-change`, `dev:project-change`, `dev:session-change`).

## 1. Navegação canônica — `NAV_GROUPS` (SideNavBar.tsx:16)

```ts
Principal:     chat | projetos | notifications | sessoes | agentes | automacoes
Capacidades:   skills | toolbox | memoria | browser | pdf-translator | intelligence
Engenharia:    patches | contexto | hooks | prompts | diagnostics | policy | files | attribution
Sistema:       configuracoes
```

`apps/web/src/app/page.tsx` `renderActiveView()` tem um `case` por id (aliases incl.: `github-notifications`, `pdf`, `tradutor-pdf`, `context`, `settings`, `providers`). **Uma tela nova = novo id em NAV_GROUPS + novo case em page.tsx.**

## 2. Runtime do agente no frontend

### 2.1 Transporte — `apps/web/src/modules/dev/harness/transport.ts`

```ts
isTauriRuntime(): boolean              // window.__TAURI__ || __TAURI_INTERNALS__
invokeHarness<T>(command, args): Promise<HarnessResult<T>>   // invoke() do @tauri-apps/api/core; catch → {available:false}
invokeRuntime<T>(method, params): Promise<HarnessResult<T>>  // invokeHarness('runtime_request', {method, params, workspace}) — ponte p/ runtime_api do kaide
```

`HarnessResult<T> = { data: T; available: boolean }` — **todo hook degrada graciosamente fora do Tauri** (`available:false`).

### 2.2 `agentClient` — `apps/web/src/modules/dev/harness/agent.ts`

```ts
agentClient.acpProviders()                                   // 'get_acp_providers'
agentClient.runAcpAgent(providerId, model, prompt, opts)     // 'run_acp_agent'
agentClient.askIntelligenceAgent(query, opts)                // 'ask_intelligence_agent'
agentClient.createSession(opts)                              // invokeRuntime('create_harness_session')
agentClient.streamAgentSession(prompt, onEvent, opts)        // 'stream_agent_session' com 4 Channels:
  //   onEvent: Channel<AgentEvent>; onTextDelta: Channel<string>;
  //   onToolCallDelta: Channel<ToolCallDeltaPayload>; onApproval: Channel<ApprovalRequest>
agentClient.interruptAgent(sessionId)                        // 'interrupt_agent' {sessionId}
agentClient.resolveApproval(sessionId, requestId, decision)  // 'resolve_approval' {sessionId, requestId:Number, decision}
```

### 2.3 Hook de streaming — `useStreamAgentSession` (`apps/web/src/modules/dev/hooks/useHarnessAgent.ts`)

Estado: `{ running, events: AgentEvent[], textDeltas: string, toolCallDeltas: ToolCallDeltaPayload[], approvalRequest, sessionId (uuid v4), lastError }`.
Ações: `startStream(prompt, onEvent, opts)` (gera `sessionId` se não vier, acumula eventos/deltas/approval), `interrupt()`, `resolveApproval(decision)`.

### 2.4 Barrel de hooks — `apps/web/src/modules/dev/hooks/useHarness.ts` (34+ hooks)

`useIsTauri`, `useHarnessOverview`, `useHarnessSkills(+Frontmatter)`, `useHarnessMemorySessions/useHarnessSessionMessages/useMemoriesSearch`, `useHarnessGitScan/useCloneRepo/useHarnessGitRepoStatus`, `useHarnessNodeIdentity/useHarnessSyncStatus/useHarnessQuorum/useOfflineMutationQueue/useCachedErpEntities`, `useHarnessContextFiles/useContextFragments/useAssembledContext`, `useHarnessAutomations`, `useAcpProviders/useRunAcpAgent/useAskIntelligenceAgent/useCreateHarnessSession/useStreamAgentSession`, `useExecuteDevTool`, `useAddWorkspaceFolder`, `useFileWatchSnapshot/useApplyPatch/useHarnessFileEditor/useFileSearch`, `useGraphData/useVerificationReport/useExecuteInvestigation/useGenerateDossier/usePublicSources*/useCaptureWebSnapshot`, `useExecPolicy`, `useHardeningStatus/useApplyProcessHardening/useShellCommandSafety`, `useSecretsManager/useRedactSecretValue`, `useHooksSystem`, `useModelProviders/useModelProviderApiKey/useValidateModelProvider/useSetModelProviderApiKey/useSetModelProviderBase/useRemoveModelProvider/useProviderEnvStatus/useTestNvidiaNim`, `useResponseDebugContext/useDiagnostics/useLlmUsageStats/useResetLlmUsageStats`, `usePromptTemplates/usePromptTemplate/useReviewContext/useGoalBudgetPrompt`, `useHarnessGitInfo`, `useHarnessBrowser`.

### 2.5 Tipos-chave — `apps/web/src/modules/dev/harness/types.ts`

```ts
export interface AgentEvent { type: string; payload: any }   // espelha EventMsg do kaide (Done/Failed/TextDelta/ToolCall/...)
export interface ToolCallDeltaPayload { index: number; name?: string; args_delta: string }
export interface ApprovalRequest { id: string; tool: string; command?; description?; summary?; risk?; params?: Record<string, unknown> }
export type ApprovalDecision = 'allow' | 'deny' | 'allow_always' | 'allow_session' | 'allow_once'
export interface HarnessMemorySession { id: number; workspace?; title?; summary?; createdAt?/created_at?; updatedAt?; messageCount?/message_count?; model?; timestamp? }
export interface HarnessSessionMessage { id: number; sessionId: number; role: 'user'|'assistant'|'system'|'tool'; content: string; createdAt?/timestamp? }
export interface HarnessOverview { sessionsCount?; activeAgents?; skillsCount?; status?; repos? }
export interface DryRunResult { valid?; fileChanges?: PatchFileChange[]; conflicts?: string[]; summary?; changes? }
export interface PatchResult { success?; modifiedFiles?; backupPath?; error?; patch_id?; summary?; applied? }
export interface FileWatchSnapshot { events: FileChangeEvent[]; timestamp: string }  // FileChangeEvent{path, kind:'create'|'modify'|'remove'|'rename'}
export interface ExecPolicyData { rules: ExecPolicyRule[] }  // ExecPolicyRule{command, decision:'allow'|'prompt'|'forbidden', scope?}
export interface LlmUsageStats { totalTokens?/total_tokens?; promptTokens?; completionTokens?; totalCostUsd?/total_cost_usd?; call_count? }
// + tipos de OSINT/intelligence (RelationshipGraph, VerificationReport, InvestigationDossier, PublicSource, WebSnapshotResult)
```

### 2.6 `TauriRuntimeProvider` + approval inline

```tsx
interface TauriRuntimeContextValue {
  approvalRequest: ApprovalRequest | null;
  resolveApproval: (decision: 'allow_once' | 'allow_session' | 'deny') => void;
  approve: () => void;   // allow_once
  deny: () => void;
}
export function useTauriRuntimeContext()
```

Envolve `AssistantRuntimeProvider` (`@assistant-ui/react`, `useLocalRuntime(adapter)`). O adapter vem de `createTauriChatAdapter` (`apps/web/src/modules/dev/harness/tauri-chat-adapter.ts`) — **que hoje é um STUB de compatibilidade de build** (`sendMessage → {content:''}`). O approval UI real do Thread usa `ctx.approvalRequest` + `ctx.approve()/ctx.deny()`.

## 3. Componentes principais (`apps/web/src/modules/ai/components/`)

| Componente | Arquivo | Papel |
|---|---|---|
| `HarnessThread` | `Thread.tsx` (543 linhas, sem props — consome `useTauriRuntimeContext`) | Thread principal: seletores de Agente (coder/researcher/reviewer/planner), Modelo (NVIDIA NIM), Thinking (budgetTokens 0–16k), hero com STARTER_PROMPTS, persistência em localStorage (`chronokairo_ai_selected_*`), modal de approval inline |
| `HarnessTopBar` | `HarnessTopBar.tsx` | Breadcrumb "Dev / Harness IA", chip da sessão ativa (`activeSessionTitle?`), switcher Chat↔Preview (`viewMode`), badge runtime TAURI/WEB, contador de repos (`useHarnessOverview`) |
| `DevLayout` | `DevLayout.tsx` | Variante de shell com DevBrowserPanel (drawer lateral, theater mode) |
| `HarnessToolPanel` | `HarnessToolPanel.tsx` | Painel de tools executadas |
| `PatchPreviewPanel` | `PatchPreviewPanel.tsx` | Preview dry-run/aplicação de patch (usa `useApplyPatch`/dry-run) |
| `TerminalBottomPanel` | `apps/web/src/shared/components/dashboard/TerminalBottomPanel.tsx` | Terminal inferior (toggle via `useLayoutPanels.toggleBottomTerminal`, Ctrl+`) |
| `DevBrowserPanel` | `DevBrowserPanel.tsx` | Browser agente (drawer, viewMode 'preview') |
| Tabs Dev | `DevAgentesTab`, `DevAutomacoesTab`, `DevSkillsTab`, `DevMemoriaTab`, `DevSessoesTab`, `DevProjectsTab`, `DevToolboxTab`, `DevConfiguracoesTab` | Painéis por área (casos em page.tsx) |
| Outros | `ApprovalDialog`/`ApprovalModal`/`CapabilityConfirmation`, `ContextFragmentsPanel`, `DiagnosticsPanel`, `ExecPolicyPanel`, `FileSearchPanel`, `GitAttributionPanel`, `AiCommandPalette`, `AiChatInterface`, `ChatPanel`, `DevProjectSessionsSidebar`, `AiBrowserView` | Suporte |

## 4. Casca Tauri — estado ATUAL (verificado 2026-09-26)

- **`apps/desktop/`** é o app Tauri v2 (tauri.conf.json, capabilities, icons, gen) com workspace Cargo `members = ["core", "shell", "intelligence"]`.
- **`kaide-rs/shell/src/lib.rs`**: casca FINA. Registra `#[tauri::command] fn kaide_version() -> String` via `invoke_handler(generate_handler![kaide_version])` + `tauri_plugin_shell`. O comentário no arquivo registra o débito: *"o wiring detalhado dos comandos Tauri para as funções do kaide ainda será conectado incrementalmente"* (ADR-0005).
- **`kaide-rs/core`** é o crate `kaide` / binário `kaide` (núcleo zero-lib — ver `docs/maps/kaide-agent-tools-api.md` e `docs/maps/kaide-llm-server-api.md`).
- **`kaide-rs/intelligence`** tem `commands.rs` (16 `#[tauri::command]`) para OSINT/graph/dossier.
- **Consequência**: os comandos que o frontend espera (`stream_agent_session`, `interrupt_agent`, `resolve_approval`, `runtime_request` e os demais de `agentClient`/hooks) **ainda não estão registrados na casca** — em web retornam `available:false`; no desktop Tauri atual falham silenciosamente (catch → `available:false`). A casca antiga com 100+ comandos IPC está no histórico (branches `cli`/`desktop`), não neste checkout.
- O contrato esperado pelo frontend para a task supervision já existe no kaide: `protocol::Session` (Op/EventMsg), `app_server::runtime_api::call` (33 métodos) e `AppServer` (JSON-RPC stdio). O wiring é o gap.

## 5. Design system

- Tailwind (classes utilitárias; dark theme com `zinc-*`, `font-mono` para metadados).
- Componentes ui compartilhados em `apps/web/src/shared/components/ui/` (ex.: `button.tsx` — porta local).
- `@chronokairo/platform/ui` adotado apenas em `apps/web/src/modules/rag` (ThemeProvider/ThemeToggle/Button) — migração do shell/navegação é débito ADR-0005.
- Ícones: Material Symbols (`icon: 'psychology'` etc. em NAV_GROUPS).

## 6. Tela canônica de task supervision (D06/D07) — IMPLEMENTADA (2026-09-26)

`apps/web/src/modules/ai/components/TaskSupervisionScreen.tsx` + nav `tasks` (NAV_GROUPS, "Engenharia & Harness") + case em `apps/web/src/app/page.tsx`:

- Header: status derivado (`idle/running/attention/failed/complete`), session id, badge WEB/TAURI, worktree/checkpoint por task (via `agentClient` → `runtime_request`).
- Corpo: timeline de eventos (`AgentEvent.type` = `EventMsg` do kaide), subagentes (fan-out `[task i/N]`), checks (`Verification`), arquivos alterados (`FileChanged`), tokens agregados.
- Approvals inline (allow_once/allow_session/deny via `useStreamAgentSession().resolveApproval`); interrupção via `interrupt()`.
- Worktrees/checkpoints: `create_task_worktree`/`list_task_worktrees`/`remove_task_worktree`/`create_checkpoint`/`restore_checkpoint`/`list_checkpoints` no runtime_api do `kaide`.
- Diff/patch: `PatchPreviewPanel` embutido.

Receita original (para próximas telas): novo id em `NAV_GROUPS` + case em `apps/web/src/app/page.tsx`; estado derivado de `useStreamAgentSession().events`; sessões duráveis via `create_harness_session`/`get_harness_memory_sessions`.
