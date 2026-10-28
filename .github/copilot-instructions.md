# Kaide — Harness da empresa virtual de agentes

Este repositório (`chronokairo/kaide`) é o **harness**: o sistema operacional dos agentes da Chronokairo. As regras completas estão em [`AGENTS.md`](../AGENTS.md) e nas [ADRs](../docs/adr/). Leia-os antes de alterar código.

## Infraestrutura & Organizações Oficiais

| Recurso | Namespace / Identificador | CLI | Papel |
| :--- | :--- | :---: | :--- |
| **GitHub Org** | [`https://github.com/chronokairo`](https://github.com/chronokairo) | `gh` | Repositórios centrais, automações do Copilot App, issues e pull requests |
| **GitLab Group** | [`https://gitlab.com/chronokairo`](https://gitlab.com/chronokairo) | `glab` | Espelhos de contingência, repositório `cli` (núcleo Rust `kaide`) e pipelines |
| **Supabase (Dev)** | `your-dev-project-ref` (`chronokairo-dev`) | `supabase` | Banco PostgreSQL, pgvector e autenticação do ambiente de desenvolvimento |
| **Supabase (Prod)**| `your-project-ref` (`chronokairo-prod`) | `supabase` | Banco PostgreSQL e armazenamento de produção (Human Gate obrigatório) |

## Identidade Visual & UI (Three.js 8-bit Minimalista)

- A interface é um adapter primário de acompanhamento Three.js.
- Estilo: **Minimalista 8-bit preto e branco / monochrome retro terminal**, com avatares anime chibi para cada cargo (`public/anime_8bit_sprites.jpg`).

## Papéis

| Peça | Papel |
| --- | --- |
| **Copilot App → Automations** | Gatilho (horário, evento de issue/PR). Só diz *quando* e *qual job*. Não contém lógica de negócio. |
| **Custom agents** (`.github/agents/`) | Capacidades: *o que* cada papel sabe fazer. |
| **Harness (este repo)** | Governa a execução: jobs, contexto, permissões, ordem, aprovação, auditoria, retry. |
| **Supabase / PostgreSQL** | Estado, jobs, eventos e auditoria. |
| **GitHub & GitLab** | Código, branches, PRs e issues. |

Uma automação deve ser pequena: *"execute o job `<tipo>`"*. O harness decide repositórios, tarefas, contexto e permissões.

## Regras que valem sempre

- Modelo operacional: **AI → AI → AI → HUMAN**, nunca AI → produção. Fluxo: `plan → execute → verify → evidence → approval → merge/deploy`.
- Todo trabalho é um `Job` (tipo, agente, repositório, projeto, entrada, contexto, permissões, status, tentativas, resultado) com eventos append-only.
- Dinheiro real, produção, ações destrutivas e irreversíveis exigem aprovação humana explícita do Diretor Técnico.
- Ferramentas de escrita: autenticação, `organizationId` validado no servidor, permissão específica, validação de entrada, idempotência e auditoria. O modelo nunca amplia permissões.
- Segredos só no backend. Nunca em prompts, issues, PRs ou logs.
- Arquitetura hexagonal: `domain` puro → `application/ports` → `application/use-cases` → `infrastructure`. Detalhes no `AGENTS.md`.
- Comandos via **npm**: `npm run typecheck`, `npm test`, `npm run build`. Não use pnpm/yarn.
- Next.js neste repo tem mudanças que quebram o que você conhece; consulte `node_modules/next/dist/docs/` antes de escrever código Next.

## Onde está cada coisa

- `.github/agents/` — um arquivo `*.agent.md` por papel (commercial, analyst, product, coder, qa, devops, support, finance).
- `.github/instructions/` — regras por tema, aplicadas por `applyTo` (arquitetura, segurança, git, operação).
- `.github/prompts/` — prompts reutilizáveis (`discover`, `implement`, `review`, `deploy`).
- [`docs/copilot-automations.md`](../docs/copilot-automations.md) — catálogo das automações a criar no Copilot App.
- `public/anime_8bit_sprites.jpg` — spritesheet dos funcionários em 8-bit preto e branco.
