# ADR 0018 — Absorção do Agent Control Center / Dashboard (Governância & Runtime)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time Chronokairo
- **Tags:** `dashboard`, `governance`, `runtime`, `spec-lock`, `audit`, `policy`, `consolidacao`

---

## Contexto

O repositório `anamnesic/anamnesic-core` continha o dashboard central de controle de agentes com 15 visões operacionais completas:
- Gestão de agentes e workflows (`AgentsView`, `RuntimeView`).
- Bloqueio de especificação e conformidade (`SpecLockView`).
- Aprovações humanas no loop e auditoria (`ApprovalsView`, `AuditView`, `PolicyView`).
- Gestão de canais e gateway (`ChannelsView`, `GatewayView`, `CronView`).
- Monitor de ferramentas e memória (`ToolsView`, `MemoryView`, `ModelsView`).

## Decisão

1. Absorver os componentes visuais e de dados em `chronokairo-ai/src/modules/governance/dashboard`.
2. Integrar as visões ao módulo de governança do Chronokairo (`@chronokairo/ai/governance`).
3. Deletar o repositório remoto redundante `anamnesic/anamnesic-core`.
