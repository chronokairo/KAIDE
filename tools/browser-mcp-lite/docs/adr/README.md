# ADRs — browser-mcp-lite

Registro de Decisões de Arquitetura (ADR). Cada ADR documenta uma funcionalidade
ou decisão adicionada ao projeto, com contexto, decisão e consequências.

## Índice

- **Arquitetura**
  - [0001 — Extensão Chrome + servidor MCP remoto (bridge WebSocket)](0001-extension-remote-server.md)
  - [0014 — Auto-start do servidor e sincronização de token](0014-auto-start-token-sync.md)
- **Interação**
  - [0002 — Auto-wait e interações DOM determinísticas](0002-auto-wait-dom-actions.md)
  - [0003 — Clique sem seletor: texto e role](0003-click-by-text-and-role.md)
  - [0004 — Drag & drop e limitação de eventos trusted](0004-drag-drop-trusted-events.md)
- **Observabilidade**
  - [0005 — page_log, network_har e watch_page](0005-observability.md)
  - [0006 — Screenshot diff com OffscreenCanvas](0006-screenshot-diff.md)
- **Gestão do navegador**
  - [0007 — Abas e janelas múltiplas (incl. incognito)](0007-tabs-windows.md)
  - [0008 — Download via contexto da página](0008-download-via-page-context.md)
- **Protocolo MCP**
  - [0009 — MCP resources](0009-mcp-resources.md)
  - [0010 — Record/replay de sessão](0010-session-record-replay.md)
- **Segurança**
  - [0011 — Allowlist de domínios](0011-domain-allowlist.md)
  - [0012 — Audit trail com redação de argumentos](0012-audit-trail.md)
  - [0013 — Permissões por tool no opencode](0013-opencode-permissions.md)
  - [0015 — Limitações conhecidas e decisões de não-fazer](0015-known-limitations.md)

Formato: [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) (Michael Nygard).
