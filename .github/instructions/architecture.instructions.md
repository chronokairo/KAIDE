---
applyTo: "src/**/*.{ts,tsx}"
---

# Arquitetura (Hexagonal Pura)

- `src/domain/`: entidades e regras puras. Sem React, Next, Express, Supabase ou SDKs.
- `src/application/ports/`: contratos de entrada e saída.
- `src/application/use-cases/`: orquestração dependendo apenas de portas.
- `src/infrastructure/`: adapters concretos (`ui`, `http`, `tauri`, `llm`, `identity`, `credentials`, `secrets`, `audit`).
- Dependências apontam para dentro: infrastructure → application → domain. Nunca o contrário.
- A UI (`src/infrastructure/ui/`) é Three.js somente de acompanhamento; consome casos de uso por hooks/portas e não faz `fetch()`/`invoke()` direto em JSX.
- Legados (`src/modules/*`, `src/server/rag/*`): migrar só quando for preciso mexer neles. Sem reescrita cega.
- Não acessar diretamente o banco de outro produto; use contratos versionados.
