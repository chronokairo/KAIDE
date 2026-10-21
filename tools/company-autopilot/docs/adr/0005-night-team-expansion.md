# ADR 0005 — Expansão da equipe noturna para seis agentes

- Data: 2026-10-20, America/Manaus.
- Estado: aceita pelo dono; versionada no kaide (tools/company-autopilot) em 2026-10-21.

## Contexto

Em 2026-10-20 o dono pediu automações cruciais diárias na madrugada. A análise dos perfis ativos da ADR 0001 identificou lacunas de cobertura: saúde de CI e produção de ~50 repositórios, triagem da comunidade open source e consolidação matinal dos relatórios.

O antigo repositório company-autopilot foi absorvido via subtree para `tools/company-autopilot/` no monorepo kaide (ADRs 0044 e 0045 do kaide) e removido do GitHub; o kaide é agora a casa canônica da equipe e o bloqueio de remote que adiou esta versão ficou resolvido. Nesta reorganização: o antigo repo "ai" foi renomeado para kaide; comercial e payment passaram a trabalhar no monorepo `chronokairo/chronokairo` (apps/crm e apps/payments), cujos antigos repos crm e payments saíram do GitHub; o catálogo da empresa (company-context.json, sales-config.json) vive em `tools/company-autopilot/.copilot/chronokairo/` neste repositório.

## Decisão

Expandir a equipe noturna de três para seis agentes, mantendo as fontes em `.copilot/minimal-team/` (team.json, agents/ e install.py) e os três papéis da ADR 0001 com os mesmos horários.

| Perfil | Frequência | Horário America/Manaus | Base | Papel |
| --- | --- | --- | --- | --- |
| security | Semanal, segunda-feira | 00:00 | kaide | Auditoria (mantido da ADR 0001) |
| comercial | Diário | 01:00 | monorepo chronokairo (apps/crm) | Prospecção e CRM (mantido da ADR 0001) |
| payment | Diário | 02:00 | monorepo chronokairo (apps/payments) | Cripto em ambiente de teste (mantido da ADR 0001) |
| vigia | Diário | 03:00 | global (sem checkout próprio) | Sentinela de CI e saúde operacional |
| radar | Diário | 04:00 | global (sem checkout próprio) | Open source e comunidade |
| briefing | Diário | 05:00 | global (sem checkout próprio) | Consolidação matinal |

Vigia varre CI, dependências, PRs travados, issues e health checks de produção dos repositórios Chronokairo e rlv-projects; corrige somente quebras triviais em branch/worktree própria, com teste local e PR, sem merge, deploy ou force-push. Radar tria issues, PRs externos e sinais de comunidade nos repositórios públicos (morluto, axiom, anamnesic, loopedsouls, manausdev) e apenas rascunha respostas, sem envio externo nem alteração de issues, PRs ou labels. Briefing consolida os relatórios da madrugada e o estado do GitHub em um briefing único com ações do dono, sem alterar repositórios.

A agenda completa ocupa a janela 00:00–05:59 America/Manaus, junto com o AXIOM 00:00 diário (workflow já existente do projeto axiom). Vigia, radar e briefing são globais: não têm checkout próprio (repository vazio no manifest) e descobrem os alvos pelos remotes canônicos. Radar usa GLM-5.3 porque o Kimi-K3 não existe mais no provedor. Os prompts carregam a guarda da janela: fora dela, sem pedido explícito do dono, o agente registra defer e não executa catch-up durante o dia. Relatórios continuam em Desktop/Chronokairo/minimal-team/<agente>; perfis globais em ~/.copilot/agents/.

## Consequências e validação

O instalador passa a exigir exatamente os seis agentes; o teste verifica os seis perfis instalados e os vínculos de projeto — comercial e payment no monorepo chronokairo, security no kaide, vigia/radar/briefing sem project_id. A seção "Configuração ativa" do AGENTS.md volta a apontar para esta ADR. O app deve mostrar seis perfis globais e seis automações habilitadas, todas na madrugada. Configuração não comprova achados, correções ou entregas; esses resultados exigem evidências de execução por ciclo.
