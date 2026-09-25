# Índice de Serviços Fundacionais do Pipeline Anamnesic

Este documento serve como referência rápida para localização e status dos serviços críticos de segurança e rastreabilidade do pipeline.

| Serviço             | Localização                                 | Status         |
|---------------------|---------------------------------------------|---------------|
| ActionLogService    | core/services/ActionLogService.ts           | Implementado   |
| SnapshotService     | core/services/SnapshotService.ts            | Implementado   |
| RollbackService     | core/services/RollbackService.ts            | Implementado   |
| safePath            | core/utils/safePath.ts                      | Implementado   |
| Dry-run Mode        | core/services/SnapshotService.ts / pipeline | Parcial        |

## Observações
- Todos os serviços estão exportados no barrel `core/index.ts`.
- Testes unitários presentes em `__tests__`.
- Para rastreabilidade e critérios de aceite, consulte também:
  - `architecture/PIPELINE_SAFETY_NET.md`
  - `docs/`
  - `QA_VALIDATION_INDEX.md`

---

**Atualizado por Troubleshooter — Anamnesic**
