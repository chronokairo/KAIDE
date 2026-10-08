# ADR 0001 — Equipe mínima de três agentes na madrugada

- Data: 2026-10-07, America/Manaus.
- Estado: aceita pelo dono; configuração operacional verificada.

## Contexto

O Copilot App possuía oito perfis no projeto AI e seis automações habilitadas. O company-autopilot continha 41 perfis de uma equipe completa ainda não instalada nesta máquina. O dono pediu testar somente comercial, security e payment e depois determinou que todos rodassem somente de madrugada, com ADR, log e push.

## Decisão

Versionar a equipe mínima em `.copilot/minimal-team/`, com manifest, três templates de perfil e instalador específico. Os IDs de provider são descobertos no banco local; nenhum segredo, conta OAuth, ID privado de provider ou banco operacional entra no Git. Manter modelos já disponíveis: GLM-5.3 para comercial e security e Kimi-K3 para payment.

| Perfil | Frequência | Horário America/Manaus |
| --- | --- | --- |
| comercial | Diário | 01:00 |
| security | Semanal, segunda-feira | 00:00 |
| payment | Diário | 02:00 |

O comercial pesquisa demanda verificável, evita duplicatas e registra leads no CRM canônico GitHub chronokairo/crm. Falhas do CRM podem ser corrigidas em branch/worktree própria com testes e PR. Sem credencial/ferramenta ou acesso de escrita, registrar bloqueio; SQL/CSV não contam como cadastro realizado. Não há autorização para contato externo, merge ou deploy.

Security faz triagem semanal do catálogo e auditoria aprofundada rotativa de alvo prioritário, registrando commits e cobertura. Escopo por remote: GitHub chronokairo, GitLab chronokairo, GitHub rlv-projects e GitHub anamnesic. Não explorar produção nem revelar segredos. Correções ficam sujeitas a revisão independente/humana.

O pedido de payment inclui aquisição de criptomoeda, carteira e trade. A configuração implementada limita isso a pesquisa de oportunidades legítimas, carteira local/testnet e simulação de mercado. Custódia de fundos reais, carteira mainnet, investimento, ordens e transferências não são executados autonomamente. Essa diferença de escopo deve ser explícita em resultados e documentação. Limites dos perfis são comportamentais; acesso a shell não constitui sandbox financeiro.

Desativar automações antigas sem apagar execuções, inclusive falhas. Fazer backup SQLite consistente, transação, verificação de integridade e readback no app. Cancelar execuções antigas pela API de lifecycle do app; não converter execução interrompida em sucesso no banco. Arquivar os perfis antigos para deixar somente três agentes customizados ativos; preservar os perfis da equipe completa no repositório como histórico.

## Consequências e validação

O app deve mostrar somente três perfis globais e três automações habilitadas, todas na madrugada. Rotinas antigas podem permanecer visíveis como desativadas para preservar auditoria. A máquina deve usar UTC-4; o scheduler não possui timezone por workflow. O app precisa estar aberto e o computador acordado. Caso o equipamento esteja desligado, um scheduler pode executar tarefa atrasada ao reabrir; os prompts devem impedir execução fora da janela 00:00–05:59 Manaus e adiar o trabalho ao próximo ciclo.

Verificar integridade/FKs do banco, preservação de execuções antigas, agenda e modelos instalados, descoberta de agentes e readback dos workflows. Segurança tem primeira execução prevista para 2026-10-12 00:00 Manaus (04:00 UTC). Configuração não comprova cadastro de leads, achados, ganho financeiro ou entrega de produto; esses resultados exigem evidências de execução.
