---
applyTo: "**"
---

# Operação

- Todo trabalho é um `Job` com status, tentativas, custo, duração, ferramentas usadas, alterações, testes e evidências. Eventos são append-only.
- Fluxo obrigatório: `plan → execute → verify → evidence → approval → merge/deploy`.
- Ambientes: `DEV → STAGING → aprovação humana → PRODUCTION`.
- Retry: no máximo 3 tentativas com backoff; após isso, marcar o Job como `failed` e escalar para humano.
- Jobs devem ser idempotentes: reexecutar com a mesma chave não pode duplicar efeitos.
- Verificação antes de concluir: `npm run typecheck`, `npm test`, `npm run build`.
- Endpoints obrigatórios: `GET /health`, `GET /ready`, `GET /version`.
- Dinheiro real e produção: sempre pedir aprovação e registrar quem aprovou.
