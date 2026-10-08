# Avaliação operacional dos agentes Chronokairo — 2026-10-06

## Diagnóstico

A estrutura possui 41 perfis e 26 rotas, com responsabilidade, owner, modelo, ferramentas e critérios próprios. A separação entre implementação, revisão e QA, os handoffs e o registro de evidências são bons fundamentos. Porém, instruções de comportamento ainda substituem controles efetivos em pontos essenciais. Prioridade: estabilizar os agentes existentes antes de ampliar o catálogo.

Avaliação baseada em configuração, código, registros locais do Copilot, jobs e journal do systemd. Relatos escritos pelos agentes são evidência declarada, não confirmação independente de modelo efetivamente usado. Não é uma auditoria completa de segurança nem benchmark de modelos.

## Resultado observado da madrugada

| Rota | Duração aproximada do runtime | Resultado observado |
| --- | --- | --- |
| night-demand | 16 minutos | Bloqueio por 429; nenhuma demanda de compra registrada |
| night-discovery | 1h51 | Dois novos candidatos de anúncios de emprego, sem intenção de contratar consultoria confirmada |
| night-drafts | 27 minutos | Nenhum registro novo elegível; revisitou três rascunhos anteriores |
| night-brief | 1h26 | Relatório consolidado após tentativas e retomadas |

O ledger comercial contém cinco empresas e zero eventos comerciais registrados: três rascunhos anteriores e dois candidatos novos. Isso não mede recebimentos da Audiomed fora desse ledger, nem prova ausência de atividade externa. As quatro execuções ultrapassaram a meta de 15 minutos. Runtime completed não equivale a oportunidade, entrega aceita ou receita.

## Correções prioritárias

### P0 — Watchdog não consegue interromper sessões longas

`company.py:240` invoca `node` pelo PATH. O serviço systemd não configura o diretório NVM. O journal em 06/10 às 03:25 e 03:30 registra `[Errno 2] No such file or directory: node` e falha do serviço. Sucesso posterior sem sessões vencidas não comprova que a interrupção funciona.

Melhoria: resolver executável absoluto/configurado, tratar OSError e validar o encerramento pelo runtime. Aceite: teste no ambiente restrito do serviço confirma interrupção de uma sessão de teste vencida, preserva evidências e continua avaliando outros jobs após uma falha.

### P0 — Prazo pode reiniciar com outro job_id

`company.py:184–187` associa started_epoch ao job_id e só rejeita atualização running após 900 segundos. Retomadas com novo identificador dentro da mesma execução prolongaram descoberta e briefing.

Melhoria: prazo absoluto associado ao workflow_run_id, compartilhado por etapas, retomadas e ACP. Aceite: trocar job_id ou backend não renova o orçamento; conclusão tardia permanece identificada como tal e continuidade fica para um novo ciclo autorizado.

### P1 — Dependências são horários, não conclusão validada

A qualificação começou às 07:00Z; os dois candidatos novos só foram inseridos por volta de 07:49Z, antes da descoberta terminar às 07:51Z. O ciclo de rascunhos não os consumiu.

Melhoria: entrada identificada por lote/versão e condição de prontidão, com retomada idempotente. Encerrar rapidamente quando não existir trabalho novo, antes de chamar workers. Aceite: cada candidato elegível passa uma vez pela próxima etapa sem depender de descoberta terminar antes de um horário fixo.

### P1 — Modelo e ferramentas precisam ser comprovados no runtime

Perfis de qualification/SDR indicam GLM, mas o job-result de night-drafts declara Nemotron como modelo registrado. A descoberta relata fallback sem ferramentas para consultar fontes. Há sobrecarga e retries internos nos relatos, apesar da política de parar em 429.

Melhoria: registrar modelo solicitado e efetivo, ferramentas provisionadas e retries do SDK; testar capacidades antes de iniciar a etapa. Distinguir erro do relatório de seleção incorreta real. Aceite: uma execução demonstra modelo e capacidades compatíveis, com bloqueio rápido em quota indisponível. Não trocar modelos apenas por impressão de velocidade.

### P1 — Focar evidência de compra e reduzir bloqueios sem fundamento

Os dois novos candidatos vieram de vagas de emprego; permanecem outbound com fit zero. Não são compradores confirmados. O relatório de SDR transformou endereço físico e link de agenda ausentes em bloqueios genéricos, sem apresentar fonte normativa para a alegação legal. Esta avaliação não valida essa alegação.

Melhoria: separar contratação CLT/full-time de demanda por serviço, priorizar oportunidades com escopo e intenção explícitos, além de indicações e parceiros. Tratar link de agenda como recurso opcional; fundamentar exigências legais por país/canal antes de criar bloqueios. Identidade do remetente e autorização de envio continuam necessárias conforme a política vigente. Aceite: oportunidade tem fonte, trecho comprobatório, adequação, próximo passo e responsável; o relatório distingue candidato, comprador e cliente pagante.

### P1 — Validadores precisam garantir o que os prompts prometem

Em sales.py, daily_candidate_limit limita o tamanho de uma ingestão, não o total diário. Evidência de evento exige arquivo, mas não comprova semanticamente a ocorrência; o comando mark gera declaração do dono sem distinguir tecnicamente quem o executou. Não houve evento fraudulento observado: o ledger está sem eventos.

Melhoria: limite diário agregado, proveniência verificável dos eventos, separação entre declaração humana e observação automática, validação dos critérios de fit. Aceite: múltiplas ingestões não contornam o limite; agente não consegue atribuir a si uma confirmação humana apenas criando texto.

## Preferência aplicada durante esta avaliação

Por pedido do dono, tarefas mecânicas devem ser encaminhadas pelo coordenador para agy ou OpenCode via ACP: formatação, renomeações delimitadas, geração repetitiva conforme padrão aprovado, documentação e verificações já definidas. Usar um backend compatível por etapa, com escopo, restrições e aceite explícitos; verificar diff, testes e evidências. Workers devolvem a solicitação ao coordenador, sem delegação recursiva ou ampliação de permissões.

O agy usa ponte ACP local sobre CLI; OpenCode usa ACP stdio. Diagnósticos existentes indicam initialize_ok, mas não são benchmark de velocidade nem teste atual de execução completa. A preferência foi atualizada em AGENTS.md, POLICY.md e configure.py. O runtime compartilha a mesma POLICY.md por symlink. Nenhuma reinstalação global ou alteração do banco foi necessária.

Validação desta mudança: 11 testes de operações, 3 testes noturnos, compilação de configure.py e git diff --check passaram. Esses testes não cobrem a falha real de PATH no systemd, demonstrando a necessidade de validação de integração.

## Evidências locais

- `.copilot/chronokairo/company.py` e `systemd/chronokairo-automation-watchdog.service`.
- Journal do serviço chronokairo-automation-watchdog.service em 2026-10-06.
- `jobs/night-discovery-20261006T060013Z/discovery-attempt1-blocked.md` e estados das retomadas.
- `jobs/night-drafts-20261006T070226Z/job-result.md`.
- `jobs/night-brief-20261006T093015Z/control-audit.md`.
- `~/Desktop/Chronokairo/Comercial-Manha-2026-10-06-Analise.md`.
- Perfis em `.copilot/agents`, registry.json, sales.py e ledger local sales.db.

As correções prioritárias acima são recomendações pendentes; a alteração implementada nesta avaliação foi a preferência de encaminhamento ACP.
