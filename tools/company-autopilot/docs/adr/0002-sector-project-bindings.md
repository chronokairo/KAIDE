# ADR 0002 — Vincular cada automação ao projeto do setor

- Data: 2026-10-07, America/Manaus.
- Estado: aceita e aplicada.

## Contexto

O dono pediu vincular os agentes ao chronokairo/ai ou aos projetos específicos de cada setor. Comercial já tinha project_id do CRM e payment do payments. Security usava company-autopilot como base, misturando configuração da equipe e alvo de produto.

## Decisão

Manter comercial → GitHub chronokairo/crm e payment → GitHub chronokairo/payments. Alterar security → GitHub chronokairo/ai, como base da sessão e primeiro contexto de auditoria. O escopo autorizado continua abrangendo os demais projetos; correções pertencem ao checkout/worktree do respectivo alvo. Company-autopilot permanece fonte da configuração, não base da execução security.

O instalador resolve o project_id pelo remote canônico do checkout cadastrado, não pelo nome da pasta. Perfis globais e vínculos de projeto são complementares. Preservar os três IDs das automações, as agendas de madrugada, os modelos, as credenciais e o histórico.

## Verificação

Teste do instalador verifica os três project_ids. Readback da API do Copilot App confirma os vínculos no aplicativo. Instalação não dispara os agentes durante o dia.
