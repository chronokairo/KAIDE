# Anamnesic — Diagnóstico Final Troubleshooter

## Diagnóstico

Após análise do feedback do PM e da estrutura do workspace, identifiquei os seguintes problemas críticos:

1. **Faltava documentação centralizada de arquitetura e organização do pipeline** para rastreabilidade e governança.
2. **Requisitos fundacionais (P0) não estavam documentados de forma rastreável** para agentes e automação.
3. **Não havia um índice de serviços críticos implementados** (ActionLogService, SnapshotService, RollbackService, safePath, Dry-run), dificultando rastreamento e auditoria.
4. **Faltava um arquivo de arquitetura de segurança e safety net** para garantir conformidade com REQ-01 a REQ-07.

## Correções Aplicadas

- Criei `architecture/PIPELINE_SAFETY_NET.md` documentando:
  - Serviços fundacionais (ActionLog, Snapshot, Rollback, safePath, Dry-run)
  - Critérios de aceitação e exemplos
  - Fluxo de snapshot/log/rollback
  - Referências para implementação e testes

- Criei `architecture/PIPELINE_INDEX.md` com índice dos serviços críticos, localização dos arquivos e status de implementação.

## Arquivos criados/corrigidos

- `architecture/PIPELINE_SAFETY_NET.md`
- `architecture/PIPELINE_INDEX.md`

---

# architecture/PIPELINE_SAFETY_NET.md

## Pipeline Safety Net — Fundacional

### Serviços Críticos

- **ActionLogService** — Log estruturado de todas as ações de tools (REQ-01)
- **SnapshotService** — Snapshot automático antes de qualquer modificação (REQ-02)
- **RollbackService** — Rollback para restaurar estado anterior (REQ-03)
- **Dry-run Mode** — Simulação sem efeitos colaterais (REQ-04)
- **safePath** — Proteção path traversal centralizada (REQ-07)

### Critérios de Aceitação

- Toda tool call gera entrada no log (JSONL)
- Snapshot ocorre antes de qualquer escrita/deleção
- Rollback restaura arquivos modificados, deleta criados, restaura deletados
- Dry-run não altera arquivos, apenas simula
- safePath bloqueia path traversal em todos os contextos

### Fluxo Resumido

1. **Antes de modificar arquivos:**
   - Chama `SnapshotService` para snapshot do estado atual
   - Chama `ActionLogService` para registrar intenção
2. **Execução:**
   - Se `dry-run`, apenas simula e mostra diff
   - Se real, executa ação
3. **Rollback:**
   - Usa `RollbackService` para restaurar snapshot

### Referências de Implementação

- `core/services/ActionLogService.ts`
- `core/services/SnapshotService.ts`
- `core/services/RollbackService.ts`
- `core/utils/safePath.ts`

### Testes

- Testes unitários em `__tests__/ActionLogService.test.ts`, `__tests__/SnapshotService.test.ts`, `__tests__/RollbackService.test.ts`
- Cobertura mínima: 80%

---

# architecture/PIPELINE_INDEX.md

## Índice de Serviços Fundacionais do Pipeline

| Serviço             | Localização                                 | Status         |
|---------------------|---------------------------------------------|---------------|
| ActionLogService    | core/services/ActionLogService.ts           | Implementado   |
| SnapshotService     | core/services/SnapshotService.ts            | Implementado   |
| RollbackService     | core/services/RollbackService.ts            | Implementado   |
| safePath            | core/utils/safePath.ts                      | Implementado   |
| Dry-run Mode        | core/services/SnapshotService.ts / pipeline | Parcial        |

### Observações
- Todos os serviços estão exportados no barrel `core/index.ts`.
- Testes unitários presentes em `__tests__`.
- Para garantir rastreabilidade, consulte também `docs/` e `QA_VALIDATION_INDEX.md`.

---

**Troubleshooter — Anamnesic**
