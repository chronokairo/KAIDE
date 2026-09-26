# ADR-0012 — Audit trail com redação de argumentos

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

Quem automatiza o navegador precisa saber o que foi executado (e se falhou), sem capturar
segredos (senhas digitadas, tokens, corpos de requisição).

## Decisão

Todo handler de tool passa pelo wrapper central (`patchTool`), que registra cada chamada
em `~/.browser-mcp-audit.jsonl` (JSON Lines):

```json
{ "ts": "...", "tool": "dom_type", "args": { "selector": "input", "value": "[REDACTED]" }, "ok": true, "ms": 12 }
```

- Redação automática de chaves sensíveis (`pass|token|secret|key|authorization|cookie|
  api[_-]?key|base64|body`) → `[REDACTED]`; strings acima de 500 chars são truncadas.
- `audit_status { limit? }` lê as últimas N entradas (sem expor o arquivo inteiro).
- Gravação com `appendFileSync` e `try/catch` (falha de disco não derruba a tool).

## Consequências

- Positivas: rastreabilidade de sessão (quem/o quê/quando/resultado); base para
  depuração e conformidade; zero mudança nos handlers existentes.
- Negativas: o arquivo pode crescer (aceito para uso local); redação pode esconder dados
  úteis (trocadilho aceito); a gravação é síncrona (overhead mínimo por chamada).
