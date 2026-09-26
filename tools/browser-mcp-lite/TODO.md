# Roadmap 2026 — browser-mcp-lite

Meta: maximizar o uso da IA com o navegador real (DOM ao vivo, sessões logadas, automação determinística).

Legenda: `[x]` feito · `[ ]` planejado

## Interação (estilo Playwright, no browser real)
- [x] **Auto-wait** — `wait_for`: aguarda seletor, texto ou rede ociosa antes de agir (timeout configurável)
- [x] **Ações DOM** — `dom_scroll`, `dom_hover`, `dom_type`, `dom_press_key`, `dom_check`, `dom_select`
- [x] **Clique por texto** — `dom_click_text` (getByText/getByRole simplificado, sem depender de seletor)
- [x] **Seleção por role** — `dom_click_role` (getByRole com name e index)
- [x] **Drag & drop** — `dom_drag_drop` (eventos HTML5 DnD entre seletores)
- [ ] Gestos (wheel, pinch) e eventos trusted
- [ ] Download capturado via `chrome.downloads` (sem depender de fetch na página)

## Observabilidade
- [x] **page_log** — console (log/warn/error), erros JS, unhandled rejections e network (fetch) capturados por aba
- [x] **HAR completo** — `network_har`: fetch + XHR com status, headers, timings e corpos (limitados)
- [x] **Screenshot diff** — `screenshot_diff`: baseline + % de diferença, bbox e imagem de diff (OffscreenCanvas)
- [x] **watch** — `watch_page`: espera mudança no DOM/URL (poll de mutações) em vez de condição fixa
- [ ] Streaming de eventos ao servidor (notificações MCP) em vez de polling

## Gestão do navegador
- [x] **Abas** — `close_tab`, `duplicate_tab`
- [x] **Janelas múltiplas** — `list_windows`, `create_window` (com incognito), `close_window`, `merge_windows`
- [ ] Múltiplos navegadores (Edge/Firefox) e perfis persistentes
- [x] **Incognito por janela** — via `create_window {incognito}` (exige extensão habilitada no modo anônimo)
- [x] **Record/replay de sessão** — `session_record` / `session_replay` / `session_script` (sequência de ações executável)

## Protocolo & configuração
- [x] **Permissões por tool no opencode** — `mcp__browser__*` allow + `ask` para `inject_script`, `dom_fetch`, `screenshot`
- [x] **MCP resources** — `page://active`, `tabs://list`, `server://status` (além de tools)
- [x] **Allowlist de domínios** — `~/.browser-mcp-allowlist.json` (modo allow/allowlist/deny) restringe navegação, `dom_fetch` e `dom_download`
- [ ] Allowlist por projeto (servidor global não sabe qual projeto chamou)
- [ ] **Login da extensão sem token manual** — device-flow/OAuth local
- [ ] SSE (além de Streamable HTTP) para clientes legados

## Segurança
- [x] Aviso de risco em `inject_script` (padrões de rede/storage/cookies)
- [ ] Sandbox para `inject_script`/`dom_fetch` (executar com allowlist de APIs)
- [x] **Auditoria/log de ações executadas** — `~/.browser-mcp-audit.jsonl` (tool, args redigidos, ok/erro, ms) + `audit_status`
