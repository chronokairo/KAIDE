# Equipe mínima para teste

Configuração ativa conforme ADR 0005 (2026-10-20; versionada no kaide em 2026-10-21): seis agentes — `comercial`, `security`, `payment`, `vigia`, `radar` e `briefing`. O catálogo completo anterior é histórico; não executar o instalador global `configure.py`/`install.py` para esta equipe.

| Agente | Agenda em America/Manaus | Escopo |
| --- | --- | --- |
| comercial | Diário, 01:00 | Prospecção, persistência verificada de leads no monorepo GitHub chronokairo/chronokairo (apps/crm) e correções do CRM em branch própria |
| security | Segunda-feira, 00:00 | Triagem semanal e revisão aprofundada rotativa dos namespaces autorizados |
| payment | Diário, 02:00 | Oportunidades em cripto, carteira local/testnet e simulação de trade |
| vigia | Diário, 03:00 | CI, dependências, PRs travados, issues e health checks de produção; corrige só quebras triviais em branch própria |
| radar | Diário, 04:00 | Triagem de issues, PRs externos e comunidade nos repositórios públicos; só rascunha respostas |
| briefing | Diário, 05:00 | Consolida os relatórios da madrugada e o estado do GitHub em um briefing único |

O teste payment não executa operações financeiras reais. Carteira de mainnet, custódia, trade e transferência de ativos reais permanecem com o dono. As permissões de shell são amplas; os perfis definem limites de comportamento, não uma barreira técnica de segurança.

Instalação local, a partir da raiz de `tools/company-autopilot`: `python .copilot/minimal-team/install.py --apply`. Sem `--apply`, imprime a prévia. O instalador descobre o ID NVIDIA já cadastrado e não altera credenciais, modelos ou contas. Preserva o banco em backup consistente, desabilita rotinas anteriores sem excluir histórico, arquiva perfis anteriores e instala apenas os seis perfis globais. Registra execuções antigas pendentes de cancelamento em `installation.json`; o operador deve cancelá-las pela API do app e verificar o readback. Não marca execuções como sucesso por alteração de banco.

O relógio do computador deve usar UTC-4/America/Manaus, pois o app não armazena timezone por workflow. O Copilot App precisa estar aberto e o computador acordado.

Todas as rotinas verificam a janela 00:00–05:59:59 antes de trabalhar. Se o app disparar tarefa atrasada ao reabrir durante o dia, ela deve encerrar como `deferred_outside_night_window`, sem executar trabalho. A janela é instrução de comportamento, não um bloqueio técnico do scheduler.

Verificação: `python -m unittest discover -s .copilot/minimal-team -p test_install.py`, `python -m py_compile .copilot/minimal-team/install.py`, `git diff --check` e readback pela API do Copilot App. A suíte histórica `test_operations.py` requer `fcntl`/Linux e não roda no Windows; isso não foi alterado para instalar a equipe mínima.

Fontes: `team.json` e `agents/`. O marcador `__NVIDIA_PROVIDER__` é substituído na instalação. Não use templates diretamente como agentes sem renderizar. Não há execução automática no ato da instalação. Evidências ficam no Desktop/Chronokairo/minimal-team por papel.

Vínculos no Copilot App ([ADR 0002](../../docs/adr/0002-sector-project-bindings.md), atualizados pela [ADR 0005](../../docs/adr/0005-night-team-expansion.md)): comercial e payment → GitHub `chronokairo/chronokairo` (apps/crm e apps/payments); security → GitHub `chronokairo/kaide`; vigia, radar e briefing sem vínculo de projeto (globais, sem checkout próprio). São vínculos reais de `project_id` das automações, confirmados pelo app; os agentes continuam globais para poderem operar nos alvos autorizados. O kaide (`tools/company-autopilot`) guarda a configuração da equipe.

Conhecimento importado do vault: [consulta e recuperação no Supabase](KNOWLEDGE.md), conforme ADR 0003. Conteúdo em `ops_documents`; originais no Storage privado. A importação não cria nova automação.
