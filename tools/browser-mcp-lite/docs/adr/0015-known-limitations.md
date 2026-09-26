# ADR-0015 — Limitações conhecidas e decisões de não-fazer

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

Este registro consolida as fronteiras deliberadas do projeto: o que **não** foi feito e
por quê, para evitar retrabalho e alinhar expectativas.

## Decisões de não-fazer

| Item (TODO) | Motivo |
|---|---|
| Eventos trusted via CDP (`debugger`) | Amplia superfície de segurança; princípio minimal (ver ADR-0004). |
| Download via `chrome.downloads` | Exige permissão `downloads` no manifest; `dom_download` cobre o caso logado. |
| Múltiplos navegadores/perfis (Edge/Firefox) | A extensão é Chrome-only; suportar outros navegadores exigiria outra base. |
| Múltiplos servidores/extension sockets | Bridge é de socket único por servidor. |
| SSE além de Streamable HTTP | Clientes modernos (opencode, IDEs) usam Streamable HTTP; SSE é legado. |
| Device-flow/OAuth para a extensão | Complexidade alta, benefício local baixo; token manual é suficiente. |
| Sandbox real para `inject_script` | Não há isolamento real no MAIN world; mitigamos com permissão `ask` no opencode + redação no audit. |
| Allowlist por projeto | O servidor é global e não identifica o projeto chamador (ADR-0011). |
| Streaming de eventos (notificações MCP) | O TUI do opencode não consome; custo alto para ganho atual. |

## Limitações conhecidas

- `page_log`/`network_har` reiniciam o buffer na navegação (MAIN world recria).
- `screenshot_diff` compara o viewport visível (não a página rolada).
- `dom_*` sintéticos não passam por sites que exigem `isTrusted`.
- Recursos `page://active`/`tabs://list` exigem extensão conectada.
- `create_window { incognito }` exige habilitação manual da extensão no modo anônimo.

## Critério de reversão

Qualquer item acima volta à mesa se aparecer uma demanda concreta (issue real do usuário)
— especialmente eventos trusted e allowlist por projeto.
