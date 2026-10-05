# Chronokairo Company Autopilot

33 agentes (1 principal, 6 orquestradores de domínio, 24 workers e 2 auditores), 17 automações, catálogo de projetos GitHub/GitLab, delegação ACP e documentos no Desktop.

## Operação autorizada

Todos os projetos de github.com/chronokairo e gitlab.com/chronokairo, incluindo subgrupos. Os agentes podem descobrir oportunidades de receita, criar projetos privados, desenvolver, testar, commitar em branches ck/* e abrir PRs/MRs. Cada ciclo escolhe uma entrega pequena e continua o backlog, sem inventar demanda ou tarefas duplicadas. Coder, Reviewer e QA são independentes.

Dinheiro real, merge/deploy em produção, mainnet, concessão de acesso, decisões sobre pessoas e mensagens externas exigem autorização específica. Ausência de resposta não autoriza. Payments pode implementar crypto quando justificado: checkout, adapters, webhooks idempotentes, validação, reconciliação e testes em sandbox/testnet. Não há autorização para trading, mineração, custódia ou transferências reais.

## Modelos e backends

Coordenação/planos/revisão: z-ai/glm-5.3. Tarefas pequenas: z-ai/glm-5.3-flash. Código/payments: moonshotai/kimi-k3. QA: deepseek-ai/deepseek-v4.1-flash. Segurança/auditoria especializada: nvidia/nemotron-3-ultra-550b-a55b, com fallback explícito para GLM em sobrecarga. A distribuição é inicial, sem benchmark. Credenciais e modelos já cadastrados foram preservados. Perfis e workflows usam IDs completos provider_id/model_id, evitando fallback acidental para o catálogo GitHub.

Codex, Claude, OpenCode e agy são backends de execução via terminal, não providers de modelo no seletor do app. OpenCode tem ACP nativo; Codex e Claude usam adaptadores ACP fixados no package.json/lockfile; agy usa uma ponte local ACP sobre sua CLI print, sem alegar suporte ACP nativo. Os runtimes usam suas credenciais e modelos existentes, sem copiá-los entre sistemas.

O runner acp.py valida o remote Chronokairo, adquire lock, cria worktree ck/<job_id>, limita a sessão ACP inteira a 15 minutos, captura evidências e registra bloqueios. Um end_turn não comprova aceite; o coordenador precisa verificar diff e testes. Inicialização ACP não comprova inferência ou acesso a todos os modelos. Para revisão, inclua o diff/commit específico nas fontes: a worktree começa em HEAD.

```bash
python3 ~/.copilot/chronokairo/acp.py diagnose
python3 ~/.copilot/chronokairo/acp.py run --engine codex --cwd /repo/chronokairo --job delivery-YYYYMMDDTHHMMSSZ --task-file /caminho/handoff.json
```

Handoff: objective, scope, sources, acceptance, allowed_tools e role (coder/reviewer/qa/analyst). Prefira Codex para código, Claude para revisão independente e os demais conforme capacidade/disponibilidade; não invoque todos a cada job. Falhas exigem evidência e no máximo uma alternativa autorizada.

## Agenda

Horário America/Caracas. O Copilot App precisa estar aberto e o computador acordado.

| Hora | Rotina diária |
| --- | --- |
| 07:45 | Direção e prioridades |
| 08:00 | Descoberta e qualificação |
| 08:15 | Triagem de issues |
| 08:30 | Propostas e follow-up |
| 09:00 | Requisitos e especificação |
| 09:30 | Backlog |
| 10:00 | Implementação verificada |
| 11:00 | Revisão independente |
| 11:30 | Payments / crypto quando justificado |
| 12:00 | Suporte |
| 13:00 | Faturamento |
| 13:30 | Conciliação |
| 14:00 | Onboarding e acesso |
| 15:00 | Nova oportunidade e projeto |
| 17:00 | Auditoria |
| 18:00 | Relatório ao dono |

Há uma rotina manual adicional para incidentes. Dados ausentes de CRM, tickets, extratos ou políticas são dependências; código do produto não substitui dados operacionais reais.

## Desktop e monitoramento

~/Desktop/Chronokairo/PENDENCIAS.md contém dependências, opções, recomendação e próximo passo para o dono. Relatorio-YYYY-MM-DD.md reúne atividades efetivamente reportadas e links; não presume receita ou aprovação.

```bash
python3 ~/.copilot/chronokairo/company.py inventory
python3 ~/.copilot/chronokairo/company.py report --agent ck-coder --job delivery-YYYYMMDDTHHMMSSZ --kind blocker --message 'Dependência, motivo, opções, recomendação e próximo passo.'
```

chronokairo-automation-watchdog.timer verifica falhas a cada cinco minutos, independentemente da inferência. Detecta workflows falhos, erros de modelos/subagentes em sessões ativas e agendas atrasadas; deduplica e escreve no Desktop. Não é um segundo scheduler de negócio.

## Fonte, instalação e recuperação

A fonte canônica é env/.copilot/chronokairo; ~/.copilot/chronokairo aponta para ela por symlink. .env, bancos, backups, histórico, inventário privado e dependências são ignorados pelo Git. Os .env locais existentes foram preservados.

```bash
python3 .copilot/chronokairo/install.py
python3 .copilot/chronokairo/configure.py
python3 .copilot/chronokairo/configure.py --apply
```

configure.py valida em cópia SQLite temporária e cria backup consistente antes de aplicar. A reaplicação substitui prompts e agendas das automações gerenciadas. O bug de carregamento era agent_scope=user: o app exige global/project nessa coluna, embora o runtime descreva os perfis pessoais como user. A configuração usa global.

Backups privados ficam em ~/.copilot/backups, fora do repositório. Para recuperar, feche os processos que usam o banco e restaure pela API SQLite backup. Não misture snapshots com WAL de outra execução. O exemplo Issue triage foi removido após backup e verificação.

Ferramentas são filtradas nos perfis; shell e runtimes externos continuam com as permissões de seus ambientes. Worktree e prompts não são um sandbox completo. SLA, orçamento interno, sequências e gates são instruções; o runner ACP impõe timeout e os helpers impõem namespace/locks em suas próprias operações. Comandos fora dos helpers não recebem essas garantias automaticamente.

### Controles operacionais

Perfis leem a política comum de `POLICY.md`; operações de inventário, locks e
relatórios pertencem aos coordenadores. Finance usa ck-ai como base de início do
app e consulta o projeto GitLab `chronokairo/finance`; o cadastro Finance não
mantém vínculo GitHub de outra organização. Todos os origins são verificados
pelo instalador antes de alterar o cadastro.

`company.py job --job <id> --route <rota> --status running` inicia o controle.
Cada etapa usa `--step <agent_id>` e deve concluir com `--status completed
--accepted --evidence <arquivo>`. Etapas anteriores precisam ter sido aceitas;
o job só conclui depois de todas as etapas. Após 15 minutos o helper rejeita
novos estados running; registre blocked e continue em um novo ciclo delimitado.
Isso não cancela a sessão Copilot: o watchdog alerta execuções longas e o
coordenador deve encerrar o ciclo. Jobs em andamento não são interrompidos pela
instalação. Estados históricos permanecem preservados.

`company.py metrics` consulta o histórico em modo somente leitura e distingue
status do runtime, jobs com aceite registrado, duração e execuções acima de
15 minutos. Custos e tokens ausentes permanecem unknown. Jobs antigos sem
control.json não são considerados aceitos por inferência.

ACP limita a sessão inteira a 15 minutos e a 12 solicitações de permissão.
Autoriza solicitações estruturadas conforme allowed_tools/papel e paths dentro
da worktree, rejeitando chamadas opacas. Reviewer/analyst não recebem escrita
ou shell; QA só pode editar arquivos de testes. Shell aprovado se limita a
comandos explícitos de verificação local. Publicação cabe ao coordenador após
verificar o resultado. Esses controles cobrem solicitações ACP recebidas, não
operações que um backend execute sem pedir permissão; scripts npm e processos
locais não constituem sandbox. Falta de capacidade é registrada como bloqueio.

Validação inclui integridade SQLite, foreign keys, modelos cadastrados, leitura real das automações pela API do app, descoberta de agentes, autenticação GitHub/GitLab, acesso git a ai/payments, locks e deduplicação/redação de relatórios. Um ciclo real de prioridades foi iniciado; resultados de negócio não são presumidos neste README.

Referências: [Copilot agents](https://docs.github.com/en/copilot/reference/custom-agents-configuration), [OpenAI Docs: Codex app-server](https://learn.chatgpt.com/docs/app-server), [Codex ACP](https://github.com/agentclientprotocol/codex-acp), [Claude ACP](https://github.com/agentclientprotocol/claude-agent-acp).
