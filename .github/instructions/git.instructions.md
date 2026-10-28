---
applyTo: "**"
---

# Git, GitHub & GitLab (Organização Chronokairo)

Os agentes têm acesso e devem operar sobre os repositórios da organização/grupo **`chronokairo`** no GitHub e GitLab:

## Repositórios & Organizações Oficiais

| Plataforma | Namespace / URL | CLI | Finalidade |
| :--- | :--- | :---: | :--- |
| **GitHub** | [`https://github.com/chronokairo`](https://github.com/chronokairo) | `gh` | Repositórios principais, automações do Copilot e PRs |
| **GitLab** | [`https://gitlab.com/chronokairo`](https://gitlab.com/chronokairo) | `glab` | Repositórios legados, espelhos/backup, CI/CD e core Rust (`cli`) |

### Repositórios Ativos
- **Harness & AI (`chronokairo/kaide`):**
  - GitHub: `https://github.com/chronokairo/kaide.git` (remote `origin`)
  - GitLab: `https://gitlab.com/chronokairo/kaide.git` (remote `gitlab`)
- **Core Rust Zero-Lib (`kaide-rs/core`, ex-`chronokairo/cli`, repo deletado):**
  - Vive em `kaide-rs/core` neste monorepo (crate e binário `kaide`)
- **Projetos de Clientes & Satélites:**
  - `chronokairo/audiomed`: `https://gitlab.com/chronokairo/audiomed.git`
  - `chronokairo/chronokairo.github.io`: `https://github.com/chronokairo/chronokairo.github.io.git`

## Regras de Execução dos Agentes

- Nunca commitar direto em `main`: crie branch por Job (`job/<tipo>-<id>`).
- Sincronização: Todo push relevante em `main` deve ser enviado ao `origin` (GitHub) e espelhado no `gitlab` (GitLab).
- Abertura de PR / MR:
  - Coder gera a branch, roda testes e abre PR via `gh pr create` ou MR via `glab mr create`.
  - QA revisa com abordagem adversarial antes de qualquer aprovação.
- Merge exige validação de QA (`PASS`) e aprovação humana explícita.
- Não usar `push --force` em branches públicas nem apagar branches remotas sem autorização.
- Alterações no núcleo Rust do agente (`kaide`) pertencem a `kaide-rs/core` neste monorepo.
