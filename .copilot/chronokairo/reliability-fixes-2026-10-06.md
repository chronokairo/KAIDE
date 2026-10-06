# Correções operacionais — 2026-10-06

Aplicadas às 26 automações existentes, preservando modelos e horários. Backup SQLite: ~/.copilot/backups/reliability-20261006T111647247604Z/data.db. Integridade e readback dos prompts confirmados; aplicativo retornou app_readback=ok, managed_workflows=26.

- Watchdog resolve Node pelo PATH configurado dos backends, trata falha de executável sem abandonar os outros jobs e verifica status real após solicitar interrupção. Timer atualizado para um minuto. Serviço real terminou Result=success / ExecMainStatus=0; Node v24.21.0 executou com PATH restrito do serviço.
- Prazo associado ao início imutável do workflow no aplicativo. Trocar job_id não reinicia orçamento; conclusão tardia é bloqueada. ACP exige pai e worker, herda prazo e verifica ferramentas do perfil. O aceite distingue backend externo de modelo NVIDIA.
- Qualificação aguarda produtores ativos e lê fila persistida em ordem. Fila vazia encerra sem especialistas e não conta como entrega aceita. Não há disparo imediato por evento: entradas pendentes permanecem para o próximo ciclo agendado.
- Rotas incluem IDs completos de modelos e ferramentas. Aceite de workers internos consulta eventos subagent.completed; divergência sem fallback comprovado é rejeitada. Falta de ferramenta é explicitamente bloqueio ou demanda fontes verificadas do coordenador, nunca pesquisa simulada.
- Limite diário de candidatos agora considera todas as ingestões dentro de transação serializada. Score exige critérios com evidência e fonte; demanda exige pedido de fornecedor com trecho e data recente. Origem comercial é preservada ao atualizar.
- sales.py mark salva anotação não verificada sem promover estágio. A anotação não pode servir como recibo por sales.py event. Isso elimina a falsa atribuição automática ao dono, mas não cria autenticação forte entre processos do mesmo usuário do sistema; a veracidade semântica de comprovantes ainda exige revisão.
- Instruções priorizam pedidos de serviço em vez de vagas full-time isoladas. Link de agenda é opcional; exigências legais precisam de fundamentação por país/canal.

Validação: 42 testes passaram, incluindo regressões para deadline, modelo divergente, PATH restrito, continuidade após OSError, limite diário, evidência comercial, dependência entre rotas e fila vazia. Scripts Python compilam e git diff --check passou. A interrupção foi exercitada em teste controlado com confirmação de status; não foi provocada uma execução comercial real de 15 minutos. A próxima madrugada ainda será necessária para observar o resultado completo com os providers reais. Retentativas internas e disponibilidade do NVIDIA continuam dependências do runtime.

A preferência por agy/OpenCode via ACP permanece aplicada para trabalho mecânico. As mudanças de campanha WhatsApp feitas simultaneamente em outra sessão foram preservadas.
