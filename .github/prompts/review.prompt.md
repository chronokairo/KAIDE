---
description: Revisão de PR - QA adversarial com veredito PASS ou FAIL.
agent: qa
---

Revise o PR: ${input:pr:número ou URL do PR}

1. Leia os requisitos e critérios de aceitação ligados ao PR.
2. Rode `npm run typecheck`, `npm test` e `npm run build`.
3. Tente quebrar: casos de borda, tenant/RBAC, idempotência, validação de entrada, segurança.
4. Crie os testes que faltam.
5. Responda com `PASS` ou `FAIL`, achados por severidade e evidências.
6. Em `FAIL`, devolva ao Coder com passos de reprodução. Em `PASS`, peça aprovação humana.
