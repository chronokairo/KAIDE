---
applyTo: "src/**/*.{ts,tsx}"
---

# Arquitetura (Hexagonal Pura)

- `apps/web/src/domain/`: entidades e regras puras. Sem React, Next, Express, Supabase ou SDKs.
- `apps/web/src/application/ports/`: contratos de entrada e saída.
- `apps/web/src/application/use-cases/`: orquestração dependendo apenas de portas.
- `apps/web/src/infrastructure/`: adapters concretos (`ui`, `http`, `tauri`, `llm`, `identity`, `credentials`, `secrets`, `audit`).
- Dependências apontam para dentro: infrastructure → application → domain. Nunca o contrário.
- A UI (`apps/web/src/infrastructure/ui/`) é Three.js somente de acompanhamento; consome casos de uso por hooks/portas e não faz `fetch()`/`invoke()` direto em JSX.
- Legados (`apps/web/src/modules/*`, `apps/web/src/server/rag/*`): migrar só quando for preciso mexer neles. Sem reescrita cega.
- Não acessar diretamente o banco de outro produto; use contratos versionados.
