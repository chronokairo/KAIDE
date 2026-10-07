# Chronokairo Company Autopilot

Equipe mínima ativa da Chronokairo no GitHub Copilot App: **comercial, security e payment**, com modelos NVIDIA já cadastrados e execução apenas de madrugada em America/Manaus.

- Comercial: diariamente às 01:00; prospecção, cadastro real de leads e correções do CRM.
- Security: segunda-feira às 00:00; auditoria semanal.
- Payment: diariamente às 02:00; oportunidades em cripto, carteira de teste e simulação de trades, sem operação financeira real.

Instalação e limites: [equipe mínima](.copilot/minimal-team/README.md). Decisão: [ADR 0001](docs/adr/0001-minimal-night-team.md), [log de ADRs](docs/ADR_LOG.md). Os scripts e perfis da equipe completa são históricos; seu instalador global não define a configuração ativa.

Este repositório unifica ~/Documents/GitHub/env e ~/.copilot/chronokairo. A fonte canônica fica aqui; o diretório de execução em ~/.copilot/chronokairo aponta para .copilot/chronokairo por symlink.

- [Configuração e operação](.copilot/chronokairo/README.md)
- [Instalação local](.copilot/chronokairo/install.py)
- [Agentes e automações](.copilot/chronokairo/configure.py)
- [Catálogo, projetos e documentos](.copilot/chronokairo/company.py)
- [Delegação ACP](.copilot/chronokairo/acp.py)
- [Ponte ACP para agy](.copilot/chronokairo/agy_acp.py)

Credenciais, .env, bancos do app, backups, histórico de jobs, worktrees e dependências instaladas ficam fora do Git. O repositório preserva código e configuração reproduzível; dados operacionais continuam privados nesta máquina.
