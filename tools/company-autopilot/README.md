# Chronokairo Company Autopilot

Agentes e automações da Chronokairo no GitHub Copilot App, com modelos NVIDIA NIM, trabalho diário em GitHub/GitLab, backends ACP e relatórios no Desktop.

Este repositório unifica ~/Documents/GitHub/env e ~/.copilot/chronokairo. A fonte canônica fica aqui; o diretório de execução em ~/.copilot/chronokairo aponta para .copilot/chronokairo por symlink.

- [Configuração e operação](https://github.com/chronokairo/chronokairo/tree/main/scripts/company-autopilot) (privado)
- [Instalação local](https://github.com/chronokairo/chronokairo/tree/main/scripts/company-autopilot) (privado)
- [Agentes e automações](.copilot/chronokairo/configure.py)
- [Catálogo, projetos e documentos](.copilot/chronokairo/company.py)
- [Delegação ACP](.copilot/chronokairo/acp.py)
- [Ponte ACP para agy](.copilot/chronokairo/agy_acp.py)

Credenciais, .env, bancos do app, backups, histórico de jobs, worktrees e dependências instaladas ficam fora do Git. O repositório preserva código e configuração reproduzível; dados operacionais continuam privados nesta máquina.
