# Contribuindo — Chronokairo

Este guia define o padrão de todos os repositórios do grupo
[`chronokairo`](https://gitlab.com/chronokairo) no GitLab.

## Antes de começar

1. Confirme que a mudança cabe no escopo deste repositório. Se precisar
   mexer em outro repo do grupo, abra issue aqui antes com o vínculo.
2. Verifique se já existe issue ou MR aberta para o mesmo assunto.
3. Este código é **proprietário** (ver [`LICENSE`](LICENSE)). Não redistribua,
   publique nem use fora da Chronokairo.

## Fluxo de trabalho

A branch padrão é **protegida** e não aceita push direto.

```bash
# 1. Branch topical a partir da branch padrão
git switch -c feat/minha-mudanca

# 2. Commits seguindo Conventional Commits
git add -A && git commit

# 3. Publica e abre o MR pela CLI
git push -u origin feat/minha-mudanca
glab mr create --fill \
  --title "feat(escopo): resumo da mudança" \
  --description "O que muda, por quê e como validar." \
  --target-branch main --remove-source-branch
```

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
`tipo(escopo): descrição`.

| Tipo | Uso |
| :--- | :--- |
| `feat` | funcionalidade nova |
| `fix` | correção de bug |
| `docs` | documentação |
| `refactor` | mudança de estrutura sem alterar comportamento |
| `perf` | performance |
| `test` | testes |
| `build`, `ci` | build e pipeline |
| `chore` | manutenção sem impacto de código |
| `revert` | reversão |

Regras:

- Escopo é opcional, curto, minúsculas e sem espaço: `feat(auth)`, `fix(ui)`.
- Descrição no imperativo, sem ponto final, até ~72 caracteres.
- O corpo explica **por quê** quando a mudança não for óbvia.
- Referencie issue ou ADR no corpo: `Closes #123`, `Refs: ADR-0027`.
- **Um commit faz uma coisa.** Não misture refactor com mudança de
  comportamento no mesmo commit.

## Branches

| Padrão | Uso |
| :--- | :--- |
| `main` / `master` | Branch padrão, protegida, sempre em estado released |
| `feat/`, `fix/`, `refactor/`, `docs/`, `chore/` | prefixadas pelo tipo |
| `claude/`, `ck/` | branch de trabalho assistido por agente |

## Merge requests

- Abra MR mesmo para mudanças pequenas; push direto na branch padrão é
  bloqueado.
- Título no formato de Conventional Commits, igual ao commit.
- Descreva: **o que** muda, **por quê**, **como validar**.
- Marque **Draft** enquanto não estiver pronto para revisão.
- Auto-merge só com pipeline verde e ao menos uma aprovação.
- Resolva todos os comentários antes de mergear.

## Checklist antes de pedir revisão

- [ ] `README.md` atualizado se mudou setup, uso ou arquitetura pública
- [ ] `CHANGELOG.md` recebeu entrada em `## [Não lançado]`
- [ ] Commits seguem Conventional Commits
- [ ] Sem segredos, credenciais, `.env` ou dados de cliente no diff
- [ ] Lint, typecheck e testes passam localmente
- [ ] Mudança de contrato ou arquitetura registrada em `docs/adr/`

## Decisões de arquitetura

Mudanças estruturais — novo repo, mudança de contrato entre repos, escolha de
tecnologia, depreciação — não são MRs comuns. São **ADRs** em `docs/adr/`,
indexados em `docs/ADR_LOG.md`. Siga o formato já usado no repositório e peça
revisão de arquitetura.

## Problemas de segurança

Não abra issue pública. Veja [`SECURITY.md`](SECURITY.md).

## Código de conduta

Participação sujeita ao [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
