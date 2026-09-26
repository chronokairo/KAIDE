# ADR-0009 — MCP resources

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

O protocolo MCP permite expor "resources" (dados lidos sob demanda) além de tools
(ações). Clientes que listam resources ganham atalhos de contexto sem executar tools.

## Decisão

Usar `server.registerResource` do SDK (`@modelcontextprotocol/sdk`) para expor três
resources estáticos (sem template):

- `page://active` — árvore de acessibilidade da aba ativa (mesma fonte de `read_page`).
- `tabs://list` — lista de abas abertas (mesma fonte de `list_tabs`).
- `server://status` — estado do servidor: extensão conectada?, allowlist (modo+domínios),
  pasta de downloads, caminho do audit trail, estado do record/replay.

Os `readCallback` chamam `sendToExtension`/estado interno e devolvem
`{ contents: [{ uri, mimeType, text }] }`.

## Consequências

- Positivas: clientes que suportam resources (ex.: alguns hosts/IDEs) têm contexto
  imediato; custo zero (reuso das tools existentes).
- Negativas: recursos dependem da extensão conectada (erro em `page://active`/
  `tabs://list` sem extensão); o TUI do opencode não expõe resources — o valor aparece
  em outros clientes MCP.
