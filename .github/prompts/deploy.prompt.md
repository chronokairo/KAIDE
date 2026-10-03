---
description: Deploy - promove versão por DEV e STAGING; produção só com aprovação humana.
agent: devops
---

Faça o deploy de: ${input:versao:versão, tag ou commit}

1. Confirme que o QA deu `PASS` para essa versão.
2. Deploy em DEV; verifique `/health`, `/ready` e `/version`.
3. Deploy em STAGING; repita as verificações e anexe evidências.
4. Prepare e valide o plano de rollback.
5. **Pare e peça aprovação humana explícita** antes de produção.
6. Só com a aprovação registrada no Job, promova para PRODUCTION e monitore.
