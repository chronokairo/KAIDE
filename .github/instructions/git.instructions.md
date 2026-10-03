---
applyTo: "**"
---

# Git

- Nunca commitar direto em `main`: branch por Job (`job/<tipo>-<id>`), PR com plano, alterações, testes e evidências.
- Commits pequenos, em português, com prefixo convencional (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Merge só após QA `PASS` e aprovação humana.
- Não reescrever histórico publicado, não usar `push --force` em branches compartilhadas.
- Não apagar branches sem confirmação explícita.
- Núcleo Rust `ckc`: mudanças vão para `chronokairo/cli`, não para este repo.
- Remote padrão: `origin` (`https://gitlab.com/chronokairo/ai.git`).
