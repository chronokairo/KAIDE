# ADR-0010 — Record/replay de sessão

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

Reproduzir uma sequência de ações do navegador (ex.: reaplicar um fluxo de cadastro,
regenerar um teste) sem reescrever a automação.

## Decisão

Gravação centralizada no servidor: como todo handler de tool passa por um wrapper
(`patchTool` em `tools.js`), as chamadas bem-sucedidas são capturadas quando a gravação
está ativa.

- `session_record { active }` — liga/desliga a gravação em memória.
- `session_replay` — re-executa a sequência gravada chamando os **mesmos handlers
  registrados** (repassa guard de allowlist, validações e retorna o texto de cada
  resultado), com `replaying` para não regravar.
- `session_script` — exporta a sequência como JSON `[{tool, args}, ...]` (executável
  manualmente via CLI/script).

Tools de metadados (`audit_*`, `session_*`, `allowlist_status`) são excluídas da
gravação; args sensíveis não entram no replay (não foram gravados — ver ADR-0012).

## Consequências

- Positivas: replay determinístico reutilizando os próprios handlers; sem estado
  persistente (buffer em memória).
- Negativas: gravação em memória some ao reiniciar o servidor; o replay é sequencial
  (sem paralelismo); depende de estado do navegador atual (se o navegador mudou, o
  replay pode divergir).
