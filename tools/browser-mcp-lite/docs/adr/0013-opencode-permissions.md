# ADR-0013 — Permissões por tool no opencode

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

O opencode tem um sistema de permissão por chamada de tool MCP. Com 42 tools, pedir
aprovação para tudo paralisa a automação; liberar tudo remove controle.

## Decisão

No `opencode.jsonc` global:

```jsonc
"permission": {
  "mcp__browser__*": "allow",
  "mcp__browser__inject_script": "ask",
  "mcp__browser__dom_fetch": "ask",
  "mcp__browser__dom_download": "ask",
  "mcp__browser__screenshot": "ask"
}
```

A convenção de nomes é `mcp__<server>__<tool>` (servidor `browser`). Regras específicas
sobrepõem o wildcard (last-match-wins): navegação/leitura/cliques são automáticos; as
quatro ações de maior superfície (`inject_script`, `dom_fetch`, `dom_download`,
`screenshot`) pedem confirmação explícita a cada uso.

## Consequências

- Positivas: fluxo fluido para 38/42 tools; guarda nas 4 de maior risco; padrão
  documentado para o usuário auditar.
- Negativas: `ask` por chamada adiciona atrito em fluxos longos que usam muito
  `dom_fetch`; o opencode precisa reiniciar para aplicar mudanças na config.
